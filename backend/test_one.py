import pandas as pd
from sentence_transformers import SentenceTransformer
from sqlalchemy import text
from db import engine

MODEL = SentenceTransformer("all-MiniLM-L6-v2")

df = pd.read_excel('../data/LCA_Disclosure_Data_FY2025_Q4.xlsx', engine='openpyxl')
df = df[df['CASE_STATUS'].str.upper() == 'CERTIFIED'].copy()
df['wage_annual'] = df['WAGE_RATE_OF_PAY_FROM'].astype(float)

row = df.iloc[0]
emb = MODEL.encode([str(row.get('JOB_TITLE', 'Engineer'))])[0]

with engine.connect() as conn:
    conn.execute(text('''
        INSERT INTO lca_records
            (employer_name, soc_code, soc_title, wage_rate, worksite_city, worksite_state, case_status, begin_date, fiscal_year, embedding)
        VALUES
            (:employer, :soc_code, :soc_title, :wage, :city, :state, :status, :begin_date, :fy, :emb::vector)
    '''), {
        'employer':  str(row.get('EMPLOYER_NAME', ''))[:255],
        'soc_code':  str(row.get('SOC_CODE', ''))[:20],
        'soc_title': str(row.get('SOC_TITLE', ''))[:255],
        'wage':      float(row['WAGE_RATE_OF_PAY_FROM']),
        'city':      str(row.get('WORKSITE_CITY', ''))[:100],
        'state':     str(row.get('WORKSITE_STATE', ''))[:2],
        'status':    str(row.get('CASE_STATUS', ''))[:50],
        'begin_date':row.get('BEGIN_DATE'),
        'fy':        2025,
        'emb':       str(emb.tolist()),
    })
    conn.commit()
    count = conn.execute(text('SELECT COUNT(*) FROM lca_records')).scalar()
    print(f'Success! Count: {count}')
