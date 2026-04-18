import pandas as pd
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from db import engine
import sys

MODEL = SentenceTransformer("all-MiniLM-L6-v2")

def normalize_wage(row):
    """Convert any wage unit to annual salary."""
    try:
        wage = float(row["WAGE_RATE_OF_PAY_FROM"])
    except (ValueError, TypeError):
        return None
    unit = str(row.get("WAGE_UNIT_OF_PAY", "")).upper().strip()
    if unit == "HOUR":  return wage * 2080
    if unit == "WEEK":  return wage * 52
    if unit == "MONTH": return wage * 12
    return wage  # YEAR — already annual

def build_embed_text(row):
    """
    We combine job title + employer + location + wage into one string.
    Why: semantic search matches meaning, not keywords.
    'ML Engineer at Google in Seattle $180k' will match
    a query like 'machine learning jobs big tech Pacific Northwest'
    even with zero keyword overlap.
    """
    wage     = f"${int(row['wage_annual']):,}" if row["wage_annual"] else "salary not disclosed"
    city     = str(row.get("WORKSITE_CITY",  "") or "").strip()
    state    = str(row.get("WORKSITE_STATE", "") or "").strip()
    soc      = str(row.get("SOC_TITLE",      "") or "").strip()
    job      = str(row.get("JOB_TITLE",      "") or "").strip()
    employer = str(row.get("EMPLOYER_NAME",  "") or "").strip()

    # Use JOB_TITLE if available, fall back to SOC_TITLE
    # JOB_TITLE is the actual title the employer used (e.g. "Senior ML Engineer")
    # SOC_TITLE is the standardized DOL category (e.g. "Software Developers")
    # Having both in the embed text helps match either way
    title = f"{job} ({soc})" if job and soc and job != soc else (job or soc)

    return f"{title} at {employer} in {city}, {state} — {wage}"

def run_pipeline(filepath: str, fiscal_year: int):
    print(f"\nLoading {filepath}...")

    try:
        df = pd.read_excel(filepath, engine="openpyxl")
    except Exception as e:
        print(f"Error reading file: {e}")
        sys.exit(1)

    print(f"  Total rows: {len(df):,}")

    # Only certified petitions — withdrawn/denied are useless for job seekers
    df = df[df["CASE_STATUS"].str.upper() == "CERTIFIED"].copy()
    print(f"  Certified: {len(df):,}")

    if len(df) == 0:
        print("No certified records found.")
        return

    # Normalize all wages to annual
    df["wage_annual"] = df.apply(normalize_wage, axis=1)

    # Build the text we'll embed
    df["embed_text"] = df.apply(build_embed_text, axis=1)

    # Show a few examples so you can see what gets embedded
    print("\n  Sample embed texts:")
    for t in df["embed_text"].head(3).tolist():
        print(f"    → {t}")

    # Embed all records
    texts = df["embed_text"].tolist()
    print(f"\n  Embedding {len(texts):,} records...")
    embeddings = MODEL.encode(
        texts,
        batch_size=256,
        show_progress_bar=True,
        convert_to_numpy=True
    )

    # Insert to pgvector in chunks of 500
    print("\n  Inserting to database...")
    inserted = 0
    skipped  = 0

    with engine.connect() as conn:
        for i in range(0, len(df), 500):
            batch_df  = df.iloc[i:i+500]
            batch_emb = embeddings[i:i+500]

            for (_, row), emb in zip(batch_df.iterrows(), batch_emb):
                try:
                    conn.execute(text("""
                        INSERT INTO lca_records
                            (employer_name, soc_code, soc_title,
                             wage_rate, worksite_city, worksite_state,
                             case_status, begin_date, fiscal_year, embedding)
                        VALUES
                            (:employer, :soc_code, :soc_title,
                             :wage, :city, :state,
                             :status, :begin_date, :fy, CAST(:emb AS vector))
                    """), {
                        "employer":  str(row.get("EMPLOYER_NAME", ""))[:255],
                        "soc_code":  str(row.get("SOC_CODE",      ""))[:20],
                        "soc_title": str(row.get("SOC_TITLE",     ""))[:255],
                        "wage":      row["wage_annual"],
                        "city":      str(row.get("WORKSITE_CITY",  ""))[:100],
                        "state":     str(row.get("WORKSITE_STATE", ""))[:2],
                        "status":    str(row.get("CASE_STATUS",   ""))[:50],
                        "begin_date":row.get("BEGIN_DATE"),
                        "fy":        fiscal_year,
                        "emb":       str(emb.tolist()),
                    })
                    inserted += 1
                except Exception:
                    skipped += 1
                    continue

            conn.commit()
            pct = round((i + 500) / len(df) * 100)
            print(f"    [{pct:>3}%] {min(i+500, len(df)):,} / {len(df):,} records")

    print(f"\nDone. Inserted: {inserted:,}  Skipped: {skipped:,}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python ingestion/pipeline.py <path-to-xlsx> <fiscal_year>")
        print("Example: python ingestion/pipeline.py ../data/LCA_Disclosure_Data_FY2025_Q4.xlsx 2025")
        sys.exit(1)

    filepath = sys.argv[1]
    fy       = int(sys.argv[2]) if len(sys.argv) > 2 else 2025
    run_pipeline(filepath, fy)
