from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from db import get_db

router = APIRouter(prefix="/api")

@router.get("/employer/{employer_name}")
async def get_employer_profile(employer_name: str, db: Session = Depends(get_db)):
    # Get all filings for this employer
    filings = db.execute(text("""
        SELECT
            soc_title,
            wage_rate,
            worksite_city,
            worksite_state,
            fiscal_year,
            begin_date
        FROM lca_records
        WHERE LOWER(employer_name) = LOWER(:name)
        AND LOWER(case_status) = 'certified'
        ORDER BY fiscal_year DESC, wage_rate DESC
    """), {"name": employer_name}).fetchall()

    if not filings:
        return {"error": "Employer not found"}

    wages = [float(r.wage_rate) for r in filings if r.wage_rate]
    
    # Group by role
    roles = {}
    for r in filings:
        role = r.soc_title or "Unknown"
        if role not in roles:
            roles[role] = 0
        roles[role] += 1

    # Group by city
    cities = {}
    for r in filings:
        city = f"{r.worksite_city}, {r.worksite_state}"
        if city not in cities:
            cities[city] = 0
        cities[city] += 1

    # Group by year
    by_year = {}
    for r in filings:
        year = str(r.fiscal_year)
        if year not in by_year:
            by_year[year] = 0
        by_year[year] += 1

    return {
        "employer": employer_name,
        "total_filings": len(filings),
        "avg_wage": round(sum(wages) / len(wages)) if wages else None,
        "min_wage": round(min(wages)) if wages else None,
        "max_wage": round(max(wages)) if wages else None,
        "top_roles": sorted(roles.items(), key=lambda x: x[1], reverse=True)[:5],
        "top_cities": sorted(cities.items(), key=lambda x: x[1], reverse=True)[:5],
        "by_year": by_year,
        "recent_filings": [
            {
                "role": r.soc_title,
                "wage": round(float(r.wage_rate)) if r.wage_rate else None,
                "city": r.worksite_city,
                "state": r.worksite_state,
                "year": r.fiscal_year,
            }
            for r in filings[:20]
        ]
    }