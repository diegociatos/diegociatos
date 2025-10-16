from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, List, Literal
from server import db
from models import Feedback
from utils.auth import get_current_user, get_user_roles

router = APIRouter()


class FeedbackCreate(BaseModel):
    application_id: str
    role_context: Literal["recruiter", "client"]
    recommendation: Literal["advance", "hold", "reject"]
    comments: Optional[str] = None
    visibility: Literal["internal", "client", "candidate"] = "internal"


@router.post("/")
async def create_feedback(data: FeedbackCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    app = await db.applications.find_one({"id": data.application_id})
    if not app:
        raise HTTPException(status_code=404, detail="Candidatura não encontrada")
    
    job = await db.jobs.find_one({"id": app["job_id"]})
    await get_user_roles(user["id"], job["organization_id"])
    
    feedback = Feedback(author_user_id=user["id"], **data.model_dump())
    await db.feedbacks.insert_one(feedback.model_dump())
    return feedback


@router.get("/")
async def list_feedbacks(
    application_id: Optional[str] = None,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    user = await get_current_user(request, session_token)
    
    query = {}
    if application_id:
        query["application_id"] = application_id
    
    feedbacks = await db.feedbacks.find(query, {"_id": 0}).to_list(1000)
    
    for feedback in feedbacks:
        author = await db.users.find_one({"id": feedback["author_user_id"]}, {"_id": 0, "password_hash": 0})
        feedback["author"] = {"full_name": author["full_name"], "email": author["email"]}
    
    return feedbacks
