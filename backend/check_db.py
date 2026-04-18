from db import get_db
from sqlalchemy import text
db = next(get_db())
tables = db.execute(text('SELECT tablename FROM pg_tables WHERE schemaname=\'public\'')).fetchall()
print('Tables:', tables)
db.close()
