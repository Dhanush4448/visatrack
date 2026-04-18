from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastembed import TextEmbedding
from db import get_db
from routers.search import get_model
import pdfplumber
import docx2txt
import tempfile
import os

router = APIRouter(prefix="/api")

def extract_text(file_bytes: bytes, filename: str) -> str:
    suffix = os.path.splitext(filename)[1].lower()
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    try:
        if suffix == ".pdf":
            text = ""
            with pdfplumber.open(tmp_path) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"
            return text.strip()
        elif suffix in (".docx", ".doc"):
            return docx2txt.process(tmp_path).strip()
        else:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX supported")
    finally:
        os.unlink(tmp_path)

@router.post("/match")
async def match_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")

    resume_text = extract_text(contents, file.filename)
    if not resume_text:
        raise HTTPException(status_code=400, detail="Could not extract text from file")

    resume_text = resume_text[:2000]

    model = get_model()
    resume_vec = str(list(model.embed([resume_text]))[0].tolist())

    rows = db.execute(text("""
        SELECT
            employer_name, soc_title, worksite_city, worksite_state,
            COUNT(*) AS filing_count,
            AVG(wage_rate) AS avg_wage,
            MAX(fiscal_year) AS latest_year,
            AVG(1 - (embedding <=> CAST(:vec AS vector))) AS similarity
        FROM lca_records
        WHERE LOWER(case_status) = 'certified'
        GROUP BY employer_name, soc_title, worksite_city, worksite_state
        ORDER BY similarity DESC
        LIMIT 20
    """), {"vec": resume_vec}).fetchall()

    return {
        "filename": file.filename,
        "text_preview": resume_text[:200] + "...",
        "total": len(rows),
        "matches": [
            {
                "employer": r.employer_name,
                "role": r.soc_title,
                "city": r.worksite_city,
                "state": r.worksite_state,
                "filings": int(r.filing_count),
                "avg_wage": round(float(r.avg_wage)) if r.avg_wage else None,
                "latest_year": r.latest_year,
                "match_score": round(float(r.similarity), 3),
            }
            for r in rows
        ],
    }