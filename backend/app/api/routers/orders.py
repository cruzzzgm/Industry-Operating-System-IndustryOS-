# =============================================================================
# ROUTER ORDERS - API REST de Pedidos
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# Endpoints REST para operações com pedidos (orders).
#
# =============================================================================

from typing import List, Optional, Literal
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

# Database
from app.db.database import get_db

# Models
from app.models.order import Order, OrderItem
from app.models.customer import Customer

# Schemas
from app.schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    OrderStatisticsResponse,
    OrderItemCreate,
)
from pydantic import BaseModel


class OrderStatusUpdate(BaseModel):
    status: Literal["Pendente", "Em Produção", "Finalizado", "Aguardando Coleta", "Retirado", "Cancelado"]

# Criar router
router = APIRouter(prefix="/orders", tags=["Pedidos"])


def generate_order_id() -> str:
    """Gera ID único para pedido."""
    from datetime import datetime
    now = datetime.now()
    return f"PED-{now.year}-{now.month:02d}-{now.day:02d}-{now.strftime('%H%M%S')}"


def generate_item_id() -> str:
    """Gera ID único para item."""
    from datetime import datetime
    now = datetime.now()
    return f"ITEM-{now.strftime('%Y%m%d%H%M%S%f')}"


# =============================================================================
# ENDPOINTS: CRUD BÁSICO
# =============================================================================

@router.get(
    "/",
    response_model=OrderListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar pedidos",
    description="Lista pedidos com filtros opcionais por status e paginação."
)
async def list_orders(
    status: Optional[Literal["Pendente", "Em Produção", "Finalizado", "Aguardando Coleta", "Retirado", "Cancelado"]] = Query(
        None, description="Filtrar por status"
    ),
    customer_id: Optional[str] = Query(None, description="Filtrar por cliente"),
    search: Optional[str] = Query(None, description="Busca textual"),
    page: int = Query(1, ge=1, description="Número da página"),
    limit: int = Query(20, ge=1, le=100, description="Itens por página"),
    db: Session = Depends(get_db)
):
    """Lista pedidos com filtros e paginação."""
    query = db.query(Order)
    
    # Aplicar filtros
    if status:
        query = query.filter(Order.status == status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Order.customer_name.ilike(search_filter)) |
            (Order.product.ilike(search_filter)) |
            (Order.id.ilike(search_filter))
        )
    
    # Ordenar por data de criação decrescente
    query = query.order_by(Order.created_at.desc())
    
    # Paginação
    total = query.count()
    pages = (total + limit - 1) // limit
    items = query.offset((page - 1) * limit).limit(limit).all()
    
    return OrderListResponse(
        items=[OrderResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1
    )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter pedido por ID",
    description="Retorna detalhes de um pedido específico.",
    responses={404: {"description": "Pedido não encontrado"}}
)
async def get_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    """Busca um pedido pelo ID."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_id} não encontrado"
        )
    return OrderResponse.model_validate(order)


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar pedido",
    description="Cria um novo pedido."
)
async def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db)
):
    """Cria um novo pedido."""
    # Buscar cliente para atualizar estatísticas
    customer = db.query(Customer).filter(Customer.id == data.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {data.customer_id} não encontrado"
        )
    
    # Usar nome do cliente se não fornecido
    customer_name = data.customer_name or customer.name
    
    # Criar pedido (ID gerado automaticamente pelo autoincrement)
    order = Order(
        customer_id=data.customer_id,
        customer_name=customer_name,
        product=data.product,
        quantity=data.quantity,
        total_value=data.total_value,
        status=data.status,
        delivery_method=data.delivery_method,
        has_recibo=data.has_recibo,
        recibo_number=data.recibo_number,
        carrier_name=data.carrier_name,
        gross_weight=data.gross_weight,
        tax_amount=data.tax_amount,
        icms_credit=data.icms_credit,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(order)
    db.flush()  # Flush para obter o ID gerado pelo autoincrement
    
    # Criar itens do pedido (ID gerado automaticamente)
    for item_data in data.items:
        item = OrderItem(
            order_id=order.id,
            description=item_data.description,
            ncm_code=item_data.ncm_code,
            unit=item_data.unit,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            total_price=item_data.quantity * item_data.unit_price,
            weight_per_unit=item_data.weight_per_unit
        )
        db.add(item)
    
    # Atualizar estatísticas do cliente
    customer.total_orders += 1
    customer.total_spent += data.total_value
    customer.last_order_date = datetime.now().strftime("%Y-%m-%d")
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


@router.patch(
    "/{order_id}",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar pedido",
    description="Atualiza parcialmente um pedido.",
    responses={404: {"description": "Pedido não encontrado"}}
)
async def update_order(
    order_id: str,
    data: OrderUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza um pedido existente."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_id} não encontrado"
        )
    
    # Atualizar campos fornecidos
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(order, field, value)
    
    order.updated_at = datetime.now()
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar pedido",
    description="Remove permanentemente um pedido.",
    responses={404: {"description": "Pedido não encontrado"}}
)
async def delete_order(
    order_id: str,
    db: Session = Depends(get_db)
):
    """Remove um pedido."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_id} não encontrado"
        )
    
    # Atualizar estatísticas do cliente
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    if customer:
        customer.total_orders -= 1
        customer.total_spent -= order.total_value
    
    db.delete(order)
    db.commit()
    
    return None


# =============================================================================
# ENDPOINTS: ESTATÍSTICAS
# =============================================================================

@router.get(
    "/statistics/summary",
    response_model=OrderStatisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Estatísticas de pedidos",
    description="Retorna estatísticas resumidas de pedidos. Opcionalmente filtra por período (formato YYYY-MM)."
)
async def get_order_statistics(
    period: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Retorna estatísticas de pedidos."""
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())
    
    # Filtrar por período se fornecido
    if period:
        try:
            year, month = map(int, period.split('-'))
            period_start = datetime(year, month, 1)
            if month == 12:
                period_end = datetime(year + 1, 1, 1) - timedelta(seconds=1)
            else:
                period_end = datetime(year, month + 1, 1) - timedelta(seconds=1)
            
            # Aplicar filtro de período (created_at é string no formato YYYY-MM-DD HH:MM:SS)
            period_start_str = period_start.strftime("%Y-%m-%d 00:00:00")
            period_end_str = period_end.strftime("%Y-%m-%d 23:59:59")
            
            orders_query = db.query(Order).filter(
                and_(
                    Order.created_at >= period_start_str,
                    Order.created_at <= period_end_str
                )
            )
        except ValueError:
            # Se o formato do período for inválido, usa todos os pedidos
            orders_query = db.query(Order)
    else:
        orders_query = db.query(Order)
    
    # Contagens por status
    total = orders_query.count()
    pending = orders_query.filter(Order.status == "Pendente").count()
    in_production = orders_query.filter(Order.status == "Em Produção").count()
    finalized = orders_query.filter(Order.status == "Finalizado").count()
    waiting_pickup = orders_query.filter(Order.status == "Aguardando Coleta").count()
    picked_up = orders_query.filter(Order.status == "Retirado").count()
    canceled = orders_query.filter(Order.status == "Cancelado").count()
    
    # Notas fiscais
    with_recibo = orders_query.filter(Order.has_recibo == True).count()
    without_recibo = orders_query.filter(
        (Order.has_recibo == False) & (Order.status != "Cancelado")
    ).count()
    
    # Pedidos de hoje
    today_orders_query = db.query(Order).filter(
        and_(
            Order.created_at >= today_start,
            Order.created_at <= today_end
        )
    )
    today_orders = today_orders_query.count()
    today_total = today_orders_query.with_entities(func.sum(Order.total_value)).scalar() or 0
    
    # Ticket médio
    avg_order_value = orders_query.with_entities(func.avg(Order.total_value)).scalar() or 0
    
    return OrderStatisticsResponse(
        total=total,
        pending=pending,
        in_production=in_production,
        finalized=finalized,
        waiting_pickup=waiting_pickup,
        picked_up=picked_up,
        canceled=canceled,
        with_recibo=with_recibo,
        without_recibo=without_recibo,
        today_total=today_total,
        today_orders=today_orders,
        avg_order_value=round(avg_order_value, 2)
    )


# =============================================================================
# ENDPOINTS: AÇÕES ESPECÍFICAS
# =============================================================================

@router.post(
    "/{order_id}/status",
    response_model=OrderResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar status",
    description="Atualiza apenas o status de um pedido.",
    responses={404: {"description": "Pedido não encontrado"}}
)
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate = Body(...),
    db: Session = Depends(get_db)
):
    """Atualiza o status de um pedido."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Pedido {order_id} não encontrado"
        )
    
    order.status = status_update.status
    order.updated_at = datetime.now()
    
    db.commit()
    db.refresh(order)
    
    return OrderResponse.model_validate(order)


# =============================================================================
# ENDPOINTS: IMPOSTOS DE NOTAS FISCAIS
# =============================================================================

@router.get(
    "/taxes/summary",
    status_code=status.HTTP_200_OK,
    summary="Resumo de impostos de NFs",
    description="Soma os impostos de pedidos com NF emitida no período.",
)
async def get_taxes_summary(
    period: str = Query(
        ...,
        pattern=r"^\d{4}-\d{2}$",
        description="Período YYYY-MM (ex: 2024-04)"
    ),
    db: Session = Depends(get_db)
):
    """
    Retorna soma de impostos de pedidos com NF emitida no período.
    
    Filtra pedidos onde has_recibo=True e created_at está no período.
    Soma ICMS, IPI, PIS, COFINS e total de impostos.
    """
    # Filtrar pedidos com NF emitida no período
    query = db.query(Order).filter(
        and_(
            Order.has_recibo == True,
            Order.created_at.like(f"{period}%")
        )
    )
    
    orders = query.all()
    
    # Somar impostos
    total_icms = sum((order.icms_amount or 0) for order in orders)
    total_ipi = sum((order.ipi_amount or 0) for order in orders)
    total_pis = sum((order.pis_amount or 0) for order in orders)
    total_cofins = sum((order.cofins_amount or 0) for order in orders)
    total_taxes = sum((order.tax_amount or 0) for order in orders)
    total_icms_credit = sum((order.icms_credit or 0) for order in orders)
    
    # Total de faturamento com NF
    total_revenue = sum((order.total_value or 0) for order in orders)
    
    return {
        "period": period,
        "total_icms": round(total_icms, 2),
        "total_ipi": round(total_ipi, 2),
        "total_pis": round(total_pis, 2),
        "total_cofins": round(total_cofins, 2),
        "total_taxes": round(total_taxes, 2),
        "total_icms_credit": round(total_icms_credit, 2),
        "total_revenue": round(total_revenue, 2),
        "orders_count": len(orders),
    }
