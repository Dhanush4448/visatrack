from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from db import get_db
from functools import lru_cache
from dotenv import load_dotenv
import httpx
import os

load_dotenv()

router = APIRouter(prefix="/api")

HF_TOKEN = os.getenv("HF_TOKEN")
HF_MODEL = "BAAI/bge-small-en-v1.5"
HF_URL = f"https://router.huggingface.co/hf-inference/models/{HF_MODEL}"

def get_embedding(text: str) -> list:
    response = httpx.post(
        HF_URL,
        headers={"Authorization": f"Bearer {HF_TOKEN}"},
        json={"inputs": text},
        timeout=30,
    )
    return response.json()

class SearchRequest(BaseModel):
    query: str
    state: str | None = None
    min_wage: float | None = None
    limit: int = 20

@router.post("/search")
async def search_sponsors(req: SearchRequest, db: Session = Depends(get_db)):
    query_vec = str(get_embedding(req.query))
    params = {"vec": query_vec, "limit": req.limit}
    state_filter = ""
    wage_filter = ""
    if req.state:
        state_filter = "AND UPPER(worksite_state) = :state"
        params["state"] = req.state.upper()
    if req.min_wage:
        wage_filter = "AND wage_rate >= :min_wage"
        params["min_wage"] = req.min_wage
    rows = db.execute(text(f"""
        SELECT
            employer_name, soc_title, worksite_city, worksite_state,
            COUNT(*) AS filing_count,
            AVG(wage_rate) AS avg_wage,
            MAX(fiscal_year) AS latest_year,
            AVG(1 - (embedding <=> CAST(:vec AS vector))) AS similarity
        FROM lca_records
        WHERE LOWER(case_status) = 'certified'
        {state_filter}
        {wage_filter}
        GROUP BY employer_name, soc_title, worksite_city, worksite_state
        ORDER BY similarity DESC
        LIMIT :limit
    """), params).fetchall()
    return {
        "query": req.query,
        "total": len(rows),
        "results": [
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

@router.get("/health")
async def health():
    return {"status": "ok"}