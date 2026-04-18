from db import get_db
from sqlalchemy import text
db = next(get_db())

# Check if HNSW index exists
indexes = db.execute(text('SELECT indexname FROM pg_indexes WHERE tablename=\'lca_records\'')).fetchall()
print('Indexes:', indexes)

# Try a direct insert
db.execute(text('''
INSERT INTO lca_records (employer, job_title, soc_title, wage, wage_unit, city, state, fiscal_year, embedding)
VALUES ('Test Corp', 'Software Engineer', 'Software Developers', 100000, 'Year', 'San Jose', 'CA', 2025, array_fill(0, ARRAY[384])::vector)
ON CONFLICT DO NOTHING
'''))
db.commit()

count = db.execute(text('SELECT COUNT(*) FROM lca_records')).scalar()
print('Count after test insert:', count)
db.close()
