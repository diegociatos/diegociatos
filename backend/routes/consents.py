from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from server import db
from models import Consent, DataSubjectRequest
from utils.auth import get_current_user

router = APIRouter()


class ConsentCreate(BaseModel):
    purpose: Literal["recruitment", "future_positions"]
    granted: bool


class DataSubjectRequestCreate(BaseModel):
    request_type: Literal["access", "rectify", "erase", "revoke_consent"]


@router.post("")
async def create_consent(data: ConsentCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        raise HTTPException(status_code=404, detail="Perfil de candidato não encontrado")
    
    consent = Consent(candidate_id=candidate["id"], **data.model_dump())
    await db.consents.insert_one(consent.model_dump())
    return consent


@router.get("/my")
async def get_my_consents(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        return []
    
    consents = await db.consents.find({"candidate_id": candidate["id"]}, {"_id": 0}).to_list(100)
    return consents


@router.post("/data-subject-request")
async def create_data_subject_request(data: DataSubjectRequestCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        raise HTTPException(status_code=404, detail="Perfil de candidato não encontrado")
    
    dsr = DataSubjectRequest(candidate_id=candidate["id"], **data.model_dump())
    await db.data_subject_requests.insert_one(dsr.model_dump())
    return dsr


@router.get("/export")
async def export_my_data(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]}, {"_id": 0})
    if not candidate:
        raise HTTPException(status_code=404, detail="Perfil de candidato não encontrado")
    
    applications = await db.applications.find({"candidate_id": candidate["id"]}, {"_id": 0}).to_list(1000)
    skills = await db.candidate_skills.find({"candidate_id": candidate["id"]}, {"_id": 0}).to_list(1000)
    experiences = await db.experiences.find({"candidate_id": candidate["id"]}, {"_id": 0}).to_list(1000)
    educations = await db.educations.find({"candidate_id": candidate["id"]}, {"_id": 0}).to_list(1000)
    
    export_data = {
        "user": user,
        "candidate": candidate,
        "applications": applications,
        "skills": skills,
        "experiences": experiences,
        "educations": educations
    }
    
    return export_data
