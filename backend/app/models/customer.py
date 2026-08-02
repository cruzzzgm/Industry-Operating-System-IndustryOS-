# =============================================================================
# MODEL CUSTOMER - Entidade Cliente
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: customer.py
# RESPONSABILIDADE: Definir estrutura da tabela de clientes
#
# INTEGRAÇÃO:
# - Relacionamento 1:N com Order (um cliente pode ter vários pedidos)
# - Dados de contato e localização (endereço completo)
# - Campos de CRM: segmento, anotações, crédito ICMS
#
# =============================================================================

from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime

from app.db.database import Base


class Customer(Base):
    """
    Cliente/Cadastro de empresas e pessoas.
    
    Centraliza todas as informações de clientes do sistema, incluindo
    dados de contato, localização, histórico de compras e informações
    de CRM para gestão de relacionamento.
    
    Attributes:
        id: Identificador único
        name: Nome do contato/responsável
        email: E-mail principal
        phone: Telefone de contato
        company: Nome da empresa (razão social)
        cnpj: CNPJ brasileiro (apenas números)
        address: Endereço completo (linha única)
        city: Cidade
        state: Estado (sigla 2 chars)
        country: País (código ISO ou nome)
        segment: Segmento de mercado (ex: "Indústria", "Varejo")
        contact: Nome do contato principal (redundante com name, mantido compatibilidade)
        notes: Anotações livres sobre o cliente
        last_order_date: Data do último pedido (YYYY-MM-DD)
        total_orders: Total de pedidos realizados
        total_spent: Total gasto em R$
        icms_credit: Crédito de ICMS disponível (R$)
        created_at: Data de cadastro
        updated_at: Última atualização
    """
    
    __tablename__ = "customers"
    
    # -------------------------------------------------------------------------
    # COLUNAS PRINCIPAIS
    # -------------------------------------------------------------------------
    id = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True,
        index=True,
        comment="Identificador único do cliente (sequencial)"
    )
    
    name = Column(
        String(150), 
        nullable=False,
        comment="Nome do contato principal"
    )
    
    email = Column(
        String(150), 
        nullable=False,
        index=True,
        comment="E-mail principal de contato"
    )
    
    phone = Column(
        String(20), 
        nullable=False,
        comment="Telefone com DDD (formato brasileiro)"
    )
    
    company = Column(
        String(200), 
        nullable=False,
        index=True,
        comment="Razão social da empresa"
    )
    
    cnpj = Column(
        String(18),  # Formatado: 00.000.000/0000-00
        nullable=False,
        unique=True,  # CNPJ deve ser único
        index=True,
        comment="CNPJ brasileiro (único por cliente)"
    )
    
    # Endereço completo (linha única para simplificar)
    address = Column(
        String(300), 
        nullable=False,
        comment="Endereço completo (rua, número, complemento)"
    )
    
    city = Column(
        String(100), 
        nullable=False,
        index=True,
        comment="Cidade"
    )
    
    state = Column(
        String(2),  # Sigla: SP, RJ, MG...
        nullable=False,
        index=True,
        comment="Estado (sigla 2 caracteres)"
    )
    
    country = Column(
        String(100), 
        nullable=False,
        default="Brasil",
        comment="País (nome ou código ISO)"
    )
    
    segment = Column(
        String(100), 
        nullable=True,
        index=True,
        comment="Segmento: 'Indústria', 'Varejo', 'Serviços', 'Atacado'..."
    )
    
    contact = Column(
        String(150), 
        nullable=True,
        comment="Nome do contato (compatibilidade)"
    )
    
    notes = Column(
        Text, 
        nullable=True,
        comment="Anotações livres sobre o cliente"
    )
    
    # Campos de análise/CRM
    last_order_date = Column(
        String(10),  # YYYY-MM-DD
        nullable=True,
        index=True,
        comment="Data do último pedido (para análise de atividade)"
    )
    
    total_orders = Column(
        Integer, 
        default=0,
        comment="Total acumulado de pedidos"
    )
    
    total_spent = Column(
        Float, 
        default=0.0,
        comment="Total acumulado gasto em R$"
    )
    
    icms_credit = Column(
        Float, 
        nullable=True,
        comment="Crédito de ICMS disponível (R$)"
    )
    
    # Timestamps
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Data de cadastro no sistema"
    )
    
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        comment="Última atualização dos dados"
    )
    
    # -------------------------------------------------------------------------
    # RELACIONAMENTOS
    # -------------------------------------------------------------------------
    # Um cliente pode ter muitos pedidos
    orders = relationship(
        "Order",
        back_populates="customer_ref",
        lazy="dynamic",
        cascade="all, delete-orphan"
    )
    
    # -------------------------------------------------------------------------
    # ÍNDICES
    # -------------------------------------------------------------------------
    __table_args__ = (
        # Índice composto para busca por cidade+estado
        Index('ix_customer_location', 'city', 'state'),
        
        # Índice para análise de última compra (CRM)
        Index('ix_customer_last_order', 'last_order_date'),
        
        {'comment': 'Cadastro de clientes com dados de contato e localização'}
    )
    
    def __repr__(self):
        return f"<Customer(id={self.id}, company={self.company}, city={self.city})>"
    
    def get_status(self, inactive_threshold: int = 90, risk_threshold: int = 60) -> str:
        """
        Calcula status do cliente baseado na última compra.
        
        Args:
            inactive_threshold: Dias para considerar inativo
            risk_threshold: Dias para considerar em risco
            
        Returns:
            str: "Ativo", "Risco" ou "Inativo"
        """
        if not self.last_order_date:
            return "Inativo"
        
        from datetime import datetime
        last_date = datetime.strptime(self.last_order_date, "%Y-%m-%d")
        days = (datetime.now() - last_date).days
        
        if days > inactive_threshold:
            return "Inativo"
        elif days > risk_threshold:
            return "Risco"
        return "Ativo"
