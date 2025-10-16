from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, Dict, Any
from server import db
from models import Notification
from utils.auth import get_current_user

router = APIRouter()


class NotificationCreate(BaseModel):
    user_id: str
    notification_type: str
    payload: Dict[str, Any]


@router.post("/")
async def create_notification(data: NotificationCreate, request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    notification = Notification(**data.model_dump())
    await db.notifications.insert_one(notification.model_dump())
    return notification


@router.get("/my")
async def get_my_notifications(request: Request, session_token: Optional[str] = Cookie(None)):
    user = await get_current_user(request, session_token)
    
    notifications = await db.notifications.find({"user_id": user["id"]}, {"_id": 0}).to_list(100)
    return notifications
