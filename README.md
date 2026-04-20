\# VisaTrack — H1B Intelligence Platform



> AI-powered semantic search over 106,000+ real US Department of Labor H1B filings

## Live Demo
**Frontend:** https://visatrack.vercel.app  
*Note: Backend deployment in progress. Run locally for full functionality.*



\## What it does



International students and workers applying for H1B sponsorship waste months applying to companies that never sponsor. VisaTrack solves this by making DOL public LCA data searchable with AI.



\- \*\*Semantic search\*\* — search "machine learning engineer Bay Area" and get real companies with real salaries, not keyword matches

\- \*\*Resume matching\*\* — upload your PDF resume and get ranked H1B sponsors that match your skills  

\- \*\*AI insights\*\* — click any result for a Groq-powered analysis of the employer's sponsorship history



\## Architecture

Next.js 14 (TypeScript)

↓ REST API

FastAPI (Python)

↓ pgvector cosine similarity

PostgreSQL + pgvector

106,613 LCA records

384-dim HNSW index

↓ embeddings

fastembed (BAAI/bge-small-en-v1.5)

↓ LLM insights

Groq API (llama-3.1-8b-instant)



\## Tech Stack



| Layer | Technology |

|-------|-----------|

| Frontend | Next.js 14, TypeScript, Tailwind CSS |

| Backend | FastAPI, Python |

| Database | PostgreSQL + pgvector |

| Embeddings | fastembed (BAAI/bge-small-en-v1.5) |

| LLM | Groq API (llama-3.1-8b-instant) |

| Containerization | Docker |



\## Key Technical Decisions



\*\*Why pgvector over Pinecone/Weaviate?\*\* Full control over the data, no vendor lock-in, and cosine similarity via HNSW index gives sub-100ms queries at 106K records.



\*\*Why semantic search over keyword search?\*\* Competitors (MyVisaJobs, H1BGrader) use keyword matching. A query for "ML engineer" misses records titled "Machine Learning Scientist". Vector embeddings capture meaning, not keywords.



\*\*Why Groq over OpenAI?\*\* 750 tokens/second inference — insights load in under 1 second. OpenAI at equivalent speed would cost money.



\## Data



\- Source: US Department of Labor FY2025 Q4 LCA Disclosure Data (public)

\- 118,580 total filings → 106,613 certified H1B petitions

\- Fields: employer, role, SOC code, wage, location, filing date



\## Running Locally



\### Prerequisites

\- Docker Desktop

\- Python 3.11+

\- Node.js 18+



\### Backend



```bash

cd backend



\# Create virtual environment

python -m venv venv

venv\\Scripts\\activate  # Windows

source venv/bin/activate  # Mac/Linux



\# Install dependencies

pip install -r requirements.txt



\# Start PostgreSQL with pgvector

docker-compose up -d



\# Initialize database

python -c "from db import init\_db; init\_db()"



\# Download LCA data from DOL:

\# https://www.dol.gov/agencies/eta/foreign-labor/performance

\# Place xlsx file in the data/ folder, then run:

python ingestion/pipeline.py data/LCA\_Disclosure\_Data\_FY2025\_Q4.xlsx 2025



\# Create .env file

cp .env.example .env

\# Add your GROQ\_API\_KEY to .env



\# Start API server

uvicorn main:app --reload --port 8000

```



\### Frontend



```bash

cd frontend

npm install

npm run dev

```



Open http://localhost:3000



\### Environment Variables



Create `backend/.env`:

DATABASE\_URL=postgresql://visatrack:visatrack123@localhost:5433/visatrack

GROQ\_API\_KEY=your\_groq\_key\_here

JWT\_SECRET=your\_secret\_here



\## API Endpoints



| Method | Endpoint | Description |

|--------|----------|-------------|

| POST | `/api/search` | Semantic search over H1B records |

| POST | `/api/match` | Match resume PDF to H1B sponsors |

| POST | `/api/insight` | AI analysis of employer sponsorship |

| GET | `/api/health` | Health check |



\### Example: Search Request



```json

POST /api/search

{

&#x20; "query": "machine learning engineer",

&#x20; "state": "CA",

&#x20; "limit": 20

}

```



\### Example: Search Response



```json

{

&#x20; "query": "machine learning engineer",

&#x20; "total": 20,

&#x20; "results": \[

&#x20;   {

&#x20;     "employer": "Google LLC",

&#x20;     "role": "Software Developers",

&#x20;     "city": "Mountain View",

&#x20;     "state": "CA",

&#x20;     "filings": 142,

&#x20;     "avg\_wage": 198000,

&#x20;     "latest\_year": 2025,

&#x20;     "match\_score": 0.71

&#x20;   }

&#x20; ]

}

```



\## Project Structure

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

│       └── groq\_insights.py # AI employer insights

└── frontend/

└── src/

├── app/

│   └── page.tsx     # Main UI with search + match tabs

└── lib/

└── api.ts       # API client



\## Competitive Landscape



| Feature | VisaTrack | MyVisaJobs | H1BGrader |

|---------|-----------|------------|-----------|

| Semantic Search | ✅ | ❌ | ❌ |

| Resume Matching | ✅ | ❌ | ❌ |

| AI Insights | ✅ | ❌ | ❌ |

| Real DOL Data | ✅ | ✅ | ✅ |

| Free to Use | ✅ | ✅ | ✅ |



\## Author



\*\*Dhanush Neelakantan\*\*  

MS Computer Science, George Mason University (May 2026)  

\[LinkedIn](https://www.linkedin.com/in/dhanush-neelakantan-15b4481bb/) | \[GitHub](https://github.com/Dhanush4448)

