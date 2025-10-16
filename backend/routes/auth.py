from fastapi import APIRouter, HTTPException, Response, Request, Cookie
from pydantic import BaseModel, EmailStr
from typing import Optional
import httpx
from datetime import datetime, timedelta, timezone
from server import db
from models import User, UserSession
from utils.auth import hash_password, verify_password, create_access_token, create_refresh_token, decode_token, get_current_user

router = APIRouter()


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class SessionIDRequest(BaseModel):
    session_id: str


@router.post("/signup")
async def signup(data: SignupRequest):
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone
    )
    
    await db.users.insert_one(user.model_dump())
    
    access_token = create_access_token({"user_id": user.id, "email": user.email})
    refresh_token = create_refresh_token({"user_id": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "full_name": user.full_name}
    }


@router.post("/login")
async def login(data: LoginRequest, response: Response):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    
    if not user.get("is_active"):
        raise HTTPException(status_code=401, detail="Usuário inativo")
    
    access_token = create_access_token({"user_id": user["id"], "email": user["email"]})
    refresh_token = create_refresh_token({"user_id": user["id"]})
    
    session = UserSession(
        user_id=user["id"],
        session_token=access_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    await db.user_sessions.insert_one(session.model_dump())
    
    response.set_cookie(
        key="session_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"], 
            "email": user["email"], 
            "full_name": user["full_name"], 
            "picture": user.get("picture"),
            "requires_password_change": user.get("requires_password_change", False)
        }
    }


@router.post("/google-session")
async def google_session(data: SessionIDRequest, response: Response):
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Session ID inválido")
        
        session_data = resp.json()
    
    email = session_data["email"]
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["id"]
    else:
        user = User(
            email=email,
            full_name=session_data.get("name", email.split("@")[0]),
            picture=session_data.get("picture"),
            password_hash=None
        )
        await db.users.insert_one(user.model_dump())
        user_id = user.id
    
    session_token = session_data["session_token"]
    session = UserSession(
        user_id=user_id,
        session_token=session_token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    await db.user_sessions.insert_one(session.model_dump())
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 60 * 60,
        path="/"
    )
    
    user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
    return {
        "user": {"id": user_doc["id"], "email": user_doc["email"], "full_name": user_doc["full_name"], "picture": user_doc.get("picture")},
        "session_token": session_token
    }


@router.get("/me")
async def get_me(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    return {"user": user}


@router.post("/logout")
async def logout(request: Request, response: Response, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logout realizado com sucesso"}


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    payload = decode_token(refresh_token, "refresh")
    user_id = payload.get("user_id")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    access_token = create_access_token({"user_id": user["id"], "email": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}
