from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel, EmailStr
from typing import Optional, List, Literal
from server import db
from models import UserOrgRole
from utils.auth import get_current_user, require_role

router = APIRouter()


class UserOrgRoleCreate(BaseModel):
    user_id: str
    organization_id: str
    role: Literal["admin", "recruiter", "client", "candidate"]


@router.get("/")
async def list_users(organization_id: Optional[str] = None, request: Request = None, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin", "recruiter"])
    
    query = {"is_active": True}
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users


@router.get("/me/roles")
async def get_my_roles(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return roles


@router.post("/roles")
async def create_user_org_role(data: UserOrgRoleCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin"], data.organization_id)
    
    existing = await db.user_org_roles.find_one({
        "user_id": data.user_id,
        "organization_id": data.organization_id,
        "role": data.role
    })
    if existing:
        raise HTTPException(status_code=400, detail="Papel já atribuído")
    
    role_obj = UserOrgRole(**data.model_dump())
    await db.user_org_roles.insert_one(role_obj.model_dump())
    return role_obj


@router.delete("/roles/{role_id}")
async def delete_user_org_role(role_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin"])
    
    result = await db.user_org_roles.delete_one({"id": role_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Papel não encontrado")
    
    return {"message": "Papel removido com sucesso"}



@router.get("/{user_id}")
async def get_user(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin", "recruiter"])
    
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Buscar roles do usuário
    roles = await db.user_org_roles.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    target_user["roles"] = roles
    
    return target_user


@router.patch("/{user_id}")
async def update_user(user_id: str, update_data: dict, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    # Admin pode editar qualquer usuário, outros só podem editar a si mesmos
    if user["id"] != user_id:
        await require_role(user, ["admin"])
    
    # Remover campos que não devem ser atualizados diretamente
    update_data.pop("id", None)
    update_data.pop("password_hash", None)
    update_data.pop("created_at", None)
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    
    from datetime import datetime, timezone
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {"message": "Usuário atualizado com sucesso"}


@router.delete("/{user_id}")
async def delete_user(user_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin"])
    
    # Desativar ao invés de deletar (soft delete)
    result = await db.users.update_one(
        {"id": user_id},
        {"$set": {"is_active": False}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    return {"message": "Usuário desativado com sucesso"}
