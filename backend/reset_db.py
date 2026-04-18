from db import engine, Base
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('DROP TABLE IF EXISTS lca_records CASCADE'))
    conn.commit()
    print('Dropped lca_records')

Base.metadata.create_all(engine)
print('Recreated all tables')
