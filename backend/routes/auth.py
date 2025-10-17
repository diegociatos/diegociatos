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


# ROTA DESATIVADA - Usar /candidate/signup para candidatos ou /admin/create-user para outros usuários
# @router.post("/signup")
# async def signup(data: SignupRequest):
#     existing = await db.users.find_one({"email": data.email})
#     if existing:
#         raise HTTPException(status_code=400, detail="Email já cadastrado")
#     
#     user = User(
#         email=data.email,
#         password_hash=hash_password(data.password),
#         full_name=data.full_name,
#         phone=data.phone
#     )
#     
#     await db.users.insert_one(user.model_dump())
#     
#     access_token = create_access_token({"user_id": user.id, "email": user.email})
#     refresh_token = create_refresh_token({"user_id": user.id})
#     
#     return {
#         "access_token": access_token,
#         "refresh_token": refresh_token,
#         "token_type": "bearer",
#         "user": {"id": user.id, "email": user.email, "full_name": user.full_name}
#     }


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
    # Não exigir autenticação válida para logout - apenas limpar sessões
    token = session_token
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    
    # Tentar deletar sessões se houver token
    if token:
        try:
            await db.user_sessions.delete_many({"session_token": token})
        except:
            pass  # Ignorar erros ao deletar sessões
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logout realizado com sucesso"}


@router.post("/refresh")
async def refresh_token(refresh_token: str):
    payload = decode_token(refresh_token, "refresh")
    user_id = payload.get("user_id")
    
    user = await db.users.find_one({"id": user_id}, {"_id": 0})


class ChangePasswordRequest(BaseModel):
    old_password: Optional[str] = None
    new_password: str


class CreateUserRequest(BaseModel):
    email: EmailStr
    full_name: str
    phone: Optional[str] = None
    role: str
    organization_id: str
    password: Optional[str] = None  # Senha inicial opcional (admin pode definir)


@router.post("/change-password")
async def change_password(data: ChangePasswordRequest, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    # Se o usuário precisa trocar senha (primeiro acesso), não precisa validar senha antiga
    if not user.get("requires_password_change", False):
        if not data.old_password:
            raise HTTPException(status_code=400, detail="Senha antiga é obrigatória")
        if not verify_password(data.old_password, user["password_hash"]):
            raise HTTPException(status_code=400, detail="Senha antiga incorreta")
    
    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": new_hash, "requires_password_change": False, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Senha alterada com sucesso"}


@router.post("/candidate/signup")
async def candidate_signup(data: SignupRequest):
    """Cadastro público para candidatos"""
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        phone=data.phone,
        requires_password_change=False
    )
    
    await db.users.insert_one(user.model_dump())
    
    # Buscar ou criar organização padrão para candidatos
    default_org = await db.organizations.find_one({"name": "Candidatos"}, {"_id": 0})
    if not default_org:
        from models import Organization
        org = Organization(name="Candidatos", org_type="agency")
        await db.organizations.insert_one(org.model_dump())
        default_org = org.model_dump()
    
    # Criar role de candidato
    from models import UserOrgRole, Candidate
    role = UserOrgRole(
        user_id=user.id,
        organization_id=default_org["id"],
        role="candidate"
    )
    await db.user_org_roles.insert_one(role.model_dump())
    
    # Criar perfil de candidato
    candidate = Candidate(user_id=user.id)
    await db.candidates.insert_one(candidate.model_dump())
    
    access_token = create_access_token({"user_id": user.id, "email": user.email})
    refresh_token = create_refresh_token({"user_id": user.id})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id, 
            "email": user.email, 
            "full_name": user.full_name,
            "requires_password_change": False
        }
    }


@router.post("/admin/create-user")
async def admin_create_user(data: CreateUserRequest, request: Request, session_token: Optional[str] = Cookie(None)):
    """Admin cria usuários (Cliente, Analista, ou outro Admin) com senha provisória"""
    user = await get_current_user(request, session_token)
    
    # Verificar se usuário é admin
    from utils.auth import require_role
    await require_role(user, ["admin"])
    
    existing = await db.users.find_one({"email": data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    
    # Usar senha fornecida ou gerar automaticamente
    import secrets
    if data.password:
        # Validar que a senha tem pelo menos 1 caractere
        if len(data.password) < 1:
            raise HTTPException(status_code=400, detail="Senha deve ter pelo menos 1 caractere")
        temp_password = data.password
    else:
        # Gerar senha provisória automaticamente
        temp_password = secrets.token_urlsafe(12)
    
    new_user = User(
        email=data.email,
        password_hash=hash_password(temp_password),
        full_name=data.full_name,
        phone=data.phone,
        requires_password_change=True  # Sempre exige troca no primeiro login
    )
    
    await db.users.insert_one(new_user.model_dump())
    
    # Criar role
    from models import UserOrgRole
    role = UserOrgRole(
        user_id=new_user.id,
        organization_id=data.organization_id,
        role=data.role
    )
    await db.user_org_roles.insert_one(role.model_dump())
    
    # Se for candidato, criar perfil de candidato
    if data.role == "candidate":
        from models import Candidate
        candidate = Candidate(user_id=new_user.id)
        await db.candidates.insert_one(candidate.model_dump())
    
    return {
        "message": "Usuário criado com sucesso",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": data.role
        },
        "temporary_password": temp_password
    }

    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    
    access_token = create_access_token({"user_id": user["id"], "email": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}
