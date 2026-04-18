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

