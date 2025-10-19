from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from server import db
from models import Questionnaire, Question, QuestionnaireAssignment, QuestionResponse, Assessment
from utils.auth import get_current_user
from services.questionnaire_analyzer import analyzer
from datetime import datetime, timezone

router = APIRouter()


class QuestionnaireCreate(BaseModel):
    key: str
    name: str
    description: Optional[str] = None


class QuestionCreate(BaseModel):
    text: str
    question_type: str
    options: Optional[List[Dict[str, Any]]] = None
    scale_min: Optional[int] = None
    scale_max: Optional[int] = None
    order_index: int = 0


class ResponseSubmit(BaseModel):
    responses: List[Dict[str, Any]]


@router.post("")
async def create_questionnaire(data: QuestionnaireCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    existing = await db.questionnaires.find_one({"key": data.key})
    if existing:
        raise HTTPException(status_code=400, detail="Questionário já existe")
    
    questionnaire = Questionnaire(**data.model_dump())
    await db.questionnaires.insert_one(questionnaire.model_dump())
    return questionnaire


@router.get("/{key}")
async def get_questionnaire(key: str):
    questionnaire = await db.questionnaires.find_one({"key": key}, {"_id": 0})
    if not questionnaire:
        raise HTTPException(status_code=404, detail="Questionário não encontrado")
    
    questions = await db.questions.find({"questionnaire_id": questionnaire["id"]}, {"_id": 0}).to_list(1000)
    questionnaire["questions"] = sorted(questions, key=lambda x: x["order_index"])
    
    return questionnaire


@router.post("/{questionnaire_id}/questions")
async def add_question(questionnaire_id: str, data: QuestionCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    question = Question(questionnaire_id=questionnaire_id, **data.model_dump())
    await db.questions.insert_one(question.model_dump())
    return question


@router.post("/assignments/{assignment_id}/responses")
async def submit_responses(assignment_id: str, data: ResponseSubmit, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    assignment = await db.questionnaire_assignments.find_one({"id": assignment_id})
    if not assignment:
        raise HTTPException(status_code=404, detail="Atribuição não encontrada")
    
    for resp in data.responses:
        response_obj = QuestionResponse(
            assignment_id=assignment_id,
            question_id=resp["question_id"],
            response_json=resp["response"]
        )
        await db.question_responses.insert_one(response_obj.model_dump())
    
    from datetime import datetime
    await db.questionnaire_assignments.update_one(
        {"id": assignment_id},
        {"$set": {"completed_at": datetime.now()}}
    )
    
    return {"message": "Respostas enviadas com sucesso"}


@router.post("/candidate/submit-all")
async def submit_all_questionnaires(
    data: Dict[str, Any],
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Candidato submete respostas de todos os 3 questionários de uma vez
    Gera análises com IA e salva como assessments
    """
    user = await get_current_user(request, session_token)
    
    # Verificar se é candidato
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        raise HTTPException(status_code=403, detail="Apenas candidatos podem responder")
    
    # Extrair respostas
    disc_responses = data.get("disc", [])
    recognition_responses = data.get("recognition", [])
    behavioral_responses = data.get("behavioral", [])
    
    if not all([disc_responses, recognition_responses, behavioral_responses]):
        raise HTTPException(status_code=400, detail="Todos os questionários são obrigatórios")
    
    try:
        # Analisar DISC
        disc_analysis = await analyzer.analyze_disc(disc_responses)
        disc_assessment = Assessment(
            application_id=candidate["id"],  # Usando candidate_id como referência
            kind="disc",
            data=disc_analysis,
            summary=disc_analysis["report"],
            score=disc_analysis["scores"][disc_analysis["dominant_profile"]],
            created_at=datetime.now(timezone.utc)
        )
        await db.assessments.insert_one(disc_assessment.model_dump())
        
        # Analisar Linguagens de Reconhecimento
        recognition_analysis = await analyzer.analyze_recognition(recognition_responses)
        recognition_assessment = Assessment(
            application_id=candidate["id"],
            kind="recognition",
            data=recognition_analysis,
            summary=recognition_analysis["report"],
            score=recognition_analysis["scores"][recognition_analysis["primary_language"]],
            created_at=datetime.now(timezone.utc)
        )
        await db.assessments.insert_one(recognition_assessment.model_dump())
        
        # Analisar Comportamental
        behavioral_analysis = await analyzer.analyze_behavioral(behavioral_responses)
        behavioral_assessment = Assessment(
            application_id=candidate["id"],
            kind="behavioral",
            data=behavioral_analysis,
            summary=behavioral_analysis["report"],
            score=sum(behavioral_analysis["scores"].values()) / len(behavioral_analysis["scores"]),
            created_at=datetime.now(timezone.utc)
        )
        await db.assessments.insert_one(behavioral_assessment.model_dump())
        
        # Marcar candidato como tendo completado os questionários
        await db.candidates.update_one(
            {"id": candidate["id"]},
            {"$set": {
                "questionnaires_completed": True,
                "questionnaires_completed_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        
        return {
            "success": True,
            "message": "Questionários enviados e analisados com sucesso!",
            "analyses": {
                "disc": disc_analysis,
                "recognition": recognition_analysis,
                "behavioral": behavioral_analysis
            }
        }
    
    except Exception as e:
        print(f"Erro ao processar questionários: {e}")
        raise HTTPException(status_code=500, detail=f"Erro ao processar análise: {str(e)}")


@router.get("/candidate/assessments")
async def get_candidate_assessments(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """Retorna os assessments do candidato logado"""
    user = await get_current_user(request, session_token)
    
    candidate = await db.candidates.find_one({"user_id": user["id"]})
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidato não encontrado")
    
    assessments = await db.assessments.find(
        {"application_id": candidate["id"]},
        {"_id": 0}
    ).to_list(100)
    
    return {
        "questionnaires_completed": candidate.get("questionnaires_completed", False),
        "assessments": assessments
    }

