# =============================================================================
# PACOTE SCHEMAS - Validação e Serialização de Dados
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# Schemas Pydantic definem a estrutura dos dados que entram e saem da API.
# Garantem validação automática, serialização e documentação OpenAPI.
#
# ESTRUTURA:
# - Base: Campos comuns a todos os schemas
# - Create: Dados necessários para criar um registro
# - Update: Dados permitidos em atualizações (parciais)
# - Response: Dados retornados pela API (inclui IDs e timestamps)
# - Filter: Parâmetros de busca/filtro
#
# =============================================================================

from app.schemas.financeiro import (
    # FinanceEntry
    FinanceEntryBase,
    FinanceEntryCreate,
    FinanceEntryUpdate,
    FinanceEntryResponse,
    FinanceEntryFilter,
    
    # FixedExpense
    FixedExpenseBase,
    FixedExpenseCreate,
    FixedExpenseUpdate,
    FixedExpenseResponse,
    
    # ContaPagar
    ContaPagarBase,
    ContaPagarCreate,
    ContaPagarUpdate,
    ContaPagarResponse,
    
    # MonthlyHistory
    MonthlyHistoryResponse,
    FinanceSummaryResponse,
    PeriodFilter,
)

from app.schemas.order import (
    # Order
    OrderCreate,
    OrderUpdate,
    OrderResponse,
    OrderListResponse,
    OrderStatisticsResponse,
    # Order Item
    OrderItemCreate,
    OrderItemUpdate,
    OrderItemResponse,
)

from app.schemas.customer import (
    # Customer
    CustomerCreate,
    CustomerUpdate,
    CustomerResponse,
    CustomerListResponse,
    CustomerStatisticsResponse,
)

__all__ = [
    # FinanceEntry
    "FinanceEntryBase",
    "FinanceEntryCreate",
    "FinanceEntryUpdate",
    "FinanceEntryResponse",
    "FinanceEntryFilter",
    
    # FixedExpense
    "FixedExpenseBase",
    "FixedExpenseCreate",
    "FixedExpenseUpdate",
    "FixedExpenseResponse",
    
    # ContaPagar
    "ContaPagarBase",
    "ContaPagarCreate",
    "ContaPagarUpdate",
    "ContaPagarResponse",
    
    # Relatórios
    "MonthlyHistoryResponse",
    "FinanceSummaryResponse",
    "PeriodFilter",
    
    # Order
    "OrderCreate",
    "OrderUpdate",
    "OrderResponse",
    "OrderListResponse",
    "OrderStatisticsResponse",
    "OrderItemCreate",
    "OrderItemUpdate",
    "OrderItemResponse",
    
    # Customer
    "CustomerCreate",
    "CustomerUpdate",
    "CustomerResponse",
    "CustomerListResponse",
    "CustomerStatisticsResponse",
]
