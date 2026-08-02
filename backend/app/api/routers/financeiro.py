# =============================================================================
# ROUTER FINANCEIRO - API REST do Módulo Financeiro
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: financeiro.py
# RESPONSABILIDADE: Endpoints REST para operações financeiras
#
# ENDPOINTS:
# - Lançamentos Financeiros: CRUD completo + filtros avançados
# - Despesas Fixas: CRUD
# - Contas a Pagar: CRUD + geração automática
# - Relatórios: Resumo do período, histórico, dashboard
#
# BASE PATH: /api/v1/financeiro
# =============================================================================

from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

# Database
from app.db.database import get_db

# Service (lógica de negócio)
from app.services.financeiro_service import FinanceiroService

# Schemas (validação e serialização)
from app.schemas.financeiro import (
    # Finance Entry
    FinanceEntryCreate,
    FinanceEntryUpdate,
    FinanceEntryResponse,
    FinanceEntryFilter,
    FinanceEntryListResponse,
    
    # Fixed Expense
    FixedExpenseCreate,
    FixedExpenseUpdate,
    FixedExpenseResponse,
    
    # Conta Pagar
    ContaPagarCreate,
    ContaPagarUpdate,
    ContaPagarResponse,
    ContaPagarListResponse,
    
    # Relatórios
    PeriodFilter,
    FinanceSummaryResponse,
)

# Criar router
router = APIRouter(prefix="/financeiro", tags=["Financeiro"])


# =============================================================================
# DEPENDÊNCIA: Service Financeiro
# =============================================================================
# Injeção de dependência para obter service configurado com DB session

def get_financeiro_service(db: Session = Depends(get_db)) -> FinanceiroService:
    """
    Factory para criar instância do FinanceiroService.
    
    FastAPI injeta automaticamente a sessão do banco de dados.
    """
    return FinanceiroService(db)


# =============================================================================
# ENDPOINTS: LANÇAMENTOS FINANCEIROS (FinanceEntry)
# =============================================================================

@router.get(
    "/entries",
    response_model=FinanceEntryListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar lançamentos financeiros",
    description="""
    Lista lançamentos financeiros com filtros, ordenação e paginação.
    
    Filtros disponíveis:
    - Busca textual na descrição
    - Tipo (receita/despesa)
    - Status de pagamento (pago/pendente)
    - Período (YYYY-MM ou range de datas)
    - Categoria
    
    Ordenação:
    - due_date, value, description, created_at
    - Ascendente ou descendente
    """,
    response_description="Lista paginada de lançamentos financeiros"
)
async def list_finance_entries(
    # Filtros via query parameters
    search: Optional[str] = Query(None, description="Busca textual na descrição"),
    entry_type: Optional[Literal["receita", "despesa"]] = Query(None, description="Tipo: receita ou despesa"),
    paid: Optional[bool] = Query(None, description="Status: True=pago, False=pendente"),
    category: Optional[str] = Query(None, description="Categoria específica"),
    period: Optional[str] = Query(None, description="Período YYYY-MM (ex: 2024-04)"),
    start_date: Optional[str] = Query(None, description="Data inicial YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Data final YYYY-MM-DD"),
    
    # Ordenação
    sort_by: Optional[str] = Query("due_date", description="Campo de ordenação"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("desc", description="Direção"),
    
    # Paginação
    page: int = Query(1, ge=1, description="Número da página"),
    limit: int = Query(20, ge=1, le=100, description="Itens por página"),
    
    # Service injetado
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """
    Lista lançamentos financeiros com filtros avançados.
    
    Este endpoint substitui os filtros complexos que existiam no frontend,
    movendo toda a lógica de filtragem e paginação para o backend.
    """
    # Montar objeto de filtros
    filters = FinanceEntryFilter(
        search=search,
        entry_type=entry_type,
        paid=paid,
        category=category,
        period=period,
        start_date=start_date,
        end_date=end_date,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    
    # Buscar dados
    entries, total = service.list_finance_entries(filters)
    
    # Calcular paginação
    pages = (total + limit - 1) // limit  # Ceiling division
    
    # Retornar resposta paginada
    return FinanceEntryListResponse(
        items=[FinanceEntryResponse.model_validate(e) for e in entries],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1,
    )


@router.get(
    "/revenues",
    response_model=FinanceEntryListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar receitas",
    description="""
    Lista apenas receitas (entry_type=receita) com filtros e paginação.
    
    Endpoint específico para visualização de receitas separadamente.
    """,
    response_description="Lista paginada de receitas"
)
async def list_revenues(
    search: Optional[str] = Query(None, description="Busca textual na descrição"),
    paid: Optional[bool] = Query(None, description="Status: True=pago, False=pendente"),
    category: Optional[str] = Query(None, description="Categoria específica"),
    period: Optional[str] = Query(None, description="Período YYYY-MM (ex: 2024-04)"),
    sort_by: Optional[str] = Query("due_date", description="Campo de ordenação"),
    sort_order: Optional[Literal["asc", "desc"]] = Query("desc", description="Direção"),
    page: int = Query(1, ge=1, description="Número da página"),
    limit: int = Query(20, ge=1, le=100, description="Itens por página"),
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Lista apenas receitas (entry_type=receita)."""
    filters = FinanceEntryFilter(
        search=search,
        entry_type="receita",
        paid=paid,
        category=category,
        period=period,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit,
    )
    entries, total = service.list_finance_entries(filters)
    pages = (total + limit - 1) // limit
    return FinanceEntryListResponse(
        items=[FinanceEntryResponse.model_validate(e) for e in entries],
        total=total,
        page=page,
        limit=limit,
        pages=pages,
        has_next=page < pages,
        has_prev=page > 1,
    )


@router.post(
    "/entries",
    response_model=FinanceEntryResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar lançamento financeiro",
    description="Cria um novo lançamento financeiro (receita ou despesa).",
    response_description="Lançamento criado com sucesso"
)
async def create_finance_entry(
    data: FinanceEntryCreate,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """
    Cria um novo lançamento financeiro.
    
    O ID é gerado automaticamente pelo sistema (formato: FIN-YYYY-XXXXXX).
    """
    entry = service.create_finance_entry(data)
    return FinanceEntryResponse.model_validate(entry)


@router.get(
    "/entries/{entry_id}",
    response_model=FinanceEntryResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter lançamento por ID",
    description="Retorna detalhes de um lançamento específico.",
    responses={
        404: {"description": "Lançamento não encontrado"}
    }
)
async def get_finance_entry(
    entry_id: str,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Busca um lançamento pelo ID."""
    entry = service.get_finance_entry_by_id(entry_id)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lançamento {entry_id} não encontrado"
        )
    return FinanceEntryResponse.model_validate(entry)


@router.patch(
    "/entries/{entry_id}",
    response_model=FinanceEntryResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar lançamento",
    description="Atualiza parcialmente um lançamento existente (PATCH).",
    responses={
        404: {"description": "Lançamento não encontrado"}
    }
)
async def update_finance_entry(
    entry_id: str,
    data: FinanceEntryUpdate,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """
    Atualiza um lançamento existente.
    
    Apenas os campos fornecidos serão atualizados (operação parcial).
    """
    entry = service.update_finance_entry(entry_id, data)
    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lançamento {entry_id} não encontrado"
        )
    return FinanceEntryResponse.model_validate(entry)


@router.delete(
    "/entries/{entry_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar lançamento",
    description="Remove permanentemente um lançamento financeiro.",
    responses={
        404: {"description": "Lançamento não encontrado"}
    }
)
async def delete_finance_entry(
    entry_id: str,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Remove um lançamento financeiro."""
    deleted = service.delete_finance_entry(entry_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Lançamento {entry_id} não encontrado"
        )
    return None  # 204 No Content


# =============================================================================
# ENDPOINTS: DESPESAS FIXAS (FixedExpense)
# =============================================================================

@router.get(
    "/fixed-expenses",
    response_model=List[FixedExpenseResponse],
    status_code=status.HTTP_200_OK,
    summary="Listar despesas fixas",
    description="Lista todas as despesas fixas mensais cadastradas."
)
async def list_fixed_expenses(
    active_only: bool = Query(False, description="Apenas despesas ativas"),
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Lista despesas fixas."""
    expenses = service.list_fixed_expenses(active_only=active_only)
    return [FixedExpenseResponse.model_validate(e) for e in expenses]


@router.post(
    "/fixed-expenses",
    response_model=FixedExpenseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar despesa fixa",
    description="Cadastra uma nova despesa fixa mensal recorrente."
)
async def create_fixed_expense(
    data: FixedExpenseCreate,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Cria uma despesa fixa."""
    expense = service.create_fixed_expense(data)
    return FixedExpenseResponse.model_validate(expense)


# =============================================================================
# ENDPOINTS: CONTAS A PAGAR (ContaPagar)
# =============================================================================

@router.get(
    "/contas-pagar",
    response_model=List[ContaPagarResponse],
    status_code=status.HTTP_200_OK,
    summary="Listar contas a pagar",
    description="Lista contas a pagar com filtros por mês e status."
)
async def list_contas_pagar(
    month: Optional[str] = Query(None, description="Mês YYYY-MM"),
    paid: Optional[bool] = Query(None, description="Status de pagamento"),
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Lista contas a pagar."""
    contas = service.list_contas_pagar(month=month, paid=paid)
    return [ContaPagarResponse.model_validate(c) for c in contas]


@router.post(
    "/contas-pagar",
    response_model=ContaPagarResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar conta a pagar",
    description="Cria uma conta a pagar (manual ou vinculada a despesa fixa)."
)
async def create_conta_pagar(
    data: ContaPagarCreate,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Cria uma conta a pagar."""
    conta = service.create_conta_pagar(data)
    return ContaPagarResponse.model_validate(conta)


# =============================================================================
# ENDPOINTS: RELATÓRIOS E DASHBOARD
# =============================================================================

@router.get(
    "/summary",
    response_model=FinanceSummaryResponse,
    status_code=status.HTTP_200_OK,
    summary="Resumo financeiro do período",
    description="""
    Calcula resumo financeiro completo do período selecionado.
    
    Inclui:
    - Receitas e despesas totais
    - Lucro líquido e margem
    - Valores pagos/pendentes
    - Impostos
    - Projeções
    
    Este endpoint substitui o calculatePeriodFinanceSummary do frontend.
    """,
    response_description="Resumo financeiro completo"
)
async def get_finance_summary(
    period: str = Query(
        ...,  # Required
        pattern=r"^(\d{4}-\d{2}|all)$",
        description="Período YYYY-MM ou 'all' para todos",
        examples=["2024-04", "2024-12", "all"]
    ),
    initial_balance: Optional[float] = Query(
        None,
        description="Saldo inicial (usa padrão se não informado)"
    ),
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """
    Retorna resumo financeiro do período.
    
    Este é o endpoint principal para o dashboard financeiro,
    fornecendo todos os KPIs necessários.
    """
    summary = service.calculate_period_summary(
        selected_period=period,
        initial_balance=initial_balance
    )
    return summary


@router.get(
    "/categories",
    response_model=List[str],
    status_code=status.HTTP_200_OK,
    summary="Listar categorias",
    description="Retorna lista de categorias únicas usadas nos lançamentos."
)
async def get_categories(
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Lista categorias disponíveis para filtros."""
    return service.get_categories()


@router.get(
    "/periods",
    response_model=List[str],
    status_code=status.HTTP_200_OK,
    summary="Listar períodos disponíveis",
    description="Retorna lista de períodos (YYYY-MM) que possuem dados."
)
async def get_available_periods(
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Lista períodos disponíveis para seleção."""
    return service.get_available_periods()


# =============================================================================
# ENDPOINTS: EXTERNAL REVENUES (Receitas Externas)
# =============================================================================

from app.schemas.financeiro import (
    ExternalRevenueCreate,
    ExternalRevenueUpdate,
    ExternalRevenueResponse,
    ExternalRevenueListResponse,
)


@router.get(
    "/external-revenues",
    response_model=ExternalRevenueListResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar receitas externas",
    description="Lista receitas de fontes externas (Aluguel, Rendimento, etc).",
)
async def list_external_revenues(
    source: Optional[str] = Query(None, description="Filtrar por origem"),
    payment_status: Optional[str] = Query(None, description="Filtrar por status: paid/pending/overdue"),
    period: Optional[str] = Query(None, description="Filtrar por período YYYY-MM"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Lista receitas externas com filtros."""
    result = service.list_external_revenues(
        source=source,
        payment_status=payment_status,
        period=period,
        page=page,
        limit=limit
    )
    return ExternalRevenueListResponse(
        items=[ExternalRevenueResponse.model_validate(r) for r in result["items"]],
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        pages=result["pages"],
        has_next=result["has_next"],
        has_prev=result["has_prev"],
    )


@router.post(
    "/external-revenues",
    response_model=ExternalRevenueResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar receita externa",
    description="Cria nova receita de fonte externa.",
)
async def create_external_revenue(
    data: ExternalRevenueCreate,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Cria nova receita externa."""
    revenue = service.create_external_revenue(data)
    return ExternalRevenueResponse.model_validate(revenue)


@router.get(
    "/external-revenues/{revenue_id}",
    response_model=ExternalRevenueResponse,
    status_code=status.HTTP_200_OK,
    summary="Obter receita externa",
    description="Retorna detalhes de uma receita externa.",
)
async def get_external_revenue(
    revenue_id: str,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Busca receita externa por ID."""
    revenue = service.get_external_revenue_by_id(revenue_id)
    if not revenue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receita {revenue_id} não encontrada"
        )
    return ExternalRevenueResponse.model_validate(revenue)


@router.patch(
    "/external-revenues/{revenue_id}",
    response_model=ExternalRevenueResponse,
    status_code=status.HTTP_200_OK,
    summary="Atualizar receita externa",
    description="Atualiza dados de uma receita externa.",
)
async def update_external_revenue(
    revenue_id: str,
    data: ExternalRevenueUpdate,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Atualiza receita externa."""
    revenue = service.update_external_revenue(revenue_id, data)
    if not revenue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receita {revenue_id} não encontrada"
        )
    return ExternalRevenueResponse.model_validate(revenue)


@router.delete(
    "/external-revenues/{revenue_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar receita externa",
    description="Remove permanentemente uma receita externa.",
)
async def delete_external_revenue(
    revenue_id: str,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Remove receita externa."""
    deleted = service.delete_external_revenue(revenue_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receita {revenue_id} não encontrada"
        )
    return None


@router.post(
    "/external-revenues/{revenue_id}/mark-paid",
    response_model=ExternalRevenueResponse,
    status_code=status.HTTP_200_OK,
    summary="Marcar como pago",
    description="Marca receita externa como paga.",
)
async def mark_external_revenue_paid(
    revenue_id: str,
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Marca receita como paga."""
    revenue = service.mark_external_revenue_paid(revenue_id)
    if not revenue:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Receita {revenue_id} não encontrada"
        )
    return ExternalRevenueResponse.model_validate(revenue)


@router.get(
    "/closings",
    response_model=List[dict],
    status_code=status.HTTP_200_OK,
    summary="Histórico de fechamentos mensais",
    description="Retorna histórico de fechamentos por mês baseado nos dados reais.",
)
async def get_monthly_closings(
    service: FinanceiroService = Depends(get_financeiro_service)
):
    """Retorna histórico de fechamentos mensais calculado dos dados reais."""
    periods = service.get_available_periods()
    closings = []
    
    for period in periods:
        summary = service.calculate_period_summary(selected_period=period)
        closings.append({
            "month": period,
            "revenue": summary.total_revenue,
            "expenses": summary.total_expenses,
            "taxes": summary.total_taxes,
            "netProfit": summary.profit,
            "isOpen": False
        })
    
    return closings
