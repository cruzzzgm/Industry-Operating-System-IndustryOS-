# =============================================================================
# ROUTER CUSTOMERS - API REST de Clientes
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# Endpoints REST para operações com clientes.
#
# =============================================================================

from typing import List, Optional, Literal
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

# Database
from app.db.database import get_db

# Security (opcional para desenvolvimento)
from app.core.security import get_current_user
from app.models.user import User

# Models
from app.models.customer import Customer
from app.models.order import Order

# Schemas
from app.schemas.customer import (
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
    CustomerStatisticsResponse,
)

# Criar router
router = APIRouter(prefix="/customers", tags=["Clientes"])


def generate_customer_id() -> str:
    """Gera ID único para cliente."""
    from datetime import datetime
    now = datetime.now()
    return f"CLI-{now.year}-{now.strftime('%m%d%H%M%S')}"


# =============================================================================
# ENDPOINTS: CRUD BÁSICO
# =============================================================================

@router.get(
    "/",
    response_model=CustomerListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar clientes",
    description="Lista clientes com filtros e paginação."
)
async def list_customers(
    search: Optional[str] = Query(None, description="Busca textual por nome, empresa ou CNPJ"),
    status: Optional[Literal["active", "inactive", "at_risk"]] = Query(
        None, description="Filtrar por status de atividade"
    ),
    page: int = Query(1, ge=1, description="Número da página"),
    limit: int = Query(20, ge=1, le=100, description="Itens por página"),
    db: Session = Depends(get_db)
):
    """Lista clientes com filtros e paginação."""
    query = db.query(Customer)
    
    # Aplicar filtros de busca
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Customer.name.ilike(search_filter)) |
            (Customer.company.ilike(search_filter)) |
            (Customer.cnpj.ilike(search_filter)) |
            (Customer.email.ilike(search_filter))
        )
    
    # Filtrar por status de atividade
    if status:
        today = datetime.now().date()
        ninety_days_ago = today - timedelta(days=90)
        one_eighty_days_ago = today - timedelta(days=180)
        
        if status == "active":
            # Clientes com pedido nos últimos 90 dias
            active_ids = db.query(Order.customer_id).filter(
                Order.created_at >= ninety_days_ago
            ).distinct().subquery()
            query = query.filter(Customer.id.in_(active_ids))
        elif status == "inactive":
            # Clientes sem pedido há 90+ dias mas com pedido nos últimos 180 dias
            active_ids = db.query(Order.customer_id).filter(
                Order.created_at >= ninety_days_ago
            ).distinct().subquery()
            inactive_ids = db.query(Order.customer_id).filter(
                and_(
                    Order.created_at < ninety_days_ago,
                    Order.created_at >= one_eighty_days_ago
                )
            ).distinct().subquery()
            query = query.filter(
                and_(
                    Customer.id.notin_(active_ids),
                    Customer.id.in_(inactive_ids)
                )
            )
        elif status == "at_risk":
            # Clientes sem pedido há 180+ dias
            recent_ids = db.query(Order.customer_id).filter(
                Order.created_at >= one_eighty_days_ago
            ).distinct().subquery()
            query = query.filter(Customer.id.notin_(recent_ids))
    
    # Ordenar por data de criação decrescente
    query = query.order_by(Customer.created_at.desc())
    
    # Paginação
    total = query.count()
    pages = (total + limit - 1) // limit
    items = query.offset((page - 1) * limit).limit(limit).all()
    
    return CustomerListResponse(
        items=[CustomerResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1
    )


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter cliente por ID",
    description="Retorna detalhes de um cliente específico.",
    responses={404: {"description": "Cliente não encontrado"}}
)
async def get_customer(
    customer_id: str,
    db: Session = Depends(get_db)
):
    """Busca um cliente pelo ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {customer_id} não encontrado"
        )
    return CustomerResponse.model_validate(customer)


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar cliente",
    description="Cria um novo cliente."
)
async def create_customer(
    data: CustomerCreate,
    db: Session = Depends(get_db)
):
    """Cria um novo cliente."""
    # Verificar se CNPJ já existe
    existing = db.query(Customer).filter(Customer.cnpj == data.cnpj).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"CNPJ {data.cnpj} já cadastrado"
        )
    
    customer = Customer(
        name=data.name,
        email=data.email,
        phone=data.phone,
        company=data.company,
        cnpj=data.cnpj,
        address=data.address,
        city=data.city,
        state=data.state,
        country=data.country,
        segment=data.segment,
        contact=data.contact or data.name,
        notes=data.notes,
        last_order_date=None,
        total_orders=0,
        total_spent=0.0,
        icms_credit=0.0,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    return CustomerResponse.model_validate(customer)


@router.patch(
    "/{customer_id}",
    response_model=CustomerResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar cliente",
    description="Atualiza parcialmente um cliente.",
    responses={404: {"description": "Cliente não encontrado"}}
)
async def update_customer(
    customer_id: str,
    data: CustomerUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza um cliente existente."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {customer_id} não encontrado"
        )
    
    # Verificar CNPJ único se estiver sendo atualizado
    if data.cnpj and data.cnpj != customer.cnpj:
        existing = db.query(Customer).filter(Customer.cnpj == data.cnpj).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"CNPJ {data.cnpj} já cadastrado"
            )
    
    # Atualizar campos fornecidos
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(customer, field, value)
    
    customer.updated_at = datetime.now()
    
    db.commit()
    db.refresh(customer)
    
    return CustomerResponse.model_validate(customer)


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar cliente",
    description="Remove permanentemente um cliente.",
    responses={404: {"description": "Cliente não encontrado"}}
)
async def delete_customer(
    customer_id: str,
    db: Session = Depends(get_db)
):
    """Remove um cliente."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cliente {customer_id} não encontrado"
        )
    
    # Verificar se cliente tem pedidos
    orders_count = db.query(Order).filter(Order.customer_id == customer_id).count()
    if orders_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Não é possível excluir cliente com {orders_count} pedidos"
        )
    
    db.delete(customer)
    db.commit()
    
    return None


# =============================================================================
# ENDPOINTS: ESTATÍSTICAS
# =============================================================================

@router.get(
    "/statistics/summary",
    response_model=CustomerStatisticsResponse,
    status_code=status.HTTP_200_OK,
    summary="Estatísticas de clientes",
    description="Retorna estatísticas resumidas de clientes."
)
async def get_customer_statistics(
    db: Session = Depends(get_db)
):
    """Retorna estatísticas de clientes."""
    today = datetime.now().date()
    ninety_days_ago = today - timedelta(days=90)
    one_eighty_days_ago = today - timedelta(days=180)
    
    # Total de clientes cadastrados
    total = db.query(Customer).count()
    
    # Clientes com pedidos (ativos)
    customers_with_orders = db.query(Order.customer_id).distinct().subquery()
    active = db.query(Customer).filter(Customer.id.in_(customers_with_orders)).count()
    
    # Clientes sem pedidos (inativos)
    inactive = total - active
    
    # Clientes em risco (sem pedido há 180+ dias ou nunca tiveram pedido)
    recent_orders = db.query(Order.customer_id).filter(
        Order.created_at >= one_eighty_days_ago.strftime("%Y-%m-%d")
    ).distinct().subquery()
    at_risk = total - db.query(Customer).filter(Customer.id.in_(recent_orders)).count()
    
    # Ticket médio
    avg_ticket = db.query(func.avg(Order.total_value)).scalar() or 0
    
    # Receita total
    total_revenue = db.query(func.sum(Order.total_value)).scalar() or 0
    
    return CustomerStatisticsResponse(
        total=total,
        active=active,
        inactive=inactive,
        at_risk=at_risk,
        avg_ticket=round(avg_ticket, 2),
        total_revenue=round(total_revenue, 2)
    )
