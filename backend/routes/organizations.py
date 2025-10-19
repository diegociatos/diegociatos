from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, List, Literal
from server import db
from models import Organization
from utils.auth import get_current_user, require_role

router = APIRouter()


class OrganizationCreate(BaseModel):
    name: str
    org_type: Literal["agency", "client"]
    tax_id: Optional[str] = None


class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    tax_id: Optional[str] = None
    active: Optional[bool] = None


@router.post("")
async def create_organization(data: OrganizationCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin"])
    
    org = Organization(**data.model_dump())
    await db.organizations.insert_one(org.model_dump())
    return org


@router.get("")
async def list_organizations(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin", "recruiter", "client"])
    
    orgs = await db.organizations.find({"active": True}, {"_id": 0}).to_list(1000)
    return orgs


@router.get("/{org_id}")
async def get_organization(org_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    return org


@router.patch("/{org_id}")
async def update_organization(org_id: str, data: OrganizationUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin"])
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="Nenhum dado para atualizar")
    
    result = await db.organizations.update_one({"id": org_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    
    org = await db.organizations.find_one({"id": org_id}, {"_id": 0})
    return org
