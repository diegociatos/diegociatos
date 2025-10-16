from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from typing import Optional
from server import db
from models import Score
from utils.auth import get_current_user
from services.scoring import ScoringService

router = APIRouter()

scoring_service = ScoringService()


@router.post("/{application_id}/recalculate")
async def recalculate_score(application_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    app = await db.applications.find_one({"id": application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    score_data = await scoring_service.calculate_score(application_id)
    
    existing_score = await db.scores.find_one({"application_id": application_id})
    if existing_score:
        await db.scores.update_one(
            {"application_id": application_id},
            {"$set": {"total_score": score_data["total_score"], "breakdown": score_data["breakdown"]}}
        )
    else:
        score_obj = Score(
            application_id=application_id,
            total_score=score_data["total_score"],
            breakdown=score_data["breakdown"]
        )
        await db.scores.insert_one(score_obj.model_dump())
    
    await db.applications.update_one(
        {"id": application_id},
        {"$set": {"stage_score": score_data["total_score"]}}
    )
    
    return score_data


@router.get("/{application_id}")
async def get_score(application_id: str, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    score = await db.scores.find_one({"application_id": application_id}, {"_id": 0})
    if not score:
        raise HTTPException(status_code=404, detail="Pontuação não encontrada")
    
    return score
