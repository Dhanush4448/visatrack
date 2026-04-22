# VisaTrack — H1B Intelligence Platform

> AI-powered semantic search over 106,000+ real US Department of Labor H1B filings

## Live Demo

**Frontend:** https://visatrack.vercel.app  
**Backend API:** https://visatrack-backend.onrender.com/api/health

## What it does

International students and workers applying for H1B sponsorship waste months applying to companies that never sponsor. VisaTrack solves this by making DOL public LCA data searchable with AI.

- **Semantic search** — search "machine learning engineer Bay Area" and get real companies with real salaries, not keyword matches
- **Resume matching** — upload your PDF resume and get ranked H1B sponsors that match your skills
- **AI insights** — click any result for a Groq-powered analysis of the employer's sponsorship history
- **JWT Auth** — signup and login to save searches and track applications

## Architecture
Next.js 14 (TypeScript) — Vercel
↓ REST API
FastAPI (Python) — Render
↓ pgvector cosine similarity
PostgreSQL + pgvector — Render
106,326 LCA records
384-dim HNSW index
↓ embeddings
HuggingFace Inference API (BAAI/bge-small-en-v1.5)
↓ LLM insights
Groq API (llama-3.1-8b-instant)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | FastAPI, Python |
| Database | PostgreSQL + pgvector (Render) |
| Embeddings | HuggingFace Inference API (BAAI/bge-small-en-v1.5) |
| LLM | Groq API (llama-3.1-8b-instant) |
| Auth | JWT + bcrypt + passlib |
| Deployment | Vercel (frontend) + Render (backend + DB) |

## Key Technical Decisions

**Why pgvector over Pinecone/Weaviate?** Full control over the data, no vendor lock-in, and cosine similarity via HNSW index gives sub-100ms queries at 106K records.

**Why semantic search over keyword search?** Competitors (MyVisaJobs, H1BGrader) use keyword matching. A query for "ML engineer" misses records titled "Machine Learning Scientist". Vector embeddings capture meaning, not keywords.

**Why Groq over OpenAI?** 750 tokens/second inference — insights load in under 1 second. OpenAI at equivalent speed would cost money.

**Why HuggingFace Inference API for embeddings?** No heavy ML dependencies (torch, sentence-transformers) needed on the server — pure HTTP calls, works within Render's free tier memory limits.

## Data

- Source: US Department of Labor FY2025 Q4 LCA Disclosure Data (public)
- 118,580 total filings → 106,326 certified H1B petitions inserted
- Fields: employer, role, SOC code, wage, location, filing date

## Running Locally

### Prerequisites
- Docker Desktop
- Python 3.11+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Start PostgreSQL with pgvector
docker-compose up -d

# Initialize database
python -c "from db import init_db; init_db()"

# Download LCA data from DOL:
# https://www.dol.gov/agencies/eta/foreign-labor/performance
# Place xlsx file in the data/ folder, then run:
python ingestion/pipeline.py data/LCA_Disclosure_Data_FY2025_Q4.xlsx 2025

# Create .env file
DATABASE_URL=postgresql://visatrack:visatrack123@localhost:5433/visatrack
GROQ_API_KEY=your_groq_key_here
HF_TOKEN=your_hf_token_here
JWT_SECRET=your_secret_here

# Start API
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Semantic search over H1B records |
| POST | `/api/match` | Match resume PDF to H1B sponsors |
| POST | `/api/insight` | AI analysis of employer sponsorship |
| POST | `/api/auth/signup` | Create new account |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/health` | Health check |

## Project Structure
visatrack/
├── backend/
│   ├── main.py              # FastAPI app entry point
│   ├── db.py                # Database connection and schema
│   ├── requirements.txt
│   ├── docker-compose.yml
│   ├── ingestion/
│   │   └── pipeline.py      # DOL data ingestion + embedding
│   └── routers/
│       ├── search.py        # Semantic search endpoint
│       ├── match.py         # Resume match endpoint
│       ├── groq_insights.py # AI employer insights
│       └── auth.py          # JWT authentication
└── frontend/
└── src/
├── app/
│   └── page.tsx     # Main UI with search + match tabs
└── lib/
└── api.ts       # API client

## Competitive Landscape

| Feature | VisaTrack | MyVisaJobs | H1BGrader |
|---------|-----------|------------|-----------|
| Semantic Search | ✅ | ❌ | ❌ |
| Resume Matching | ✅ | ❌ | ❌ |
| AI Insights | ✅ | ❌ | ❌ |
| JWT Auth | ✅ | ✅ | ✅ |
| Real DOL Data | ✅ | ✅ | ✅ |
| Free to Use | ✅ | ✅ | ✅ |
| Live Deployment | ✅ | ✅ | ✅ |

## Author

**Dhanush Neelakantan**  
MS Computer Science, George Mason University (May 2026)  
[LinkedIn](https://linkedin.com/in/dhanush-neelakantan) | [GitHub](https://github.com/Dhanush4448) | [VisaTrack](https://visatrack.vercel.app)