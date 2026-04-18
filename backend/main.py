from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db import init_db
from routers import search

app = FastAPI(title="VisaTrack API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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
from routers import match
app.include_router(match.router)