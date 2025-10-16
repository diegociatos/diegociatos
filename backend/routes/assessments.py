from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, Dict, Any, Literal
from server import db
from models import Assessment
from utils.auth import get_current_user
from services.assessment import AssessmentService

router = APIRouter()

assessment_service = AssessmentService()


class AssessmentData(BaseModel):
    data: Dict[str, Any]


@router.post("/{application_id}/{kind}")
async def create_assessment(
    application_id: str,
    kind: Literal["disc", "recognition", "behavioral"],
    data: AssessmentData,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    user = await get_current_user(request, session_token)
    
    app = await db.applications.find_one({"id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    summary = await assessment_service.analyze_assessment(kind, data.data)
    
    assessment = Assessment(
        application_id=application_id,
        kind=kind,
        data=data.data,
        summary=summary,
        score=None
    )
    await db.assessments.insert_one(assessment.model_dump())
    return assessment


@router.get("/{application_id}")
async def get_assessments(application_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    assessments = await db.assessments.find({"application_id": application_id}, {"_id": 0}).to_list(100)
    return assessments
