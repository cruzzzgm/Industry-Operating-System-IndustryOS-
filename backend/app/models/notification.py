"""
Notification Model - Sistema de Notificações
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.sql import func
from enum import Enum as PyEnum
from app.db.database import Base


class NotificationType(str, PyEnum):
    """Tipos de notificação disponíveis."""
    ORDER_CREATED = "order_created"
    ORDER_STATUS_CHANGED = "order_status_changed"
    ORDER_COMPLETED = "order_completed"
    ORDER_CANCELLED = "order_cancelled"
    
    STOCK_LOW = "stock_low"
    STOCK_OUT = "stock_out"
    
    PAYMENT_RECEIVED = "payment_received"
    PAYMENT_OVERDUE = "payment_overdue"
    
    SYSTEM = "system"
    REMINDER = "reminder"
    
    CUSTOMER_BIRTHDAY = "customer_birthday"
    CUSTOMER_ANNIVERSARY = "customer_anniversary"


class NotificationPriority(str, PyEnum):
    """Prioridades de notificação."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    """
    Modelo de Notificação para alertas do sistema.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    
    # Dados da notificação
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False, index=True)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    
    # Ícone e cor para UI
    icon = Column(String(50), nullable=True)  # Nome do ícone (Lucide)
    color = Column(String(20), nullable=True)  # blue, red, green, yellow, etc.
    
    # Relacionamentos
    user_id = Column(Integer, nullable=True, index=True)  # Null = broadcast
    entity_type = Column(String(50), nullable=True)  # 'order', 'customer', 'product'
    entity_id = Column(String(50), nullable=True)  # ID da entidade relacionada
    
    # Status
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Expiração
    expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Ações disponíveis
    action_url = Column(String(500), nullable=True)  # URL para navegação
    action_text = Column(String(100), nullable=True)  # Texto do botão de ação
    
    # Dados extras (JSON)
    extra_data = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<Notification(id={self.id}, type='{self.notification_type}', title='{self.title}')>"

    def mark_as_read(self):
        """Marca a notificação como lida."""
        self.is_read = True
        self.read_at = func.now()

    def to_dict(self):
        """Converte para dicionário."""
        return {
            "id": self.id,
            "title": self.title,
            "message": self.message,
            "notification_type": self.notification_type.value if self.notification_type else None,
            "priority": self.priority.value if self.priority else None,
            "icon": self.icon,
            "color": self.color,
            "user_id": self.user_id,
            "entity_type": self.entity_type,
            "entity_id": self.entity_id,
            "is_read": self.is_read,
            "read_at": self.read_at.isoformat() if self.read_at else None,
            "action_url": self.action_url,
            "action_text": self.action_text,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class NotificationPreference(Base):
    """
    Preferências de notificação por usuário.
    """
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, unique=True, index=True)
    
    # Configurações por tipo
    email_enabled = Column(Boolean, default=True)
    push_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    
    # Tipos habilitados (JSON)
    enabled_types = Column(Text, nullable=True)  # JSON array de NotificationType
    
    # Horário de silêncio
    quiet_hours_start = Column(Integer, nullable=True)  # Hora (0-23)
    quiet_hours_end = Column(Integer, nullable=True)  # Hora (0-23)
    
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<NotificationPreference(user_id={self.user_id})>"


class NotificationTemplate(Base):
    """
    Templates para notificações automatizadas.
    """
    __tablename__ = "notification_templates"

    id = Column(Integer, primary_key=True, index=True)
    
    name = Column(String(100), unique=True, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    
    # Templates com placeholders {{variable}}
    title_template = Column(String(200), nullable=False)
    message_template = Column(Text, nullable=False)
    
    # Configurações padrão
    default_icon = Column(String(50), nullable=True)
    default_color = Column(String(20), nullable=True)
    default_priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    
    # Condições para disparo (JSON - regras)
    trigger_conditions = Column(Text, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<NotificationTemplate(name='{self.name}')>"
