from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from db import get_db
from functools import lru_cache

router = APIRouter(prefix="/api")

# Load once at startup — not on every request
# First run downloads the model (~90MB), cached after that
@lru_cache(maxsize=1)
def get_model():
    print("Loading embedding model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    print("Model loaded.")
    return model

class SearchRequest(BaseModel):
    query: str
    state: str | None = None
    min_wage: float | None = None
    limit: int = 20

@router.post("/search")
async def search_sponsors(req: SearchRequest, db: Session = Depends(get_db)):
    model = get_model()

    # Embed the user's query into 384-dim vector
    query_vec = model.encode([req.query])[0].tolist()

    # Build WHERE clause dynamically based on filters
    filters = ["case_status = 'CERTIFIED'"]
    params  = {"vec": str(query_vec), "limit": req.limit}

    if req.state:
        filters.append("UPPER(worksite_state) = :state")
        params["state"] = req.state.upper()

    if req.min_wage:
        filters.append("wage_rate >= :min_wage")
        params["min_wage"] = req.min_wage

    where = " AND ".join(filters)

    rows = db.execute(text(f"""
        SELECT
            employer_name,
            soc_title,
            worksite_city,
            worksite_state,
            COUNT(*)         AS filing_count,
            AVG(wage_rate)   AS avg_wage,
            MAX(fiscal_year) AS latest_year,
            1 - (embedding <=> :vec::vector) AS similarity
        FROM lca_records
        WHERE {where}
        GROUP BY
            employer_name, soc_title,
            worksite_city, worksite_state, embedding
        ORDER BY similarity DESC
        LIMIT :limit
    """), params).fetchall()

    return {
        "query": req.query,
        "total": len(rows),
        "results": [
            {
                "employer":     r.employer_name,
                "role":         r.soc_title,
                "city":         r.worksite_city,
                "state":        r.worksite_state,
                "filings":      int(r.filing_count),
                "avg_wage":     round(float(r.avg_wage)) if r.avg_wage else None,
                "latest_year":  r.latest_year,
                "match_score":  round(float(r.similarity), 3),
            }
            for r in rows
        ],
    }

@router.get("/health")
async def health():
    return {"status": "ok"}