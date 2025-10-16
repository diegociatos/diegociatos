from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from server import db
from models import Interview
from utils.auth import get_current_user, get_user_roles

router = APIRouter()


class InterviewCreate(BaseModel):
    application_id: str
    interview_type: Literal["recruiter", "client", "panel", "technical"]
    starts_at: str
    ends_at: str
    location: Optional[str] = None
    interviewer_user_id: str


class InterviewUpdate(BaseModel):
    outcome: Optional[str] = None
    notes: Optional[str] = None


@router.post("/")
async def create_interview(data: InterviewCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    app = await db.applications.find_one({"id": data.application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    job = await db.jobs.find_one({"id": app["job_id"]})
    await get_user_roles(user["id"], job["organization_id"])
    
    interview = Interview(**data.model_dump())
    await db.interviews.insert_one(interview.model_dump())
    return interview


@router.get("/")
async def list_interviews(
    application_id: Optional[str] = None,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    user = await get_current_user(request, session_token)
    
    query = {}
    if application_id:
        query["application_id"] = application_id
    
    interviews = await db.interviews.find(query, {"_id": 0}).to_list(1000)
    return interviews


@router.patch("/{interview_id}")
async def update_interview(interview_id: str, data: InterviewUpdate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    result = await db.interviews.update_one({"id": interview_id}, {"$set": update_data})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada")
    
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    return interview
