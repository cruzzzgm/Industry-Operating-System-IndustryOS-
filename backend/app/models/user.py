# =============================================================================
# MODEL USER - Entidade Usuário
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: user.py
# RESPONSABILIDADE: Definir estrutura da tabela de usuários
#
# INTEGRAÇÃO:
# - Sistema de autenticação e autorização
# - Controle de acesso ao sistema
#
# =============================================================================

from sqlalchemy import Column, String, Boolean, DateTime, Index
from datetime import datetime

from app.db.database import Base


class User(Base):
    """
    Usuário do sistema para autenticação.
    
    Attributes:
        id: Identificador único
        username: Nome de usuário (único)
        email: E-mail (único)
        hashed_password: Senha criptografada
        full_name: Nome completo
        is_active: Se usuário está ativo
        is_admin: Se usuário é administrador
        created_at: Data de criação
        updated_at: Última atualização
    """
    
    __tablename__ = "users"
    
    # -------------------------------------------------------------------------
    # COLUNAS PRINCIPAIS
    # -------------------------------------------------------------------------
    id = Column(
        String(50),
        primary_key=True,
        index=True,
        comment="Identificador único do usuário"
    )
    
    username = Column(
        String(50),
        nullable=False,
        unique=True,
        index=True,
        comment="Nome de usuário (único)"
    )
    
    email = Column(
        String(150),
        nullable=False,
        unique=True,
        index=True,
        comment="E-mail do usuário (único)"
    )
    
    hashed_password = Column(
        String(255),
        nullable=False,
        comment="Senha criptografada (bcrypt)"
    )
    
    full_name = Column(
        String(150),
        nullable=False,
        comment="Nome completo do usuário"
    )
    
    # -------------------------------------------------------------------------
    # COLUNAS DE STATUS E PERMISSÕES
    # -------------------------------------------------------------------------
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Se usuário está ativo"
    )
    
    is_admin = Column(
        Boolean,
        default=False,
        nullable=False,
        comment="Se usuário é administrador"
    )
    
    # -------------------------------------------------------------------------
    # TIMESTAMPS
    # -------------------------------------------------------------------------
    created_at = Column(
        String(19),
        nullable=False,
        default=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        comment="Data de criação no sistema"
    )
    
    updated_at = Column(
        String(19),
        nullable=False,
        default=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        onupdate=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        comment="Última atualização dos dados"
    )
    
    # -------------------------------------------------------------------------
    # ÍNDICES
    # -------------------------------------------------------------------------
    __table_args__ = (
        Index('ix_user_active', 'is_active'),
        Index('ix_user_admin', 'is_admin'),
        {'comment': 'Usuários do sistema para autenticação'}
    )
    
    def __repr__(self):
        return f"<User(id={self.id}, username={self.username}, email={self.email})>"
