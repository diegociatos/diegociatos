from fastapi import APIRouter, HTTPException, Request, Cookie, Query
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from server import db
from utils.auth import get_current_user, require_role
from datetime import datetime, timezone

router = APIRouter()


class MoveApplicationRequest(BaseModel):
    to_stage: str
    note: Optional[str] = None


@router.get("/{job_id}/pipeline")
async def get_job_pipeline(
    job_id: str,
    stage: Optional[str] = Query(None),
    min_score: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    has_must_have: Optional[bool] = Query(None),
    readonly: bool = Query(False),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna o pipeline (Kanban) de uma vaga com todas as applications organizadas por estágio.
    RBAC: recruiter|admin (full), client (readonly)
    """
    user = await get_current_user(request, session_token)
    
    # Buscar a vaga
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    tenant_id = job["organization_id"]
    
    # Validar acesso ao tenant
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    user_role_in_tenant = None
    for r in user_roles:
        if r["organization_id"] == tenant_id:
            user_role_in_tenant = r["role"]
            break
    
    if not user_role_in_tenant:
        raise HTTPException(status_code=403, detail="Você não tem acesso a este tenant")
    
    # Client só pode visualizar em modo readonly
    if user_role_in_tenant == "client" and not readonly:
        raise HTTPException(status_code=403, detail="Cliente só pode visualizar em modo leitura")
    
    # Buscar organização (client)
    org = await db.organizations.find_one({"id": tenant_id}, {"_id": 0})
    client_name = org["name"] if org else "N/A"
    
    # Definir colunas do Kanban
    columns = [
        {"key": "submitted", "label": "Coleta de Dados", "count": 0},
        {"key": "screening", "label": "Triagem", "count": 0},
        {"key": "recruiter_interview", "label": "Entrevista RH", "count": 0},
        {"key": "shortlisted", "label": "Selecionados", "count": 0},
        {"key": "client_interview", "label": "Entrevista Cliente", "count": 0},
        {"key": "offer", "label": "Oferta", "count": 0},
        {"key": "hired", "label": "Contratado", "count": 0},
        {"key": "rejected", "label": "Reprovado", "count": 0},
        {"key": "withdrawn", "label": "Desistência", "count": 0}
    ]
    
    # Buscar todas as applications da vaga
    query = {"tenant_id": tenant_id, "job_id": job_id}
    
    # Aplicar filtros
    if stage:
        query["current_stage"] = stage
    if min_score:
        query["scores.total"] = {"$gte": min_score}
    
    applications = await db.applications.find(query, {"_id": 0}).to_list(1000)
    
    # Buscar dados dos candidatos
    cards = []
    stage_counts = {}
    
    for app in applications:
        # Buscar candidato
        candidate = await db.candidates.find_one({"id": app["candidate_id"]}, {"_id": 0})
        if not candidate:
            continue
        
        # Buscar usuário do candidato para pegar o nome
        candidate_user = await db.users.find_one({"id": candidate["user_id"]}, {"_id": 0})
        candidate_name = candidate_user["full_name"] if candidate_user else "Candidato"
        
        # Aplicar filtro de cidade
        candidate_city = candidate.get("location_city")
        if city and candidate_city != city:
            continue
        
        # Aplicar filtro de must_have (placeholder - assumir que >80 score = must_have ok)
        must_have_ok = app.get("scores", {}).get("total", 0) >= 80
        if has_must_have and not must_have_ok:
            continue
        
        # Contar por estágio
        stage_key = app["current_stage"]
        stage_counts[stage_key] = stage_counts.get(stage_key, 0) + 1
        
        # Criar card
        cards.append({
            "applicationId": app["id"],
            "candidateName": candidate_name,
            "candidateCity": candidate_city,
            "scoreTotal": app.get("scores", {}).get("total", 0),
            "badges": {
                "mustHaveOk": must_have_ok,
                "availability": candidate.get("availability", "N/A"),
                "cultureMatch": "alto" if app.get("scores", {}).get("total", 0) > 85 else "médio"
            },
            "currentStage": app["current_stage"],
            "updatedAt": app["updated_at"].isoformat() if isinstance(app["updated_at"], datetime) else app["updated_at"]
        })
    
    # Atualizar contadores nas colunas
    for col in columns:
        col["count"] = stage_counts.get(col["key"], 0)
    
    return {
        "job": {
            "jobId": job["id"],
            "title": job["title"],
            "clientName": client_name,
            "status": job["status"]
        },
        "columns": columns,
        "cards": cards
    }


@router.post("/{application_id}/move")
async def move_application_stage(
    application_id: str,
    data: MoveApplicationRequest,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Move uma application para um novo estágio.
    RBAC: recruiter|admin apenas
    """
    user = await get_current_user(request, session_token)
    
    # Buscar application
    app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application não encontrada")
    
    # Validar acesso ao tenant
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == app["tenant_id"] and r["role"] in ["admin", "recruiter"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem acesso a esta application")
    
    # Validar estágio de destino
    valid_stages = ["submitted", "screening", "recruiter_interview", "shortlisted", "client_interview", "offer", "hired", "rejected", "withdrawn"]
    if data.to_stage not in valid_stages:
        raise HTTPException(status_code=400, detail="Estágio inválido")
    
    current_stage = app["current_stage"]
    
    # Regras de negócio
    # 1. Não permitir mover para 'hired' sem passar por 'offer'
    if data.to_stage == "hired" and current_stage not in ["offer"]:
        raise HTTPException(status_code=400, detail="Não é possível contratar sem fazer uma oferta primeiro")
    
    # 2. Exigir motivo ao reprovar
    if data.to_stage == "rejected" and not data.note:
        raise HTTPException(status_code=400, detail="É obrigatório informar o motivo da reprovação")
    
    # Criar entrada no histórico
    history_entry = {
        "from": current_stage,
        "to": data.to_stage,
        "changedBy": user["id"],
        "changedAt": datetime.now(timezone.utc).isoformat(),
        "note": data.note
    }
    
    # Atualizar application
    stage_history = app.get("stage_history", [])
    stage_history.append(history_entry)
    
    # Atualizar status se necessário
    new_status = app["status"]
    if data.to_stage == "hired":
        new_status = "hired"
    elif data.to_stage == "rejected":
        new_status = "rejected"
    elif data.to_stage == "withdrawn":
        new_status = "withdrawn"
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {
            "current_stage": data.to_stage,
            "status": new_status,
            "stage_history": stage_history,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Criar notificações
    await create_stage_change_notifications(app, data.to_stage, user["id"])
    
    # Retornar application atualizada
    updated_app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    
    return {
        "success": True,
        "application": updated_app,
        "lastHistory": history_entry
    }


@router.get("/{application_id}/history")
async def get_application_history(
    application_id: str,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna o histórico de mudanças de estágio de uma application.
    RBAC: recruiter|admin|client
    """
    user = await get_current_user(request, session_token)
    
    # Buscar application
    app = await db.applications.find_one({"id": application_id}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application não encontrada")
    
    # Validar acesso ao tenant
    user_roles = await db.user_org_roles.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    has_access = any(r["organization_id"] == app["tenant_id"] for r in user_roles)
    
    if not has_access:
        raise HTTPException(status_code=403, detail="Você não tem acesso a esta application")
    
    # Retornar histórico (ordenado desc)
    stage_history = app.get("stage_history", [])
    stage_history_sorted = sorted(stage_history, key=lambda x: x["changedAt"], reverse=True)
    
    # Buscar nomes dos usuários que fizeram as mudanças
    for entry in stage_history_sorted:
        changed_by_user = await db.users.find_one({"id": entry["changedBy"]}, {"_id": 0})
        entry["changedByName"] = changed_by_user["full_name"] if changed_by_user else "Usuário"
    
    return {
        "applicationId": application_id,
        "candidateId": app["candidate_id"],
        "jobId": app["job_id"],
        "history": stage_history_sorted
    }


async def create_stage_change_notifications(app: Dict, to_stage: str, changed_by_user_id: str):
    """Helper para criar notificações ao mudar estágio"""
    
    # Buscar vaga
    job = await db.jobs.find_one({"id": app["job_id"]}, {"_id": 0})
    job_title = job["title"] if job else "Vaga"
    
    # Buscar candidato
    candidate = await db.candidates.find_one({"id": app["candidate_id"]}, {"_id": 0})
    if not candidate:
        return
    
    # Buscar usuário do candidato
    candidate_user = await db.users.find_one({"id": candidate["user_id"]}, {"_id": 0})
    
    # Mapeamento de estágios para labels
    stage_labels = {
        "submitted": "Coleta de Dados",
        "screening": "Triagem",
        "recruiter_interview": "Entrevista RH",
        "shortlisted": "Selecionados",
        "client_interview": "Entrevista com Cliente",
        "offer": "Oferta",
        "hired": "Contratado",
        "rejected": "Reprovado",
        "withdrawn": "Desistência"
    }
    
    stage_label = stage_labels.get(to_stage, to_stage)
    
    # 1. Notificação para o candidato
    if candidate_user:
        from models import Notification
        notif_candidate = Notification(
            user_id=candidate_user["id"],
            tenant_id=app["tenant_id"],
            channel="system",
            title=f"Atualização no processo seletivo",
            body=f"Seu processo mudou para '{stage_label}' na vaga {job_title}",
            link=f"/applications/{app['id']}",
            is_read=False
        )
        await db.notifications.insert_one(notif_candidate.model_dump())
    
    # 2. Notificação para o cliente (somente em estágios específicos)
    notify_client_stages = ["shortlisted", "client_interview", "offer", "hired"]
    if to_stage in notify_client_stages:
        # Buscar usuários clientes do tenant
        client_roles = await db.user_org_roles.find({
            "organization_id": app["tenant_id"],
            "role": "client"
        }, {"_id": 0}).to_list(100)
        
        for role in client_roles:
            from models import Notification
            notif_client = Notification(
                user_id=role["user_id"],
                tenant_id=app["tenant_id"],
                channel="system",
                title=f"Candidato movido para {stage_label}",
                body=f"Candidato {candidate_user['full_name'] if candidate_user else 'N/A'} foi movido para '{stage_label}' na vaga {job_title}",
                link=f"/jobs/{app['job_id']}/pipeline",
                is_read=False
            )
            await db.notifications.insert_one(notif_client.model_dump())
