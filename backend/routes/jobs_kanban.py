from fastapi import APIRouter, HTTPException, Request, Cookie
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime, timezone
from server import db
from models import JobStageHistory
from utils.auth import get_current_user, get_user_roles

router = APIRouter()


class MoveJobStageRequest(BaseModel):
    to_stage: Literal["cadastro", "triagem", "entrevistas", "selecao", "envio_cliente", "contratacao"]
    notes: Optional[str] = None


class ContratacaoResultRequest(BaseModel):
    result: Literal["positivo", "negativo"]
    notes: Optional[str] = None


@router.get("/kanban")
async def get_jobs_kanban(request: Request, session_token: Optional[str] = Cookie(None)):
    """
    Retorna todas as vagas agrupadas por fase do recrutamento para o Kanban
    """
    user = await get_current_user(request, session_token)
    
    # Buscar roles do usuário
    roles = await get_user_roles(user["id"])
    
    # Filtrar por organização se não for admin
    query = {}
    if not any(r["role"] == "admin" for r in roles):
        org_ids = list(set([r["organization_id"] for r in roles if r["role"] in ["recruiter", "client"]]))
        if org_ids:
            query["organization_id"] = {"$in": org_ids}
        else:
            return {"stages": {}}
    
    # Buscar todas as vagas
    jobs = await db.jobs.find(query, {"_id": 0}).to_list(None)
    
    # Buscar contagem de candidatos para cada vaga
    for job in jobs:
        applications_count = await db.applications.count_documents({"job_id": job["id"]})
        job["applications_count"] = applications_count
    
    # Agrupar por fase
    stages = {
        "cadastro": [],
        "triagem": [],
        "entrevistas": [],
        "selecao": [],
        "envio_cliente": [],
        "contratacao": []
    }
    
    for job in jobs:
        stage = job.get("recruitment_stage", "cadastro")
        stages[stage].append(job)
    
    return {"stages": stages}


@router.patch("/{job_id}/stage")
async def move_job_stage(
    job_id: str, 
    data: MoveJobStageRequest, 
    request: Request, 
    session_token: Optional[str] = Cookie(None)
):
    """
    Move uma vaga para uma nova fase do recrutamento
    """
    user = await get_current_user(request, session_token)
    
    # Buscar vaga
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    # Verificar permissão
    roles = await get_user_roles(user["id"], job["organization_id"])
    if not any(r["role"] in ["admin", "recruiter"] for r in roles):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    # Salvar histórico
    from_stage = job.get("recruitment_stage", "cadastro")
    history = JobStageHistory(
        job_id=job_id,
        from_stage=from_stage,
        to_stage=data.to_stage,
        changed_by=user["id"],
        notes=data.notes
    )
    await db.job_stage_history.insert_one(history.model_dump())
    
    # Atualizar vaga
    update_data = {
        "recruitment_stage": data.to_stage,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Se saiu da fase de contratação, limpar resultado
    if from_stage == "contratacao" and data.to_stage != "contratacao":
        update_data["contratacao_result"] = None
    
    await db.jobs.update_one({"id": job_id}, {"$set": update_data})
    
    updated_job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    return updated_job


@router.patch("/{job_id}/contratacao-result")
async def set_contratacao_result(
    job_id: str,
    data: ContratacaoResultRequest,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Define o resultado da contratação (positivo ou negativo)
    Se negativo, move automaticamente de volta para Entrevistas
    """
    user = await get_current_user(request, session_token)
    
    # Buscar vaga
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    # Verificar permissão
    roles = await get_user_roles(user["id"], job["organization_id"])
    if not any(r["role"] in ["admin", "recruiter"] for r in roles):
        raise HTTPException(status_code=403, detail="Permissão negada")
    
    # Verificar se está na fase de contratação
    if job.get("recruitment_stage") != "contratacao":
        raise HTTPException(
            status_code=400, 
            detail="A vaga precisa estar na fase de Contratação para definir resultado"
        )
    
    # Salvar resultado
    update_data = {
        "contratacao_result": data.result,
        "updated_at": datetime.now(timezone.utc)
    }
    
    # Se negativo, voltar para entrevistas
    if data.result == "negativo":
        update_data["recruitment_stage"] = "entrevistas"
        
        # Salvar histórico
        history = JobStageHistory(
            job_id=job_id,
            from_stage="contratacao",
            to_stage="entrevistas",
            changed_by=user["id"],
            notes=f"Contratação negativa: {data.notes or 'Retornando para entrevistas'}"
        )
        await db.job_stage_history.insert_one(history.model_dump())
    else:
        # Se positivo, pode fechar a vaga
        update_data["status"] = "closed"
        
        # Salvar histórico
        history = JobStageHistory(
            job_id=job_id,
            from_stage="contratacao",
            to_stage="contratacao",
            changed_by=user["id"],
            notes=f"Contratação positiva: {data.notes or 'Vaga fechada com sucesso'}"
        )
        await db.job_stage_history.insert_one(history.model_dump())
    
    await db.jobs.update_one({"id": job_id}, {"$set": update_data})
    
    updated_job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    return updated_job


@router.get("/{job_id}/stage-history")
async def get_job_stage_history(
    job_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna o histórico de mudanças de fase de uma vaga
    """
    user = await get_current_user(request, session_token)
    
    # Buscar vaga
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    # Buscar histórico
    history = await db.job_stage_history.find(
        {"job_id": job_id},
        {"_id": 0}
    ).sort("changed_at", -1).to_list(None)
    
    # Buscar informações dos usuários que fizeram as mudanças
    for item in history:
        user_doc = await db.users.find_one(
            {"id": item["changed_by"]},
            {"_id": 0, "id": 1, "full_name": 1, "email": 1}
        )
        if user_doc:
            item["changed_by_user"] = user_doc
    
    return {"history": history}
