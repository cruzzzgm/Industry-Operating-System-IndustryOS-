# =============================================================================
# ROUTER STATISTICS - API de Estatísticas
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: statistics.py
# RESPONSABILIDADE: Endpoints de estatísticas e KPIs
#
# ENDPOINTS:
# - GET /statistics/orders - KPIs de pedidos
# - GET /statistics/customers - KPIs de clientes
# - GET /statistics/finance - KPIs financeiros
# - GET /statistics/products - KPIs de produtos
#
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timedelta
from pydantic import BaseModel
import re

from app.db.database import get_db
from app.models import Order, Customer, Product, FinanceEntry

router = APIRouter(prefix="/statistics", tags=["statistics"])


# =============================================================================
# SCHEMAS PYDANTIC
# =============================================================================

class OrderStatistics(BaseModel):
    total: int
    pending: int
    in_production: int
    finalized: int
    waiting_pickup: int
    picked_up: int
    canceled: int
    today_total: int
    today_value: float
    total_value: float
    avg_order_value: float


class CustomerStatistics(BaseModel):
    total: int
    active: int
    inactive: int
    at_risk: int
    avg_ticket: float
    total_revenue: float


class FinanceStatistics(BaseModel):
    total_revenue: float
    total_expenses: float
    profit: float
    unpaid_revenue: float
    unpaid_expenses: float
    total_paid: float
    margin_percent: float


class ProductStatistics(BaseModel):
    total: int
    total_value: float
    avg_price: float
    low_stock: int
    out_of_stock: int


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/orders", response_model=OrderStatistics)
def get_order_statistics(
    period: Optional[str] = Query(None, description="Periodo: today, week, month, year"),
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas de pedidos.
    """
    query = db.query(Order)
    
    # Filtrar por período se fornecido
    if period == "today":
        today = datetime.now().strftime("%Y-%m-%d")
        query = query.filter(Order.created_at.like(f"{today}%"))
    elif period == "week":
        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        query = query.filter(Order.created_at >= week_ago)
    elif period == "month":
        month_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        query = query.filter(Order.created_at >= month_ago)
    elif period == "year":
        year_ago = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        query = query.filter(Order.created_at >= year_ago)
    
    orders = query.all()
    
    total = len(orders)
    pending = sum(1 for o in orders if o.status == "Pendente")
    in_production = sum(1 for o in orders if o.status == "Em Produção")
    finalized = sum(1 for o in orders if o.status == "Finalizado")
    waiting_pickup = sum(1 for o in orders if o.status == "Aguardando Coleta")
    picked_up = sum(1 for o in orders if o.status == "Retirado")
    canceled = sum(1 for o in orders if o.status == "Cancelado")
    
    today = datetime.now().strftime("%Y-%m-%d")
    today_orders = [o for o in orders if o.created_at and o.created_at.startswith(today)]
    today_total = len(today_orders)
    today_value = sum(o.total_value or 0 for o in today_orders)
    
    total_value = sum(o.total_value or 0 for o in orders)
    avg_order_value = total_value / total if total > 0 else 0
    
    return OrderStatistics(
        total=total,
        pending=pending,
        in_production=in_production,
        finalized=finalized,
        waiting_pickup=waiting_pickup,
        picked_up=picked_up,
        canceled=canceled,
        today_total=today_total,
        today_value=today_value,
        total_value=total_value,
        avg_order_value=avg_order_value,
    )


@router.get("/customers", response_model=CustomerStatistics)
def get_customer_statistics(
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas de clientes.
    """
    customers = db.query(Customer).all()
    
    total = len(customers)
    
    # Calcular status baseado na última compra
    active = 0
    inactive = 0
    at_risk = 0
    
    for customer in customers:
        status = customer.get_status()
        if status == "Ativo":
            active += 1
        elif status == "Inativo":
            inactive += 1
        elif status == "Risco":
            at_risk += 1
    
    total_revenue = sum(c.total_spent or 0 for c in customers)
    avg_ticket = total_revenue / total if total > 0 else 0
    
    return CustomerStatistics(
        total=total,
        active=active,
        inactive=inactive,
        at_risk=at_risk,
        avg_ticket=avg_ticket,
        total_revenue=total_revenue,
    )


@router.get("/finance", response_model=FinanceStatistics)
def get_finance_statistics(
    period: Optional[str] = Query(None, description="Periodo: today, week, month, year, ou YYYY-MM"),
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas financeiras.
    """
    query = db.query(FinanceEntry)
    
    # Filtrar por período se fornecido
    if period == "today":
        today = datetime.now().strftime("%Y-%m-%d")
        query = query.filter(FinanceEntry.due_date == today)
    elif period == "week":
        week_ago = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        query = query.filter(FinanceEntry.due_date >= week_ago)
    elif period == "month":
        month_ago = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        query = query.filter(FinanceEntry.due_date >= month_ago)
    elif period == "year":
        year_ago = (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d")
        query = query.filter(FinanceEntry.due_date >= year_ago)
    elif period and re.match(r"^\d{4}-\d{2}$", period):
        # Formato YYYY-MM (ex: 2026-04)
        query = query.filter(FinanceEntry.due_date.like(f"{period}%"))
    
    entries = query.all()
    
    total_revenue = sum(e.value or 0 for e in entries if e.entry_type == "receita")
    total_expenses = sum(e.value or 0 for e in entries if e.entry_type == "despesa")
    profit = total_revenue - total_expenses
    
    unpaid_revenue = sum(e.value or 0 for e in entries if e.entry_type == "receita" and not e.paid)
    unpaid_expenses = sum(e.value or 0 for e in entries if e.entry_type == "despesa" and not e.paid)
    
    total_paid = sum(e.value or 0 for e in entries if e.paid)
    
    margin_percent = (profit / total_revenue * 100) if total_revenue > 0 else 0
    
    return FinanceStatistics(
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        profit=profit,
        unpaid_revenue=unpaid_revenue,
        unpaid_expenses=unpaid_expenses,
        total_paid=total_paid,
        margin_percent=margin_percent,
    )


@router.get("/products", response_model=ProductStatistics)
def get_product_statistics(
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas de produtos.
    """
    products = db.query(Product).all()
    
    total = len(products)
    total_value = sum(p.sale_price or 0 for p in products)
    avg_price = total_value / total if total > 0 else 0
    
    low_stock = sum(1 for p in products if p.is_low_stock)
    out_of_stock = sum(1 for p in products if p.stock_status == "out_of_stock")
    
    return ProductStatistics(
        total=total,
        total_value=total_value,
        avg_price=avg_price,
        low_stock=low_stock,
        out_of_stock=out_of_stock,
    )
