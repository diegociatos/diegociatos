from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
from server import db
from models import Application, ApplicationStageHistory
from utils.auth import get_current_user, get_user_roles
from services.scoring import ScoringService

router = APIRouter()

scoring_service = ScoringService()


class ApplicationCreate(BaseModel):
    job_id: str


class StageAdvance(BaseModel):
    to_stage: str
    note: Optional[str] = None


@router.post("/")
async def create_application(data: ApplicationCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        raise HTTPException(status_code=400, detail="Complete seu perfil antes de se candidatar")
    
    existing = await db.applications.find_one({"job_id": data.job_id, "candidate_id": candidate["id"]})
    if existing:
        raise HTTPException(status_code=400, detail="Você já se candidatou a esta vaga")
    
    application = Application(
        job_id=data.job_id,
        candidate_id=candidate["id"]
    )
    await db.applications.insert_one(application.model_dump())
    
    history = ApplicationStageHistory(
        application_id=application.id,
        from_stage=None,
        to_stage="submitted",
        changed_by=user["id"]
    )
    await db.application_stage_history.insert_one(history.model_dump())
    
    score = await scoring_service.calculate_score(application.id)
    await db.applications.update_one({"id": application.id}, {"$set": {"stage_score": score["total_score"]}})
    
    return application


@router.get("/")
async def list_applications(
    job_id: Optional[str] = None,
    candidate_id: Optional[str] = None,
    stage: Optional[str] = None,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    user = await get_current_user(request, session_token)
    
    query = {"status": "active"}
    if job_id:
        query["job_id"] = job_id
    if candidate_id:
        query["candidate_id"] = candidate_id
    if stage:
        query["current_stage"] = stage
    
    applications = await db.applications.find(query, {"_id": 0}).to_list(1000)
    
    for app in applications:
        job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0})
        candidate = await db.candidates.find_one({"id": app["candidate_id"]}, {"_id": 0})
        candidate_user = await db.users.find_one({"id": candidate["user_id"]}, {"_id": 0, "password_hash": 0})
        
        blind_mode = job.get("blind_review", False)
        if blind_mode:
            candidate_user["full_name"] = "Candidato Anônimo"
            candidate_user["picture"] = None
        
        app["job"] = {"title": job["title"], "organization_id": job["organization_id"]}
        app["candidate"] = {
            "id": candidate["id"],
            "full_name": candidate_user["full_name"],
            "picture": candidate_user.get("picture"),
            "location_city": candidate.get("location_city")
        }
    
    return applications


@router.get("/my")
async def get_my_applications(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        return []
    
    applications = await db.applications.find({"candidate_id": candidate["id"]}, {"_id": 0}).to_list(1000)
    
    for app in applications:
        job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0})
        app["job"] = job
    
    return applications


@router.get("/{application_id}")
async def get_application(application_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    history = await db.application_stage_history.find({"application_id": application_id}, {"_id": 0}).to_list(100)
    app["history"] = sorted(history, key=lambda x: x["changed_at"], reverse=True)
    
    return app


@router.post("/{application_id}/advance")
async def advance_stage(application_id: str, data: StageAdvance, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    app = await db.applications.find_one({"id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    job = await db.jobs.find_one({"id": app["job_id"]})
    await get_user_roles(user["id"], job["organization_id"])
    
    history = ApplicationStageHistory(
        application_id=application_id,
        from_stage=app["current_stage"],
        to_stage=data.to_stage,
        changed_by=user["id"],
        note=data.note
    )
    await db.application_stage_history.insert_one(history.model_dump())
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {"current_stage": data.to_stage, "updated_at": datetime.now()}}
    )
    
    return {"message": "Estágio atualizado com sucesso"}


@router.post("/{application_id}/reject")
async def reject_application(application_id: str, note: Optional[str] = None, request: Request = None, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    app = await db.applications.find_one({"id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {"status": "rejected", "updated_at": datetime.now()}}
    )
    
    history = ApplicationStageHistory(
        application_id=application_id,
        from_stage=app["current_stage"],
        to_stage="rejected",
        changed_by=user["id"],
        note=note
    )
    await db.application_stage_history.insert_one(history.model_dump())
    
    return {"message": "Candidatura rejeitada"}
