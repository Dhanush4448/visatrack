from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from db import get_db
from dotenv import load_dotenv
import os

load_dotenv()

router = APIRouter(prefix="/api/auth")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("JWT_SECRET", "visatrack-secret-key-2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

class SignupRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: str, email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": user_id, "email": email, "exp": expire},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

@router.post("/signup")
async def signup(req: SignupRequest, db: Session = Depends(get_db)):
    # Check if user exists
    existing = db.execute(
        text("SELECT id FROM users WHERE email = :email"),
        {"email": req.email}
    ).fetchone()

    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    result = db.execute(
        text("""
            INSERT INTO users (email, password_hash, user_type, plan)
            VALUES (:email, :password_hash, 'seeker', 'free')
            RETURNING id, email, plan
        """),
        {"email": req.email, "password_hash": hash_password(req.password)}
    ).fetchone()
    db.commit()

    token = create_token(str(result.id), result.email)

    return {
        "token": token,
        "user": {
            "id": str(result.id),
            "email": result.email,
            "plan": result.plan
        }
    }

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.execute(
        text("SELECT id, email, password_hash, plan FROM users WHERE email = :email"),
        {"email": req.email}
    ).fetchone()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_token(str(user.id), user.email)

    return {
        "token": token,
        "user": {
            "id": str(user.id),
            "email": user.email,
            "plan": user.plan
        }
    }

@router.get("/me")
async def me(db: Session = Depends(get_db), token: str = ""):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = db.execute(
            text("SELECT id, email, plan FROM users WHERE id = :id"),
            {"id": payload["sub"]}
        ).fetchone()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return {"id": str(user.id), "email": user.email, "plan": user.plan}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")