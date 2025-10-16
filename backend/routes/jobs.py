from fastapi import APIRouter, HTTPException, Depends, Request, Cookie, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Literal, Dict, Any
from datetime import datetime
from server import db
from models import Job, JobRequiredSkill, JobPublication
from utils.auth import get_current_user, require_role, get_user_roles
import os

router = APIRouter()


class JobCreate(BaseModel):
    title: str
    description: str
    employment_type: Optional[str] = None
    schedule: Optional[str] = None
    benefits: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    work_mode: Literal["presencial", "hibrido", "remoto"] = "presencial"
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    ideal_profile: Optional[Dict[str, Any]] = None
    blind_review: bool = False


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["draft", "in_review", "published", "paused", "closed"]] = None
    ideal_profile: Optional[Dict[str, Any]] = None
    blind_review: Optional[bool] = None


class JobRequiredSkillCreate(BaseModel):
    skill_id: str
    must_have: bool = False
    min_level: int = 1


@router.post("/")
async def create_job(data: JobCreate, organization_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    roles = await get_user_roles(user["id"], organization_id)
    
    if not any(r["role"] in ["admin", "recruiter", "client"] for r in roles):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    job = Job(
        organization_id=organization_id,
        created_by=user["id"],
        **data.model_dump()
    )
    await db.jobs.insert_one(job.model_dump())
    return job


@router.get("/")
async def list_jobs(
    organization_id: Optional[str] = None,
    status: Optional[str] = None,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    query = {}
    if organization_id:
        query["organization_id"] = organization_id
    if status:
        query["status"] = status
    
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(1000)
    return jobs


@router.get("/public")
async def list_public_jobs(city: Optional[str] = None, work_mode: Optional[str] = None):
    query = {"status": "published"}
    if city:
        query["location_city"] = {"$regex": city, "$options": "i"}
    if work_mode:
        query["work_mode"] = work_mode
    
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(1000)
    return jobs


@router.get("/{job_id}")
async def get_job(job_id: str):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    required_skills = await db.job_required_skills.find({"job_id": job_id}, {"_id": 0}).to_list(100)
    job["required_skills"] = required_skills
    
    return job


@router.patch("/{job_id}")
async def update_job(job_id: str, data: JobUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    roles = await get_user_roles(user["id"], job["organization_id"])
    if not any(r["role"] in ["admin", "recruiter", "client"] for r in roles):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now()
    
    await db.jobs.update_one({"id": job_id}, {"$set": update_data})
    updated_job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    return updated_job


@router.post("/{job_id}/publish")
async def publish_job(job_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    await require_role(user, ["admin", "recruiter"], job["organization_id"])
    
    await db.jobs.update_one({"id": job_id}, {"$set": {"status": "published", "updated_at": datetime.now()}})
    
    careers_url = f"{os.getenv('CAREERS_BASE_URL')}/vaga/{job_id}"
    pub = JobPublication(
        job_id=job_id,
        channel="career_site",
        url=careers_url
    )
    await db.job_publications.insert_one(pub.model_dump())
    
    return {"message": "Vaga publicada com sucesso", "url": careers_url}


@router.post("/{job_id}/required-skills")
async def add_required_skill(job_id: str, data: JobRequiredSkillCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    await require_role(user, ["admin", "recruiter", "client"], job["organization_id"])
    
    req_skill = JobRequiredSkill(job_id=job_id, **data.model_dump())
    await db.job_required_skills.insert_one(req_skill.model_dump())
    return req_skill


@router.get("/{job_id}/required-skills")
async def get_required_skills(job_id: str):
    skills = await db.job_required_skills.find({"job_id": job_id}, {"_id": 0}).to_list(100)
    
    for skill in skills:
        skill_doc = await db.skills.find_one({"id": skill["skill_id"]}, {"_id": 0})
        if skill_doc:
            skill["skill_name"] = skill_doc["name"]
    
    return skills
