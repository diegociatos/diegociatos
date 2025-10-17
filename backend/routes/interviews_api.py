from fastapi import APIRouter, HTTPException, Request, Cookie, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
from server import db
from utils.auth import get_current_user, require_role
from models import Interview
from services.notification_service import get_notification_service

router = APIRouter()


class CreateInterviewRequest(BaseModel):
    type: str
    starts_at_iso: str
    ends_at_iso: str
    timezone: str = "America/Sao_Paulo"
    location: Dict[str, Any]
    interviewer_user_id: Optional[str] = None
    notes: Optional[str] = None


class UpdateInterviewRequest(BaseModel):
    type: Optional[str] = None
    starts_at_iso: Optional[str] = None
    ends_at_iso: Optional[str] = None
    timezone: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    interviewer_user_id: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class ConfirmInterviewRequest(BaseModel):
    actor: str  # 'client' | 'candidate' | 'recruiter'


class MarkInterviewRequest(BaseModel):
    status: str  # 'done' | 'no_show'


@router.post("/{application_id}/interviews")
async def create_interview(
    application_id: str,
    data: CreateInterviewRequest,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Cria uma nova entrevista para uma application"""
    user = await get_current_user(request, session_token)
    
    # Buscar application
    app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application não encontrada")
    
    # Validar acesso ao tenant (recruiter ou admin)
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == app["tenant_id"] and r["role"] in ["admin", "recruiter"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem permissão para criar entrevistas nesta vaga")
    
    # Validar datas
    starts_at = datetime.fromisoformat(data.starts_at_iso.replace('Z', '+00:00'))
    ends_at = datetime.fromisoformat(data.ends_at_iso.replace('Z', '+00:00'))
    
    if ends_at <= starts_at:
        raise HTTPException(status_code=400, detail="Data de término deve ser posterior ao início")
    
    # Criar entrevista
    interview = Interview(
        tenant_id=app["tenant_id"],
        application_id=application_id,
        interview_type=data.type,
        starts_at=starts_at,
        ends_at=ends_at,
        timezone=data.timezone,
        location=data.location,
        interviewer_user_id=data.interviewer_user_id,
        created_by=user["id"],
        status="scheduled",
        notes=data.notes,
        confirmations={},
        reminders={"sent24h": False, "sent2h": False}
    )
    
    await db.interviews.insert_one(interview.model_dump())
    
    # Adicionar ao histórico da application
    from models import Application
    stage_history = app.get("stage_history", [])
    stage_history.append({
        "from": app["current_stage"],
        "to": app["current_stage"],
        "changedBy": user["id"],
        "changedAt": datetime.now(timezone.utc).isoformat(),
        "note": f"Entrevista {data.type} agendada para {starts_at.strftime('%d/%m/%Y %H:%M')}"
    })
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {"stage_history": stage_history}}
    )
    
    # Enviar notificações
    await notify_interview_event(interview, "interview_scheduled")
    
    return {
        "success": True,
        "interview": interview.model_dump()
    }


@router.get("/{interview_id}")
async def get_interview(
    interview_id: str,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Busca uma entrevista específica"""
    user = await get_current_user(request, session_token)
    
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada")
    
    # Validar acesso
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == interview["tenant_id"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem acesso a esta entrevista")
    
    return interview


@router.patch("/{interview_id}")
async def update_interview(
    interview_id: str,
    data: UpdateInterviewRequest,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Atualiza uma entrevista"""
    user = await get_current_user(request, session_token)
    
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada")
    
    # Validar acesso (recruiter/admin)
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == interview["tenant_id"] and r["role"] in ["admin", "recruiter"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem permissão para editar esta entrevista")
    
    # Preparar updates
    updates = {}
    was_rescheduled = False
    
    if data.type:
        updates["interview_type"] = data.type
    
    if data.starts_at_iso:
        new_starts = datetime.fromisoformat(data.starts_at_iso.replace('Z', '+00:00'))
        if new_starts != interview["starts_at"]:
            updates["starts_at"] = new_starts
            was_rescheduled = True
    
    if data.ends_at_iso:
        new_ends = datetime.fromisoformat(data.ends_at_iso.replace('Z', '+00:00'))
        if new_ends != interview["ends_at"]:
            updates["ends_at"] = new_ends
            was_rescheduled = True
    
    if data.timezone:
        updates["timezone"] = data.timezone
    
    if data.location:
        updates["location"] = data.location
    
    if data.interviewer_user_id is not None:
        updates["interviewer_user_id"] = data.interviewer_user_id
    
    if data.notes is not None:
        updates["notes"] = data.notes
    
    if data.status:
        updates["status"] = data.status
        if data.status == "canceled":
            # Enviar notificação de cancelamento
            await notify_interview_event(interview, "interview_canceled")
    
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Aplicar updates
    await db.interviews.update_one(
        {"id": interview_id},
        {"$set": updates}
    )
    
    # Se foi reagendado, notificar
    if was_rescheduled:
        updated_interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
        await notify_interview_event(updated_interview, "interview_rescheduled")
    
    updated_interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    
    return {
        "success": True,
        "interview": updated_interview
    }


@router.delete("/{interview_id}")
async def cancel_interview(
    interview_id: str,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Cancela uma entrevista"""
    user = await get_current_user(request, session_token)
    
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada")
    
    # Validar acesso
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == interview["tenant_id"] and r["role"] in ["admin", "recruiter"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem permissão para cancelar esta entrevista")
    
    # Atualizar status
    await db.interviews.update_one(
        {"id": interview_id},
        {"$set": {
            "status": "canceled",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Notificar
    await notify_interview_event(interview, "interview_canceled")
    
    return {"success": True, "message": "Entrevista cancelada com sucesso"}


@router.get("/")
async def list_interviews(
    tenant_id: str = Query(...),
    range_start_iso: Optional[str] = Query(None),
    range_end_iso: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    interview_type: Optional[str] = Query(None),
    application_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Lista entrevistas com filtros"""
    user = await get_current_user(request, session_token)
    
    # Validar acesso ao tenant
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == tenant_id for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este tenant")
    
    # Montar query
    query = {"tenant_id": tenant_id}
    
    if range_start_iso:
        query["starts_at"] = {"$gte": datetime.fromisoformat(range_start_iso.replace('Z', '+00:00'))}
    
    if range_end_iso:
        if "starts_at" in query:
            query["starts_at"]["$lte"] = datetime.fromisoformat(range_end_iso.replace('Z', '+00:00'))
        else:
            query["starts_at"] = {"$lte": datetime.fromisoformat(range_end_iso.replace('Z', '+00:00'))}
    
    if status:
        query["status"] = status
    
    if interview_type:
        query["interview_type"] = interview_type
    
    if application_id:
        query["application_id"] = application_id
    
    # Contar total
    total = await db.interviews.count_documents(query)
    
    # Buscar com paginação
    skip = (page - 1) * page_size
    interviews = await db.interviews.find(
        query,
        {"_id": 0}
    ).sort("starts_at", 1).skip(skip).limit(page_size).to_list(page_size)
    
    return {
        "interviews": interviews,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.post("/{interview_id}/confirm")
async def confirm_interview(
    interview_id: str,
    data: ConfirmInterviewRequest,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Confirma participação em uma entrevista"""
    user = await get_current_user(request, session_token)
    
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada")
    
    # Atualizar confirmações
    confirmations = interview.get("confirmations", {})
    confirmations[data.actor] = {
        "at": datetime.now(timezone.utc).isoformat(),
        "by": user["id"]
    }
    
    await db.interviews.update_one(
        {"id": interview_id},
        {"$set": {"confirmations": confirmations}}
    )
    
    return {
        "success": True,
        "message": f"Confirmação de {data.actor} registrada"
    }


@router.post("/{interview_id}/mark")
async def mark_interview_status(
    interview_id: str,
    data: MarkInterviewRequest,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """Marca entrevista como concluída ou faltou"""
    user = await get_current_user(request, session_token)
    
    interview = await db.interviews.find_one({"id": interview_id}, {"_id": 0})
    if not interview:
        raise HTTPException(status_code=404, detail="Entrevista não encontrada")
    
    # Validar acesso
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == interview["tenant_id"] and r["role"] in ["admin", "recruiter"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem permissão para alterar esta entrevista")
    
    # Atualizar status
    await db.interviews.update_one(
        {"id": interview_id},
        {"$set": {
            "status": data.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Adicionar ao histórico da application
    app = await db.applications.find_one({"id": interview["application_id"]}, {"_id": 0})
    if app:
        stage_history = app.get("stage_history", [])
        stage_history.append({
            "from": app["current_stage"],
            "to": app["current_stage"],
            "changedBy": user["id"],
            "changedAt": datetime.now(timezone.utc).isoformat(),
            "note": f"Entrevista marcada como {data.status}"
        })
        
        await db.applications.update_one(
            {"id": interview["application_id"]},
            {"$set": {"stage_history": stage_history}}
        )
    
    return {
        "success": True,
        "message": f"Entrevista marcada como {data.status}"
    }


async def notify_interview_event(interview: Dict, event_type: str):
    """Helper para enviar notificações de eventos de entrevista"""
    service = get_notification_service()
    
    # Buscar application e job
    app = await db.applications.find_one({"id": interview["application_id"]}, {"_id": 0})
    if not app:
        return
    
    job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0})
    job_title = job["title"] if job else "Vaga"
    
    # Buscar candidato
    candidate = await db.candidates.find_one({"id": app["candidate_id"]}, {"_id": 0})
    if not candidate:
        return
    
    candidate_user = await db.users.find_one({"id": candidate["user_id"]}, {"_id": 0})
    
    # Mapear tipos de entrevista
    type_labels = {
        "recruiter": "RH",
        "client": "Cliente",
        "technical": "Técnica"
    }
    
    interview_type_label = type_labels.get(interview["interview_type"], interview["interview_type"])
    
    # Formatar data
    starts_at = interview["starts_at"]
    if isinstance(starts_at, str):
        starts_at = datetime.fromisoformat(starts_at.replace('Z', '+00:00'))
    
    date_str = starts_at.strftime("%d/%m/%Y às %H:%M")
    
    # Títulos e bodies conforme evento
    titles = {
        "interview_scheduled": "Entrevista agendada",
        "interview_rescheduled": "Entrevista reagendada",
        "interview_canceled": "Entrevista cancelada"
    }
    
    bodies = {
        "interview_scheduled": f"Sua entrevista de {interview_type_label} para {job_title} foi marcada para {date_str}.",
        "interview_rescheduled": f"Sua entrevista de {interview_type_label} para {job_title} foi reagendada para {date_str}.",
        "interview_canceled": f"Sua entrevista de {interview_type_label} para {job_title} foi cancelada."
    }
    
    title = titles.get(event_type, "Atualização de entrevista")
    body = bodies.get(event_type, "Houve uma atualização em sua entrevista.")
    
    # Notificar candidato
    if candidate_user:
        await service.create_in_app(
            user_id=candidate_user["id"],
            tenant_id=app["tenant_id"],
            notification_type=event_type,
            title=title,
            body=body,
            link=f"/applications/{app['id']}"
        )
        
        await service.enqueue_email(
            user_id=candidate_user["id"],
            tenant_id=app["tenant_id"],
            notification_type=event_type,
            title=title,
            body=body,
            link=f"/applications/{app['id']}"
        )
    
    # Notificar recrutadores
    recruiter_roles = await db.user_org_roles.find({
        "organization_id": app["tenant_id"],
        "role": "recruiter"
    }, {"_id": 0}).to_list(100)
    
    for role in recruiter_roles:
        await service.create_in_app(
            user_id=role["user_id"],
            tenant_id=app["tenant_id"],
            notification_type=event_type,
            title=title,
            body=body,
            link=f"/applications/{app['id']}"
        )
    
    # Notificar cliente
    client_roles = await db.user_org_roles.find({
        "organization_id": app["tenant_id"],
        "role": "client"
    }, {"_id": 0}).to_list(100)
    
    for role in client_roles:
        await service.create_in_app(
            user_id=role["user_id"],
            tenant_id=app["tenant_id"],
            notification_type=event_type,
            title=title,
            body=body,
            link=f"/jobs/{app['job_id']}/pipeline"
        )
