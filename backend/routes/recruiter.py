from fastapi import APIRouter, HTTPException, Request, Cookie, Query
from typing import Optional, List, Dict, Any
from server import db
from utils.auth import get_current_user, require_role
from datetime import datetime

router = APIRouter()


@router.get("/dashboard/kpis")
async def get_recruiter_dashboard_kpis(
    tenant_id: str = Query(..., description="Organization ID (tenantId)"),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna KPIs do dashboard do analista/recrutador.
    Requer role: recruiter ou admin
    """
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin", "recruiter"])
    
    # Validar que o usuário tem acesso ao tenant
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == tenant_id and r["role"] in ["admin", "recruiter"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este tenant")
    
    # KPI 1: Contar vagas ativas (published, in_review, paused)
    active_jobs_count = await db.jobs.count_documents({
        "organization_id": tenant_id,
        "status": {"$in": ["published", "in_review", "paused"]}
    })
    
    # KPI 2: Contar candidatos ativos (applications com status=active)
    active_candidates_count = await db.applications.count_documents({
        "tenant_id": tenant_id,
        "status": "active"
    })
    
    # KPIs avançados - placeholders para Fase 1
    avg_stage_time_by_stage = {
        "submitted": 0,
        "screening": 0,
        "recruiter_interview": 0,
        "shortlisted": 0,
        "client_interview": 0,
        "offer": 0
    }
    
    time_to_fill_avg = 0
    qualification_rate = 0
    sources = []
    
    return {
        "activeJobs": active_jobs_count,
        "activeCandidates": active_candidates_count,
        "avgStageTimeByStage": avg_stage_time_by_stage,
        "timeToFillAvg": time_to_fill_avg,
        "qualificationRate": qualification_rate,
        "sources": sources
    }


@router.get("/dashboard/jobs")
async def get_recruiter_dashboard_jobs(
    tenant_id: str = Query(..., description="Organization ID (tenantId)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna lista de vagas gerenciadas pelo analista/recrutador.
    Requer role: recruiter ou admin
    """
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin", "recruiter"])
    
    # Validar que o usuário tem acesso ao tenant
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == tenant_id and r["role"] in ["admin", "recruiter"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este tenant")
    
    # Buscar vagas do tenant
    skip = (page - 1) * page_size
    jobs = await db.jobs.find(
        {"organization_id": tenant_id},
        {"_id": 0}
    ).sort("updated_at", -1).skip(skip).limit(page_size).to_list(page_size)
    
    # Buscar nome da organização (client)
    org = await db.organizations.find_one({"id": tenant_id}, {"_id": 0})
    client_name = org["name"] if org else "N/A"
    
    # Para cada vaga, contar applications por estágio
    jobs_with_counts = []
    
    for job in jobs:
        # Contar applications por estágio
        pipeline = [
            {"$match": {"tenant_id": tenant_id, "job_id": job["id"]}},
            {"$group": {
                "_id": "$current_stage",
                "count": {"$sum": 1}
            }}
        ]
        
        stage_counts_raw = await db.applications.aggregate(pipeline).to_list(None)
        
        # Criar dicionário de counts
        counts = {
            "submitted": 0,
            "screening": 0,
            "recruiter_interview": 0,
            "shortlisted": 0,
            "client_interview": 0,
            "offer": 0,
            "hired": 0
        }
        
        for item in stage_counts_raw:
            stage = item["_id"]
            if stage in counts:
                counts[stage] = item["count"]
        
        # Buscar última atualização (pode ser da vaga ou das applications)
        last_application = await db.applications.find_one(
            {"tenant_id": tenant_id, "job_id": job["id"]},
            {"_id": 0, "updated_at": 1},
            sort=[("updated_at", -1)]
        )
        
        last_update = last_application["updated_at"] if last_application else job["updated_at"]
        
        jobs_with_counts.append({
            "jobId": job["id"],
            "title": job["title"],
            "clientName": client_name,
            "status": job["status"],
            "counts": counts,
            "lastUpdate": last_update.isoformat() if isinstance(last_update, datetime) else last_update,
            "slaDaysLeft": None  # placeholder
        })
    
    return jobs_with_counts
