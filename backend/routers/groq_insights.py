from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel
from db import get_db
from groq import Groq
import os
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(prefix="/api")

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class InsightRequest(BaseModel):
    employer: str
    role: str
    city: str
    state: str
    avg_wage: float | None = None
    filings: int = 1

@router.post("/insight")
async def get_insight(req: InsightRequest, db: Session = Depends(get_db)):
    # Get more context from DB about this employer
    rows = db.execute(text("""
        SELECT soc_title, wage_rate, fiscal_year, worksite_city, worksite_state
        FROM lca_records
        WHERE LOWER(employer_name) = LOWER(:employer)
        AND LOWER(case_status) = 'certified'
        ORDER BY fiscal_year DESC
        LIMIT 10
    """), {"employer": req.employer}).fetchall()

    history = "\n".join([
        f"- {r.soc_title} in {r.worksite_city}, {r.worksite_state} — ${int(r.wage_rate):,} (FY{r.fiscal_year})"
        for r in rows
    ]) if rows else "No additional history found."

    prompt = f"""You are an H1B visa expert helping an international student evaluate job opportunities.

Employer: {req.employer}
Role: {req.role}
Location: {req.city}, {req.state}
Average Wage: ${int(req.avg_wage):,} if {req.avg_wage} else "Not disclosed"
Total H1B Filings: {req.filings}

Recent filing history:
{history}

In 3-4 sentences, explain:
1. Whether this is a reliable H1B sponsor based on the data
2. What the wage tells us about the role level
3. One thing to watch out for or investigate further

Be direct and specific. No generic advice."""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
        temperature=0.3,
    )

    return {
        "employer": req.employer,
        "insight": response.choices[0].message.content.strip(),
        "filing_history": [
            {
                "role": r.soc_title,
                "city": r.worksite_city,
                "state": r.worksite_state,
                "wage": int(r.wage_rate) if r.wage_rate else None,
                "year": r.fiscal_year,
            }
            for r in rows
        ]
    }