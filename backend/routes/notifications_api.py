from fastapi import APIRouter, HTTPException, Request, Cookie, Query
from typing import Optional, List
from pydantic import BaseModel
from utils.auth import get_current_user, require_role
from services.notification_service import get_notification_service

router = APIRouter()


class MarkReadRequest(BaseModel):
    ids: List[str]


class UpdatePreferencesRequest(BaseModel):
    updates: dict  # { notification_type: { channel: bool } }


@router.get("/")
async def list_notifications(
    is_read: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Lista notificações do usuário logado
    """
    user = await get_current_user(request, session_token)
    service = get_notification_service()
    
    result = await service.list_notifications(
        user_id=user["id"],
        page=page,
        page_size=page_size,
        is_read=is_read
    )
    
    return result


@router.get("/unread-count")
async def get_unread_count(
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna quantidade de notificações não lidas (para o badge do sino)
    """
    user = await get_current_user(request, session_token)
    service = get_notification_service()
    
    count = await service.fetch_unread_count(user["id"])
    
    return {"unread_count": count}


@router.post("/mark-read")
async def mark_notifications_read(
    data: MarkReadRequest,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Marca notificações específicas como lidas
    """
    user = await get_current_user(request, session_token)
    service = get_notification_service()
    
    modified = await service.mark_as_read(data.ids, user["id"])
    
    return {
        "success": True,
        "modified_count": modified
    }


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Marca todas as notificações do usuário como lidas
    """
    user = await get_current_user(request, session_token)
    service = get_notification_service()
    
    modified = await service.mark_all_as_read(user["id"])
    
    return {
        "success": True,
        "modified_count": modified
    }


@router.get("/preferences")
async def get_notification_preferences(
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna preferências de notificação do usuário
    """
    user = await get_current_user(request, session_token)
    service = get_notification_service()
    
    prefs = await service.get_user_preferences(user["id"])
    
    return {
        "user_id": user["id"],
        "preferences": prefs
    }


@router.put("/preferences")
async def update_notification_preferences(
    data: UpdatePreferencesRequest,
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza preferências de notificação do usuário
    Body: { updates: { "stage_changed": { "email": false }, ... } }
    """
    user = await get_current_user(request, session_token)
    service = get_notification_service()
    
    success = await service.update_preferences(user["id"], data.updates)
    
    if success:
        prefs = await service.get_user_preferences(user["id"])
        return {
            "success": True,
            "preferences": prefs
        }
    else:
        raise HTTPException(status_code=500, detail="Erro ao atualizar preferências")


@router.post("/test")
async def create_test_notification(
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria uma notificação de teste para o usuário logado (admin apenas)
    """
    user = await get_current_user(request, session_token)
    await require_role(user, ["admin"])
    
    service = get_notification_service()
    
    # Criar notificação teste
    notif_id = await service.create_in_app(
        user_id=user["id"],
        notification_type="test",
        title="Notificação de Teste",
        body="Esta é uma notificação de teste do sistema.",
        link="/dashboard"
    )
    
    if notif_id:
        return {
            "success": True,
            "notification_id": notif_id,
            "message": "Notificação de teste criada com sucesso"
        }
    else:
        return {
            "success": False,
            "message": "Notificação bloqueada pelas preferências do usuário"
        }
