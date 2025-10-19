from fastapi import APIRouter, HTTPException, Depends, Request, Cookie
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from server import db
from models import Notification
from utils.auth import get_current_user

router = APIRouter()


class NotificationCreate(BaseModel):
    user_id: str
    notification_type: str
    payload: Dict[str, Any]


@router.get("")
async def get_notifications(
    request: Request, 
    session_token: Optional[str] = Cookie(None),
    since: Optional[str] = None,
    limit: int = 50
):
    """Buscar notificações do usuário com suporte a polling"""
    user = await get_current_user(request, session_token)
    
    query = {"user_id": user["id"]}
    
    # Se passar timestamp 'since', busca apenas notificações mais recentes
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query["created_at"] = {"$gt": since_dt.isoformat()}
        except:
            pass
    
    notifications = await db.notifications.find(
        query, 
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    
    # Contar não lidas
    unread_count = await db.notifications.count_documents({
        "user_id": user["id"],
        "read": False
    })
    
    return {
        "notifications": notifications,
        "unread_count": unread_count
    }


@router.patch("/{notification_id}/read")
async def mark_as_read(
    notification_id: str,
    request: Request, 
    session_token: Optional[str] = Cookie(None)
):
    """Marcar notificação como lida"""
    user = await get_current_user(request, session_token)
    
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": user["id"]},
        {"$set": {"read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    return {"message": "Notificação marcada como lida"}


@router.post("/mark-all-read")
async def mark_all_as_read(
    request: Request, 
    session_token: Optional[str] = Cookie(None)
):
    """Marcar todas as notificações como lidas"""
    user = await get_current_user(request, session_token)
    
    await db.notifications.update_many(
        {"user_id": user["id"], "read": False},
        {"$set": {"read": True}}
    )
    
    return {"message": "Todas as notificações foram marcadas como lidas"}


async def create_notification(
    user_id: str,
    type: str,
    title: str,
    message: str,
    link: Optional[str] = None,
    data: Optional[dict] = None
):
    """Helper function para criar notificação"""
    notification = Notification(
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        link=link,
        data=data
    )
    
    await db.notifications.insert_one(notification.model_dump())
    return notification
