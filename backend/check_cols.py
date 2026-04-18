from db import get_db
from sqlalchemy import text
db = next(get_db())
cols = db.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='lca_records' ORDER BY ordinal_position")).fetchall()
for col in cols:
    print(col)
db.close()
