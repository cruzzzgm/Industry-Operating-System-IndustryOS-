# =============================================================================
# MODEL CARRIER - Entidade Transportadora
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: carrier.py
# RESPONSABILIDADE: Definir estrutura da tabela de transportadoras
#
# INTEGRAÇÃO:
# - Usada em pedidos (Order) para informações de frete
# - Cadastro de transportadoras para logística
#
# =============================================================================

from sqlalchemy import Column, String, Boolean, Index
from datetime import datetime

from app.db.database import Base


class Carrier(Base):
    """
    Transportadora/Logística.
    
    Cadastra as transportadoras utilizadas para entrega de mercadorias.
    Usada para preencher informações de frete nos pedidos.
    
    Attributes:
        id: Identificador único
        name: Nome da transportadora
        cnpj: CNPJ brasileiro (apenas números)
        is_active: Se está ativa para uso
        created_at: Data de cadastro
        updated_at: Última atualização
    """
    
    __tablename__ = "carriers"
    
    # -------------------------------------------------------------------------
    # COLUNAS PRINCIPAIS
    # -------------------------------------------------------------------------
    id = Column(
        String(50), 
        primary_key=True, 
        index=True,
        comment="Identificador único da transportadora"
    )
    
    name = Column(
        String(200), 
        nullable=False,
        unique=True,
        index=True,
        comment="Nome da transportadora"
    )
    
    cnpj = Column(
        String(18),  # Formatado: 00.000.000/0000-00
        nullable=False,
        unique=True,
        index=True,
        comment="CNPJ brasileiro (único por transportadora)"
    )
    
    is_active = Column(
        Boolean,
        default=True,
        nullable=False,
        index=True,
        comment="Se transportadora está ativa para uso"
    )
    
    # -------------------------------------------------------------------------
    # INFORMAÇÕES DE CONTATO
    # -------------------------------------------------------------------------
    phone = Column(
        String(20),
        nullable=True,
        comment="Telefone principal da transportadora"
    )
    
    email = Column(
        String(100),
        nullable=True,
        comment="E-mail de contato"
    )
    
    website = Column(
        String(100),
        nullable=True,
        comment="Website da transportadora"
    )
    
    # -------------------------------------------------------------------------
    # ENDEREÇO
    # -------------------------------------------------------------------------
    address = Column(
        String(200),
        nullable=True,
        comment="Endereço completo"
    )
    
    city = Column(
        String(100),
        nullable=True,
        comment="Cidade"
    )
    
    state = Column(
        String(2),
        nullable=True,
        comment="Estado (UF)"
    )
    
    zip_code = Column(
        String(9),
        nullable=True,
        comment="CEP formatado: 00000-000"
    )
    
    # -------------------------------------------------------------------------
    # PESSOA DE CONTATO
    # -------------------------------------------------------------------------
    contact_person = Column(
        String(100),
        nullable=True,
        comment="Nome da pessoa de contato"
    )
    
    contact_phone = Column(
        String(20),
        nullable=True,
        comment="Telefone direto do contato"
    )
    
    contact_email = Column(
        String(100),
        nullable=True,
        comment="E-mail do contato"
    )
    
    # -------------------------------------------------------------------------
    # TIMESTAMPS
    # -------------------------------------------------------------------------
    created_at = Column(
        String(19),  # Format: "YYYY-MM-DD HH:MM:SS"
        nullable=False,
        default=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        comment="Data de cadastro no sistema"
    )
    
    updated_at = Column(
        String(19),  # Format: "YYYY-MM-DD HH:MM:SS"
        nullable=False,
        default=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        onupdate=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        comment="Última atualização dos dados"
    )
    
    # -------------------------------------------------------------------------
    # ÍNDICES
    # -------------------------------------------------------------------------
    __table_args__ = (
        Index('ix_carrier_active', 'is_active'),
        {'comment': 'Cadastro de transportadoras para logística'}
    )
    
    def __repr__(self):
        return f"<Carrier(id={self.id}, name={self.name}, cnpj={self.cnpj})>"
