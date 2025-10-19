from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, List
from server import db
from models import Skill, Tag
from utils.auth import get_current_user

router = APIRouter()


class SkillCreate(BaseModel):
    name: str
    category: Optional[str] = None


class TagCreate(BaseModel):
    name: str


@router.post("")
async def create_skill(data: SkillCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    existing = await db.skills.find_one({"name": data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Habilidade já existe")
    
    skill = Skill(**data.model_dump())
    await db.skills.insert_one(skill.model_dump())
    return skill


@router.get("")
async def list_skills(category: Optional[str] = None):
    query = {}
    if category:
        query["category"] = category
    
    skills = await db.skills.find(query, {"_id": 0}).to_list(1000)
    return skills


@router.post("/tags")
async def create_tag(data: TagCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    existing = await db.tags.find_one({"name": data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Tag já existe")
    
    tag = Tag(**data.model_dump())
    await db.tags.insert_one(tag.model_dump())
    return tag


@router.get("/tags")
async def list_tags():
    tags = await db.tags.find({}, {"_id": 0}).to_list(1000)
    return tags
