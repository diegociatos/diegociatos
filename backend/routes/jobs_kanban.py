from fastapi import APIRouter, HTTPException, Request, Cookie
from pydantic import BaseModel
from typing import Optional, Literal, List
from datetime import datetime, timezone
from server import db
from models import JobStageHistory, JobNote
from utils.auth import get_current_user, get_user_roles

router = APIRouter()


class MoveJobStageRequest(BaseModel):
    to_stage: Literal["cadastro", "triagem", "entrevistas", "selecao", "envio_cliente", "contratacao"]
    notes: Optional[str] = None


class ContratacaoResultRequest(BaseModel):
    result: Literal["positivo", "negativo"]
    notes: Optional[str] = None


class CreateJobNoteRequest(BaseModel):
    content: str


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
            # Buscar vagas onde organization_id OU tenant_id estão na lista
            query["$or"] = [
                {"organization_id": {"$in": org_ids}},
                {"tenant_id": {"$in": org_ids}}
            ]
        else:
            # Se não é recruiter ou client, mostrar todas para admin/analyst
            pass
    
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


@router.post("/{job_id}/notes")
async def create_job_note(
    job_id: str,
    data: CreateJobNoteRequest,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria uma nova anotação para a vaga (controle do analista)
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
    
    # Criar nota
    note = JobNote(
        job_id=job_id,
        author_id=user["id"],
        content=data.content
    )
    await db.job_notes.insert_one(note.model_dump())
    
    # Buscar informações do autor
    note_dict = note.model_dump()
    author = await db.users.find_one(
        {"id": user["id"]},
        {"_id": 0, "id": 1, "full_name": 1, "email": 1}
    )
    note_dict["author"] = author
    
    return note_dict


@router.get("/{job_id}/notes")
async def get_job_notes(
    job_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna todas as anotações de uma vaga
    """
    user = await get_current_user(request, session_token)
    
    # Buscar vaga
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    # Buscar notas
    notes = await db.job_notes.find(
        {"job_id": job_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(None)
    
    # Buscar informações dos autores
    for note in notes:
        author = await db.users.find_one(
            {"id": note["author_id"]},
            {"_id": 0, "id": 1, "full_name": 1, "email": 1}
        )
        if author:
            note["author"] = author
    
    return {"notes": notes}


@router.delete("/{job_id}/notes/{note_id}")
async def delete_job_note(
    job_id: str,
    note_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Deleta uma anotação (somente o autor ou admin pode deletar)
    """
    user = await get_current_user(request, session_token)
    
    # Buscar nota
    note = await db.job_notes.find_one({"id": note_id, "job_id": job_id})
    if not note:
        raise HTTPException(status_code=404, detail="Anotação não encontrada")
    
    # Buscar vaga para verificar permissão
    job = await db.jobs.find_one({"id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Vaga não encontrada")
    
    # Verificar se é o autor ou admin
    roles = await get_user_roles(user["id"], job["organization_id"])
    is_admin = any(r["role"] == "admin" for r in roles)
    is_author = note["author_id"] == user["id"]
    
    if not (is_admin or is_author):
        raise HTTPException(status_code=403, detail="Apenas o autor ou admin pode deletar esta anotação")
    
    # Deletar
    await db.job_notes.delete_one({"id": note_id})
    
    return {"message": "Anotação deletada com sucesso"}

