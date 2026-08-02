"""
Router de Notificações - API para gerenciamento de notificações
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.notification import Notification, NotificationType, NotificationPriority
from pydantic import BaseModel


# =============================================================================
# SCHEMAS PYDANTIC
# =============================================================================

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    priority: str
    icon: Optional[str] = None
    color: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    is_read: bool
    read_at: Optional[datetime] = None
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    items: List[NotificationResponse]
    total: int
    unread_count: int


class MarkAsReadRequest(BaseModel):
    notification_id: int


# =============================================================================
# ROUTER
# =============================================================================

router = APIRouter(prefix="/notifications", tags=["Notificações"])


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get(
    "",
    response_model=NotificationListResponse,
    summary="Listar notificações",
    description="Retorna lista de notificações com filtros opcionais."
)
async def list_notifications(
    unread_only: bool = Query(False, description="Apenas não lidas"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """
    Lista notificações do usuário.
    
    Suporta filtros para apenas não lidas e paginação.
    """
    query = db.query(Notification)
    
    if unread_only:
        query = query.filter(Notification.is_read == False)
    
    # Ordenar por mais recentes primeiro
    query = query.order_by(Notification.created_at.desc())
    
    total = query.count()
    unread_count = db.query(Notification).filter(Notification.is_read == False).count()
    
    notifications = query.offset(offset).limit(limit).all()
    
    return NotificationListResponse(
        items=notifications,
        total=total,
        unread_count=unread_count
    )


@router.get(
    "/unread-count",
    summary="Contar notificações não lidas",
    description="Retorna o número de notificações não lidas."
)
async def get_unread_count(db: Session = Depends(get_db)):
    """
    Retorna o número de notificações não lidas.
    """
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"unread_count": count}


@router.post(
    "/{notification_id}/mark-read",
    summary="Marcar notificação como lida",
    description="Marca uma notificação específica como lida."
)
async def mark_as_read(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """
    Marca uma notificação como lida.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    notification.is_read = True
    notification.read_at = datetime.utcnow()
    
    db.commit()
    db.refresh(notification)
    
    return {"message": "Notificação marcada como lida", "notification": notification}


@router.post(
    "/mark-all-read",
    summary="Marcar todas como lidas",
    description="Marca todas as notificações como lidas."
)
async def mark_all_as_read(db: Session = Depends(get_db)):
    """
    Marca todas as notificações como lidas.
    """
    db.query(Notification).filter(Notification.is_read == False).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    })
    
    db.commit()
    
    return {"message": "Todas as notificações marcadas como lidas"}


@router.delete(
    "/{notification_id}",
    summary="Deletar notificação",
    description="Remove uma notificação específica."
)
async def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db)
):
    """
    Deleta uma notificação.
    """
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notificação não encontrada")
    
    db.delete(notification)
    db.commit()
    
    return {"message": "Notificação deletada"}


@router.post(
    "/cleanup",
    summary="Limpar notificações antigas",
    description="Remove notificações mais antigas que X dias."
)
async def cleanup_old_notifications(
    days: int = Query(30, ge=1, le=365, description="Dias para manter"),
    db: Session = Depends(get_db)
):
    """
    Remove notificações mais antigas que o número de dias especificado.
    """
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    deleted = db.query(Notification).filter(
        Notification.created_at < cutoff_date
    ).delete()
    
    db.commit()
    
    return {"message": f"{deleted} notificações antigas removidas"}
