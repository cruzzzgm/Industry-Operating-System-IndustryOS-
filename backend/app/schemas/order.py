# =============================================================================
# SCHEMAS ORDER - Validação e Serialização de Pedidos
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# Schemas Pydantic para operações com pedidos (orders).
#
# =============================================================================

from typing import List, Optional, Literal
from datetime import datetime
from pydantic import BaseModel, Field

# =============================================================================
# ORDER ITEM SCHEMAS
# =============================================================================

class OrderItemBase(BaseModel):
    """Schema base para itens de pedido."""
    description: str = Field(..., description="Descrição do produto/serviço")
    ncm_code: Optional[str] = Field(None, description="Código NCM (8 dígitos)")
    unit: str = Field(default="UN", description="Unidade de medida")
    quantity: int = Field(default=1, ge=1, description="Quantidade")
    unit_price: float = Field(..., ge=0, description="Preço unitário (R$)")
    weight_per_unit: Optional[float] = Field(None, ge=0, description="Peso por unidade (kg)")

class OrderItemCreate(OrderItemBase):
    """Schema para criar item de pedido."""
    pass

class OrderItemUpdate(BaseModel):
    """Schema para atualizar item de pedido."""
    description: Optional[str] = None
    ncm_code: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=1)
    unit_price: Optional[float] = Field(None, ge=0)
    weight_per_unit: Optional[float] = Field(None, ge=0)

class OrderItemResponse(OrderItemBase):
    """Schema de resposta para item de pedido."""
    id: int = Field(..., description="Identificador único")
    order_id: int = Field(..., description="ID do pedido pai")
    total_price: float = Field(..., ge=0, description="Preço total calculado")
    
    model_config = {"from_attributes": True}


# =============================================================================
# ORDER SCHEMAS
# =============================================================================

class OrderBase(BaseModel):
    """Schema base para pedidos."""
    customer_id: int = Field(..., description="ID do cliente")
    customer_name: Optional[str] = Field(None, description="Nome do cliente (denormalizado)")
    product: Optional[str] = Field(None, description="Descrição resumida do produto")
    quantity: int = Field(default=1, ge=1, description="Quantidade total")
    total_value: float = Field(..., ge=0, description="Valor total (R$)")
    status: Literal["Pendente", "Em Produção", "Finalizado", "Aguardando Coleta", "Retirado", "Cancelado"] = Field(
        default="Pendente", description="Status do pedido"
    )
    delivery_method: Optional[str] = Field(None, description="Método de entrega")
    has_recibo: bool = Field(default=False, description="Possui nota fiscal/recibo")
    recibo_number: Optional[str] = Field(None, description="Número da NF/recibo")
    carrier_name: Optional[str] = Field(None, description="Nome da transportadora")
    gross_weight: Optional[float] = Field(None, ge=0, description="Peso total bruto (kg)")
    tax_amount: Optional[float] = Field(None, ge=0, description="Valor dos impostos (R$)")
    icms_credit: Optional[float] = Field(None, ge=0, description="Crédito de ICMS (R$)")

class OrderCreate(OrderBase):
    """Schema para criar pedido."""
    items: List[OrderItemCreate] = Field(default=[], description="Itens do pedido")

class OrderUpdate(BaseModel):
    """Schema para atualizar pedido."""
    customer_id: Optional[int] = None
    customer_name: Optional[str] = None
    product: Optional[str] = None
    quantity: Optional[int] = Field(None, ge=1)
    total_value: Optional[float] = Field(None, ge=0)
    status: Optional[Literal["Pendente", "Em Produção", "Finalizado", "Aguardando Coleta", "Retirado", "Cancelado"]] = None
    delivery_method: Optional[str] = None
    has_recibo: Optional[bool] = None
    recibo_number: Optional[str] = None
    carrier_name: Optional[str] = None
    gross_weight: Optional[float] = Field(None, ge=0)
    tax_amount: Optional[float] = Field(None, ge=0)
    icms_credit: Optional[float] = Field(None, ge=0)

class OrderResponse(OrderBase):
    """Schema de resposta para pedido."""
    id: int = Field(..., description="Identificador único")
    items: List[OrderItemResponse] = Field(default=[], description="Itens do pedido")
    created_at: datetime = Field(..., description="Data de criação")
    updated_at: datetime = Field(..., description="Data de atualização")
    
    model_config = {"from_attributes": True}

class OrderListResponse(BaseModel):
    """Schema de resposta para listagem de pedidos."""
    items: List[OrderResponse]
    total: int
    page: int
    limit: int
    pages: int
    has_next: bool
    has_prev: bool


# =============================================================================
# ORDER STATISTICS SCHEMA
# =============================================================================

class OrderStatisticsResponse(BaseModel):
    """Schema para estatísticas de pedidos."""
    total: int = Field(..., description="Total de pedidos")
    pending: int = Field(..., description="Pedidos pendentes")
    in_production: int = Field(..., description="Pedidos em produção")
    finalized: int = Field(..., description="Pedidos finalizados")
    waiting_pickup: int = Field(..., description="Aguardando coleta")
    picked_up: int = Field(..., description="Retirados")
    canceled: int = Field(..., description="Cancelados")
    with_recibo: int = Field(..., description="Com nota fiscal")
    without_recibo: int = Field(..., description="Sem nota fiscal")
    today_total: float = Field(..., description="Total de vendas hoje (R$)")
    today_orders: int = Field(..., description="Pedidos de hoje")
    avg_order_value: float = Field(..., description="Ticket médio (R$)")
    
    model_config = {"from_attributes": True}
