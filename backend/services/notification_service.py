"""
Serviço de Notificações
Gerencia criação, envio e preferências de notificações in-app e email
"""
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorDatabase
from models import Notification, NotificationPreferences


class NotificationService:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
    
    async def get_default_preferences(self) -> Dict[str, Dict[str, bool]]:
        """Retorna preferências padrão para novos usuários"""
        return {
            "job_created": {"system": True, "email": False},
            "job_published": {"system": True, "email": True},
            "new_application": {"system": True, "email": True},
            "stage_changed": {"system": True, "email": True},
            "interview_scheduled": {"system": True, "email": True},
            "interview_rescheduled": {"system": True, "email": True},
            "interview_canceled": {"system": True, "email": True},
            "client_feedback": {"system": True, "email": True},
            "offer_made": {"system": True, "email": True},
            "hired": {"system": True, "email": True},
            "sla_warning": {"system": True, "email": True},
            "daily_digest": {"system": False, "email": True}
        }
    
    async def get_user_preferences(self, user_id: str) -> Dict[str, Dict[str, bool]]:
        """Busca preferências do usuário ou cria com defaults"""
        prefs = await self.db.notification_preferences.find_one({"user_id": user_id}, {"_id": 0})
        
        if not prefs:
            # Criar preferências padrão
            default_prefs = await self.get_default_preferences()
            pref_model = NotificationPreferences(
                user_id=user_id,
                prefs=default_prefs
            )
            await self.db.notification_preferences.insert_one(pref_model.model_dump())
            return default_prefs
        
        return prefs.get("prefs", await self.get_default_preferences())
    
    async def respect_preferences(self, user_id: str, notification_type: str, channel: str) -> bool:
        """Verifica se o usuário aceita este tipo de notificação neste canal"""
        prefs = await self.get_user_preferences(user_id)
        return prefs.get(notification_type, {}).get(channel, False)
    
    async def create_in_app(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        body: str,
        tenant_id: Optional[str] = None,
        link: Optional[str] = None
    ) -> Optional[str]:
        """Cria notificação in-app se o usuário tiver habilitado"""
        
        # Verificar preferências
        if not await self.respect_preferences(user_id, notification_type, "system"):
            return None
        
        notification = Notification(
            user_id=user_id,
            tenant_id=tenant_id,
            channel="system",
            notification_type=notification_type,
            title=title,
            body=body,
            link=link,
            is_read=False
        )
        
        result = await self.db.notifications.insert_one(notification.model_dump())
        return notification.id
    
    async def enqueue_email(
        self,
        user_id: str,
        notification_type: str,
        title: str,
        body: str,
        tenant_id: Optional[str] = None,
        link: Optional[str] = None
    ) -> Optional[str]:
        """Enfileira email para envio posterior se o usuário tiver habilitado"""
        
        # Verificar preferências
        if not await self.respect_preferences(user_id, notification_type, "email"):
            return None
        
        notification = Notification(
            user_id=user_id,
            tenant_id=tenant_id,
            channel="email",
            notification_type=notification_type,
            title=title,
            body=body,
            link=link,
            is_read=False,
            status="pending"
        )
        
        result = await self.db.notifications.insert_one(notification.model_dump())
        return notification.id
    
    async def mark_as_read(self, notification_ids: List[str], user_id: str) -> int:
        """Marca notificações como lidas (apenas do usuário)"""
        result = await self.db.notifications.update_many(
            {
                "id": {"$in": notification_ids},
                "user_id": user_id
            },
            {"$set": {"is_read": True}}
        )
        return result.modified_count
    
    async def mark_all_as_read(self, user_id: str) -> int:
        """Marca todas as notificações do usuário como lidas"""
        result = await self.db.notifications.update_many(
            {
                "user_id": user_id,
                "is_read": False
            },
            {"$set": {"is_read": True}}
        )
        return result.modified_count
    
    async def list_notifications(
        self,
        user_id: str,
        page: int = 1,
        page_size: int = 20,
        is_read: Optional[bool] = None
    ) -> Dict[str, Any]:
        """Lista notificações do usuário com paginação"""
        
        query = {"user_id": user_id, "channel": "system"}
        if is_read is not None:
            query["is_read"] = is_read
        
        # Contar total
        total = await self.db.notifications.count_documents(query)
        
        # Buscar com paginação
        skip = (page - 1) * page_size
        notifications = await self.db.notifications.find(
            query,
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(page_size).to_list(page_size)
        
        return {
            "notifications": notifications,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size
        }
    
    async def fetch_unread_count(self, user_id: str) -> int:
        """Retorna quantidade de notificações não lidas"""
        count = await self.db.notifications.count_documents({
            "user_id": user_id,
            "channel": "system",
            "is_read": False
        })
        return count
    
    async def update_preferences(self, user_id: str, updates: Dict[str, Dict[str, bool]]) -> bool:
        """Atualiza preferências do usuário (parcialmente)"""
        
        # Buscar preferências atuais
        current_prefs = await self.get_user_preferences(user_id)
        
        # Aplicar updates
        for notif_type, channels in updates.items():
            if notif_type not in current_prefs:
                current_prefs[notif_type] = {}
            current_prefs[notif_type].update(channels)
        
        # Salvar
        result = await self.db.notification_preferences.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "prefs": current_prefs,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        
        return result.modified_count > 0 or result.upserted_id is not None


# Singleton global (será inicializado no server.py)
notification_service: Optional[NotificationService] = None


def get_notification_service() -> NotificationService:
    """Retorna instância do serviço de notificações"""
    if notification_service is None:
        raise RuntimeError("NotificationService não inicializado")
    return notification_service
