from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Note port 5433 — matches our docker-compose
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://visatrack:visatrack123@localhost:5433/visatrack"
)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Creates all tables and indexes. Run once on startup."""
    with engine.connect() as conn:
        # Enable vector extension
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

        # Main LCA records table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS lca_records (
                id             SERIAL PRIMARY KEY,
                employer_name  VARCHAR(255) NOT NULL,
                soc_code       VARCHAR(20),
                soc_title      VARCHAR(255),
                wage_rate      DECIMAL(12,2),
                worksite_city  VARCHAR(100),
                worksite_state CHAR(2),
                case_status    VARCHAR(50),
                begin_date     DATE,
                fiscal_year    SMALLINT,
                embedding      VECTOR(384),
                created_at     TIMESTAMPTZ DEFAULT NOW()
            )
        """))

        # HNSW vector index — makes search fast at 847K rows
        conn.execute(text("""
            CREATE INDEX IF NOT EXISTS lca_embed_idx
            ON lca_records
            USING hnsw (embedding vector_cosine_ops)
            WITH (m=16, ef_construction=64)
        """))

        # Users table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                email           VARCHAR(255) UNIQUE NOT NULL,
                password_hash   VARCHAR(255),
                user_type       VARCHAR(20),
                plan            VARCHAR(20) DEFAULT 'free',
                created_at      TIMESTAMPTZ DEFAULT NOW()
            )
        """))

        # HR employee visa tracker
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS hr_employees (
                id               SERIAL PRIMARY KEY,
                employer_id      UUID REFERENCES users(id),
                employee_name    VARCHAR(255),
                visa_type        VARCHAR(20),
                ead_expiry       DATE,
                h1b_expiry       DATE,
                gc_priority_date DATE,
                soc_code         VARCHAR(20),
                wage             DECIMAL(12,2),
                notes            TEXT,
                created_at       TIMESTAMPTZ DEFAULT NOW()
            )
        """))

        conn.commit()
        print("Database initialized successfully.")