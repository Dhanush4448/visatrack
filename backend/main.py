from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import init_db
from routers import search
from routers import match
from routers import groq_insights
from routers import auth
from routers import employers


app = FastAPI(title="VisaTrack API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://visatrack.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    init_db()

@app.get("/")
async def root():
    return {"status": "VisaTrack API running", "version": "0.1.0"}

app.include_router(search.router)
app.include_router(match.router)
app.include_router(groq_insights.router)
app.include_router(auth.router)
app.include_router(employers.router)