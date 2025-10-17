from fastapi import HTTPException, Request, Cookie
from typing import Optional
import jwt
import os
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_REFRESH_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str, token_type: str = "access") -> dict:
    try:
        secret = JWT_SECRET if token_type == "access" else JWT_REFRESH_SECRET
        payload = jwt.decode(token, secret, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != token_type:
            raise HTTPException(status_code=401, detail="Token inválido")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


async def get_current_user(request: Request, session_token: Optional[str] = Cookie(None)):
    from server import db
    
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        try:
            payload = decode_token(token, "access")
            user_id = payload.get("user_id")
        except:
            raise HTTPException(status_code=401, detail="Sessão inválida")
    else:
        # Verificar se session tem expires_at
        if "expires_at" in session:
            expires_at = session["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if not expires_at.tzinfo:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Sessão expirada")
        
        user_id = session["user_id"]
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user or not user.get("is_active"):
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    return user


async def get_user_roles(user_id: str, organization_id: Optional[str] = None):
    from server import db
    
    query = {"user_id": user_id}
    if organization_id:
        query["organization_id"] = organization_id
    
    roles = await db.user_org_roles.find(query, {"_id": 0}).to_list(100)
    return roles


async def require_role(user: dict, required_roles: list, organization_id: Optional[str] = None):
    roles = await get_user_roles(user["id"], organization_id)
    user_role_keys = [r["role"] for r in roles]
    
    if not any(role in user_role_keys for role in required_roles):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    return True
