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


@router.post("/")
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
