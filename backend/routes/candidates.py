from fastapi import APIRouter, HTTPException, Depends, Request, Cookie, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List
from server import db
from models import Candidate, CandidateSkill, Experience, Education
from utils.auth import get_current_user
from datetime import datetime, timezone
import os
import uuid

router = APIRouter()


class CandidateCreate(BaseModel):
    birthdate: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    salary_expectation: Optional[float] = None
    availability: Optional[str] = None


class CandidateSkillCreate(BaseModel):
    skill_id: str
    level: int
    years: Optional[float] = None


class ExperienceCreate(BaseModel):
    company: str
    title: str
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    responsibilities: Optional[str] = None


class EducationCreate(BaseModel):
    institution: str
    degree: str
    field: str
    start_year: int
    end_year: Optional[int] = None


@router.post("/profile")
async def create_or_update_profile(data: CandidateCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    existing = await db.candidates.find_one({"user_id": user["id"]}, {"_id": 0})
    if existing:
        update_data = {k: v for k, v in data.model_dump().items() if v is not None}
        await db.candidates.update_one({"user_id": user["id"]}, {"$set": update_data})
        candidate = await db.candidates.find_one({"user_id": user["id"]}, {"_id": 0})
    else:
        candidate_obj = Candidate(user_id=user["id"], **data.model_dump())
        await db.candidates.insert_one(candidate_obj.model_dump())
        candidate = candidate_obj.model_dump()
    
    return candidate


@router.get("/profile")
async def get_my_profile(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    return candidate


@router.post("/profile/skills")
async def add_skill(data: CandidateSkillCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    skill_obj = CandidateSkill(candidate_id=candidate["id"], **data.model_dump())
    await db.candidate_skills.insert_one(skill_obj.model_dump())
    return skill_obj


@router.post("/profile/experiences")
async def add_experience(data: ExperienceCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    exp_obj = Experience(candidate_id=candidate["id"], **data.model_dump())
    await db.experiences.insert_one(exp_obj.model_dump())
    return exp_obj


@router.post("/profile/educations")
async def add_education(data: EducationCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")
    
    edu_obj = Education(candidate_id=candidate["id"], **data.model_dump())
    await db.educations.insert_one(edu_obj.model_dump())
    return edu_obj


@router.get("/search")
async def search_candidates(skill: Optional[str] = None, city: Optional[str] = None, request: Request = None, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    query = {"visibility": "pool"}
    if city:
        query["location_city"] = {"$regex": city, "$options": "i"}
    
    candidates = await db.candidates.find(query, {"_id": 0}).to_list(100)
    return candidates
