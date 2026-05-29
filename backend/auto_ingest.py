import os
import sys
import httpx
import pandas as pd
from bs4 import BeautifulSoup
from sqlalchemy import text
from db import engine
from ingestion.pipeline import run_pipeline
from datetime import datetime

DOL_PAGE = "https://www.dol.gov/agencies/eta/foreign-labor/performance"
DOWNLOAD_DIR = os.path.dirname(os.path.abspath(__file__))

def get_latest_lca_files():
    """Scrape DOL page and find all LCA Excel file URLs."""
    print("Checking DOL page for new LCA files...")
    headers = {"User-Agent": "Mozilla/5.0"}
    res = httpx.get(DOL_PAGE, headers=headers, follow_redirects=True, timeout=30)
    soup = BeautifulSoup(res.text, "html.parser")
    
    lca_files = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        text_content = a.get_text().strip()
        if "LCA_D" in text_content and ".xlsx" in text_content:
            # Build full URL
            if href.startswith("http"):
                full_url = href
            else:
                full_url = f"https://www.dol.gov{href}"
            lca_files.append({
                "filename": text_content,
                "url": full_url
            })
    
    return lca_files

def setup_ingestion_log():
    """Create ingestion log table if it doesn't exist."""
    with engine.connect() as conn:
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS ingestion_log (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                url TEXT,
                ingested_at TIMESTAMP DEFAULT NOW(),
                records_added INTEGER,
                fiscal_year INTEGER
            )
        """))
        conn.commit()
    print("Ingestion log table ready.")

def already_ingested(filename: str) -> bool:
    """Check if this file has already been ingested."""
    with engine.connect() as conn:
        result = conn.execute(text(
            "SELECT 1 FROM ingestion_log WHERE filename = :f"
        ), {"f": filename}).fetchone()
    return result is not None

def log_ingestion(filename: str, url: str, records: int, fiscal_year: int):
    """Log successful ingestion."""
    with engine.connect() as conn:
        conn.execute(text("""
            INSERT INTO ingestion_log (filename, url, records_added, fiscal_year)
            VALUES (:f, :u, :r, :fy)
            ON CONFLICT (filename) DO NOTHING
        """), {"f": filename, "u": url, "r": records, "fy": fiscal_year})
        conn.commit()

def extract_fiscal_year(filename: str) -> int:
    """Extract fiscal year from filename like LCA_Disclosure_Data_FY2026_Q2.xlsx"""
    try:
        parts = filename.split("FY")
        if len(parts) > 1:
            return int(parts[1][:4])
    except:
        pass
    return datetime.now().year

def download_file(url: str, filename: str) -> str:
    """Download file and return local path."""
    local_path = os.path.join(DOWNLOAD_DIR, filename)
    print(f"Downloading {filename}...")
    
    headers = {"User-Agent": "Mozilla/5.0"}
    with httpx.stream("GET", url, headers=headers, follow_redirects=True, timeout=300) as r:
        with open(local_path, "wb") as f:
            for chunk in r.iter_bytes(chunk_size=8192):
                f.write(chunk)
    
    size_mb = os.path.getsize(local_path) / 1024 / 1024
    print(f"Downloaded: {size_mb:.1f} MB")
    return local_path

def run_auto_ingest():
    """Main function - check for new files and ingest them."""
    print(f"\n{'='*50}")
    print(f"VisaTrack Auto-Ingest — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*50}\n")
    
    # Setup log table
    setup_ingestion_log()
    
    # Get available files from DOL
    lca_files = get_latest_lca_files()
    
    if not lca_files:
        print("No LCA files found on DOL page.")
        return
    
    print(f"Found {len(lca_files)} LCA file(s) on DOL page:")
    for f in lca_files:
        print(f"  - {f['filename']}")
    
    # Check which ones are new
    new_files = [f for f in lca_files if not already_ingested(f["filename"])]
    
    if not new_files:
        print("\nNo new files to ingest. Everything is up to date.")
        return
    
    print(f"\n{len(new_files)} new file(s) to ingest:")
    for f in new_files:
        print(f"  - {f['filename']}")
    
    # Ingest each new file
    for file_info in new_files:
        filename = file_info["filename"]
        url = file_info["url"]
        fiscal_year = extract_fiscal_year(filename)
        
        print(f"\nIngesting {filename} (FY{fiscal_year})...")
        
        try:
            # Download
            local_path = download_file(url, filename)
            
            # Count records before
            with engine.connect() as conn:
                before = conn.execute(text("SELECT COUNT(*) FROM lca_records")).scalar()
            
            # Run pipeline
            run_pipeline(local_path, fiscal_year)
            
            # Count records after
            with engine.connect() as conn:
                after = conn.execute(text("SELECT COUNT(*) FROM lca_records")).scalar()
            
            records_added = after - before
            print(f"Records added: {records_added:,}")
            
            # Log it
            log_ingestion(filename, url, records_added, fiscal_year)
            print(f"Logged ingestion of {filename}")
            
            # Clean up downloaded file to save disk space
            os.remove(local_path)
            print(f"Cleaned up {filename}")
            
        except Exception as e:
            print(f"Error ingesting {filename}: {e}")
            continue
    
    print(f"\nAuto-ingest complete!")

if __name__ == "__main__":
    run_auto_ingest()