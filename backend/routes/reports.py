from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from server import db
from utils.auth import get_current_user, get_user_roles

router = APIRouter()


@router.get("/pipeline/{job_id}")
async def get_pipeline_report(job_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    await get_user_roles(user["id"], job["organization_id"])
    
    applications = await db.applications.find({"job_id": job_id}, {"_id": 0}).to_list(1000)
    
    stages_count = {}
    for app in applications:
        stage = app["current_stage"]
        stages_count[stage] = stages_count.get(stage, 0) + 1
    
    return {
        "job_id": job_id,
        "job_title": job["title"],
        "total_applications": len(applications),
        "stages": stages_count
    }


@router.get("/organization/{org_id}/overview")
async def get_organization_overview(org_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    await get_user_roles(user["id"], org_id)
    
    jobs = await db.jobs.find({"organization_id": org_id}, {"_id": 0}).to_list(1000)
    total_applications = 0
    
    for job in jobs:
        apps = await db.applications.find({"job_id": job["id"]}).to_list(1000)
        total_applications += len(apps)
    
    return {
        "organization_id": org_id,
        "total_jobs": len(jobs),
        "active_jobs": len([j for j in jobs if j["status"] == "published"]),
        "total_applications": total_applications
    }


@router.get("/time-to-hire/{job_id}")
async def get_time_to_hire(job_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    hired_apps = await db.applications.find({"job_id": job_id, "status": "hired"}, {"_id": 0}).to_list(1000)
    
    if not hired_apps:
        return {"job_id": job_id, "average_days": 0, "hired_count": 0}
    
    total_days = 0
    for app in hired_apps:
        applied = app["applied_at"]
        history = await db.application_stage_history.find({"application_id": app["id"], "to_stage": "hired"}).to_list(1)
        if history:
            hired_date = history[0]["changed_at"]
            delta = (hired_date - applied).days
            total_days += delta
    
    avg_days = total_days / len(hired_apps) if hired_apps else 0
    
    return {
        "job_id": job_id,
        "average_days": round(avg_days, 1),
        "hired_count": len(hired_apps)
    }
