# =============================================================================
# SCHEMAS CUSTOMER - Validação e Serialização de Clientes
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# Schemas Pydantic para operações com clientes.
#
# =============================================================================

from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# =============================================================================
# CUSTOMER SCHEMAS
# =============================================================================

class CustomerBase(BaseModel):
    """Schema base para clientes."""
    name: str = Field(..., min_length=2, max_length=150, description="Nome do contato")
    email: str = Field(..., description="E-mail principal")
    phone: str = Field(..., description="Telefone de contato")
    company: str = Field(..., min_length=2, max_length=200, description="Razão social")
    cnpj: str = Field(..., description="CNPJ brasileiro")
    address: str = Field(..., description="Endereço completo")
    city: str = Field(..., description="Cidade")
    state: str = Field(..., min_length=2, max_length=2, description="Estado (sigla)")
    country: str = Field(default="Brasil", description="País")
    segment: Optional[str] = Field(None, description="Segmento de mercado")
    contact: Optional[str] = Field(None, description="Nome do contato principal")
    notes: Optional[str] = Field(None, description="Anotações")

class CustomerCreate(CustomerBase):
    """Schema para criar cliente."""
    pass

class CustomerUpdate(BaseModel):
    """Schema para atualizar cliente."""
    name: Optional[str] = Field(None, min_length=2, max_length=150)
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = Field(None, min_length=2, max_length=200)
    cnpj: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = Field(None, min_length=2, max_length=2)
    country: Optional[str] = None
    segment: Optional[str] = None
    contact: Optional[str] = None
    notes: Optional[str] = None

class CustomerResponse(CustomerBase):
    """Schema de resposta para cliente."""
    id: int = Field(..., description="Identificador único")
    last_order_date: Optional[str] = Field(None, description="Data do último pedido (YYYY-MM-DD)")
    total_orders: int = Field(default=0, description="Total de pedidos")
    total_spent: float = Field(default=0, ge=0, description="Total gasto (R$)")
    icms_credit: float = Field(default=0, ge=0, description="Crédito de ICMS (R$)")
    created_at: datetime = Field(..., description="Data de cadastro")
    updated_at: datetime = Field(..., description="Data de atualização")
    
    model_config = {"from_attributes": True}

class CustomerListResponse(BaseModel):
    """Schema de resposta para listagem de clientes."""
    items: List[CustomerResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool


# =============================================================================
# CUSTOMER STATISTICS SCHEMA
# =============================================================================

class CustomerStatisticsResponse(BaseModel):
    """Schema para estatísticas de clientes."""
    total: int = Field(..., description="Total de clientes")
    active: int = Field(..., description="Clientes ativos (com pedido nos últimos 90 dias)")
    inactive: int = Field(..., description="Clientes inativos (sem pedido há 90+ dias)")
    at_risk: int = Field(..., description="Clientes em risco (sem pedido há 180+ dias)")
    avg_ticket: float = Field(..., description="Ticket médio (R$)")
    total_revenue: float = Field(..., description="Receita total (R$)")
    
    model_config = {"from_attributes": True}
