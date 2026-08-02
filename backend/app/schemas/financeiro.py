# =============================================================================
# SCHEMAS FINANCEIROS - Validação Pydantic
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: financeiro.py
# RESPONSABILIDADE: Definir estrutura de dados para API financeira
#
# PRINCÍPIOS:
# - Validação automática de tipos e regras de negócio
# - Documentação automática OpenAPI (Swagger)
# - Separação clara: Base/Create/Update/Response
# - Suporte a campos opcionais em updates (PATCH)
#
# =============================================================================

from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator, ConfigDict


# =============================================================================
# ENUMS E TIPOS PERSONALIZADOS
# =============================================================================

FinanceEntryType = Literal["receita", "despesa"]
MarginHealthType = Literal["excellent", "attention", "risk"]


# =============================================================================
# SCHEMAS FINANCE ENTRY (Receitas e Despesas)
# =============================================================================

class FinanceEntryBase(BaseModel):
    """
    Campos base para lançamentos financeiros.
    
    Usado como base para Create, Update e Response schemas.
    """
    model_config = ConfigDict(from_attributes=True)
    
    description: str = Field(
        ...,  # ... = required
        min_length=3,
        max_length=255,
        description="Descrição do lançamento (ex: 'Venda Cliente XYZ')",
        examples=["Venda Produto ABC", "Pagamento Fornecedor XYZ Ltda"]
    )
    
    entry_type: FinanceEntryType = Field(
        ...,
        description="Tipo do lançamento: 'receita' (entrada) ou 'despesa' (saída)",
        examples=["receita", "despesa"]
    )
    
    value: float = Field(
        ...,
        gt=0,  # Greater than 0
        description="Valor monetário em Reais (R$), deve ser positivo",
        examples=[1500.00, 250.50, 10000.00]
    )
    
    due_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",  # YYYY-MM-DD
        description="Data de vencimento no formato ISO (YYYY-MM-DD)",
        examples=["2024-04-15", "2024-12-31"]
    )
    
    paid: bool = Field(
        default=False,
        description="Status de pagamento: True=quitado, False=pendente"
    )
    
    paid_at: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data do pagamento efetivo (null se pendente)",
        examples=["2024-04-10", None]
    )
    
    category: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Categoria para relatórios (ex: 'Vendas', 'Fornecedores')",
        examples=["Vendas", "Operacional", "Impostos"]
    )
    
    @field_validator('entry_type')
    @classmethod
    def validate_entry_type(cls, v: str) -> str:
        """Normaliza tipo para lowercase."""
        return v.lower()
    
    @field_validator('paid_at')
    @classmethod
    def validate_paid_at(cls, v: Optional[str], info) -> Optional[str]:
        """Valida que paid_at só existe se paid=True."""
        paid = info.data.get('paid')
        if v and not paid:
            raise ValueError("Não pode ter data de pagamento se paid=False")
        return v


class FinanceEntryCreate(FinanceEntryBase):
    """
    Schema para criação de novo lançamento financeiro.
    
    Todos os campos obrigatórios devem ser fornecidos.
    ID é gerado automaticamente pelo backend.
    """
    pass


class FinanceEntryUpdate(BaseModel):
    """
    Schema para atualização parcial de lançamento.
    
    Todos os campos são opcionais (PATCH), permitindo
    atualizações parciais do registro.
    """
    model_config = ConfigDict(from_attributes=True)
    
    description: Optional[str] = Field(
        default=None,
        min_length=3,
        max_length=255,
        description="Descrição do lançamento"
    )
    
    value: Optional[float] = Field(
        default=None,
        gt=0,
        description="Valor monetário em R$"
    )
    
    due_date: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data de vencimento (YYYY-MM-DD)"
    )
    
    paid: Optional[bool] = Field(
        default=None,
        description="Status de pagamento"
    )
    
    paid_at: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data do pagamento efetivo"
    )
    
    category: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Categoria"
    )


class FinanceEntryResponse(FinanceEntryBase):
    """
    Schema de resposta da API para lançamentos.
    
    Inclui campos gerados pelo sistema: ID e timestamps.
    """
    id: str = Field(
        ...,
        description="Identificador único do lançamento",
        examples=["FIN-2024-001234"]
    )
    
    created_at: datetime = Field(
        ...,
        description="Data/hora de criação do registro"
    )
    
    updated_at: datetime = Field(
        ...,
        description="Data/hora da última atualização"
    )


class FinanceEntryFilter(BaseModel):
    """
    Parâmetros de filtro para busca de lançamentos.
    
    Usado em query parameters dos endpoints de listagem.
    """
    model_config = ConfigDict(from_attributes=True)
    
    search: Optional[str] = Field(
        default=None,
        description="Busca textual na descrição",
        examples=["Cliente XYZ"]
    )
    
    entry_type: Optional[FinanceEntryType] = Field(
        default=None,
        description="Filtrar por tipo: receita ou despesa"
    )
    
    start_date: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data inicial do período (YYYY-MM-DD)"
    )
    
    end_date: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data final do período (YYYY-MM-DD)"
    )
    
    paid: Optional[bool] = Field(
        default=None,
        description="Filtrar por status: True=pago, False=pendente, null=todos"
    )
    
    category: Optional[str] = Field(
        default=None,
        description="Filtrar por categoria específica"
    )
    
    period: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}$",
        description="Período específico (YYYY-MM, ex: 2024-04)"
    )
    
    sort_by: Optional[str] = Field(
        default="due_date",
        description="Campo para ordenação",
        examples=["due_date", "value", "description", "created_at"]
    )
    
    sort_order: Optional[Literal["asc", "desc"]] = Field(
        default="desc",
        description="Direção da ordenação: asc=ascendente, desc=descendente"
    )
    
    page: Optional[int] = Field(
        default=1,
        ge=1,
        description="Número da página (começa em 1)"
    )
    
    limit: Optional[int] = Field(
        default=20,
        ge=1,
        le=100,
        description="Quantidade de itens por página (máx: 100)"
    )


# =============================================================================
# SCHEMAS FIXED EXPENSE (Despesas Fixas)
# =============================================================================

class FixedExpenseBase(BaseModel):
    """Campos base para despesas fixas mensais."""
    model_config = ConfigDict(from_attributes=True)
    
    name: str = Field(
        ...,
        min_length=2,
        max_length=150,
        description="Nome da despesa (ex: 'Aluguel Matriz')",
        examples=["Aluguel Escritório", "Internet Fibra", "Salário Designer"]
    )
    
    category: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Categoria: 'Fixas', 'Pessoal', 'Operacional', 'Impostos'",
        examples=["Fixas", "Pessoal", "Operacional"]
    )
    
    estimated_value: float = Field(
        ...,
        gt=0,
        description="Valor estimado mensal em R$",
        examples=[2500.00, 150.00, 5000.00]
    )
    
    due_day: int = Field(
        ...,
        ge=1,
        le=31,
        description="Dia do vencimento (1-31)",
        examples=[5, 10, 15, 20]
    )
    
    active: bool = Field(
        default=True,
        description="Ativa=True gera contas automaticamente todo mês"
    )


class FixedExpenseCreate(FixedExpenseBase):
    """Schema para criação de nova despesa fixa."""
    pass


class FixedExpenseUpdate(BaseModel):
    """Schema para atualização parcial de despesa fixa."""
    model_config = ConfigDict(from_attributes=True)
    
    name: Optional[str] = Field(default=None, min_length=2, max_length=150)
    category: Optional[str] = Field(default=None, max_length=100)
    estimated_value: Optional[float] = Field(default=None, gt=0)
    due_day: Optional[int] = Field(default=None, ge=1, le=31)
    active: Optional[bool] = Field(default=None)


class FixedExpenseResponse(FixedExpenseBase):
    """Schema de resposta para despesas fixas."""
    id: str = Field(..., description="Identificador único")
    created_at: datetime = Field(..., description="Data de cadastro")


# =============================================================================
# SCHEMAS CONTA PAGAR (Contas a Pagar)
# =============================================================================

class ContaPagarBase(BaseModel):
    """Campos base para contas a pagar."""
    model_config = ConfigDict(from_attributes=True)
    
    description: str = Field(
        ...,
        max_length=255,
        description="Descrição da conta (ex: 'Aluguel Abril/2024')"
    )
    
    category: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Categoria para agrupamento"
    )
    
    value: float = Field(
        ...,
        gt=0,
        description="Valor desta conta específica"
    )
    
    due_date: str = Field(
        ...,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data de vencimento (YYYY-MM-DD)"
    )
    
    paid: bool = Field(
        default=False,
        description="True=quitada, False=pendente"
    )
    
    paid_at: Optional[str] = Field(
        default=None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data do pagamento efetivo"
    )
    
    is_fixed: bool = Field(
        default=False,
        description="True=gerada de despesa fixa, False=conta avulsa"
    )


class ContaPagarCreate(ContaPagarBase):
    """Schema para criação de nova conta a pagar."""
    fixed_expense_id: Optional[str] = Field(
        default=None,
        description="Referência à despesa fixa (null se conta avulsa)"
    )


class ContaPagarUpdate(BaseModel):
    """Schema para atualização de conta a pagar."""
    model_config = ConfigDict(from_attributes=True)
    
    description: Optional[str] = Field(default=None, max_length=255)
    value: Optional[float] = Field(default=None, gt=0)
    due_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    paid: Optional[bool] = Field(default=None)
    paid_at: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")


class ContaPagarResponse(ContaPagarBase):
    """Schema de resposta para contas a pagar."""
    id: str = Field(..., description="Identificador único")
    fixed_expense_id: Optional[str] = Field(None, description="Referência à despesa fixa")
    month: str = Field(..., description="Mês de referência (YYYY-MM)")
    created_at: datetime = Field(..., description="Data de criação")


# =============================================================================
# SCHEMAS RELATÓRIOS E DASHBOARD
# =============================================================================

class PeriodFilter(BaseModel):
    """Filtro de período para relatórios."""
    model_config = ConfigDict(from_attributes=True)
    
    period: Optional[str] = Field(
        default=None,
        pattern=r"^(\d{4}-\d{2}|all)$",
        description="Período YYYY-MM ou 'all' para todos",
        examples=["2024-04", "2024-12", "all"]
    )


class MonthlyHistoryResponse(BaseModel):
    """Schema para histórico mensal consolidado."""
    model_config = ConfigDict(from_attributes=True)
    
    id: str
    month: str = Field(..., description="Mês de referência (YYYY-MM)")
    total_revenue: float = Field(..., description="Receita total do mês")
    total_expenses: float = Field(..., description="Despesa total do mês")
    profit: float = Field(..., description="Lucro líquido")
    margin_percent: float = Field(..., description="Margem de lucro (%)")
    margin_health: MarginHealthType = Field(..., description="Classificação da margem")
    total_received: float = Field(..., description="Valor efetivamente recebido")
    total_paid: float = Field(..., description="Valor efetivamente pago")
    unpaid_revenue: float = Field(..., description="Valor a receber pendente")
    unpaid_expenses: float = Field(..., description="Valor a pagar pendente")
    total_taxes: float = Field(..., description="Total de impostos pagos")
    projected_balance: float = Field(..., description="Saldo projetado")
    is_prediction: bool = Field(..., description="True=projeção, False=real")
    created_at: datetime


class FinanceSummaryResponse(BaseModel):
    """
    Schema para resumo financeiro consolidado (igual ao frontend).
    
    Replica a estrutura do FinanceSummary do TypeScript para
    compatibilidade total com o frontend existente.
    """
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    # Totais
    totalRevenue: float = Field(..., alias="total_revenue", description="Receita total")
    totalExpenses: float = Field(..., alias="total_expenses", description="Despesas totais")
    profit: float = Field(..., description="Lucro líquido")
    
    # Fluxo de caixa
    totalReceived: float = Field(..., alias="total_received", description="Total recebido")
    totalPaid: float = Field(..., alias="total_paid", description="Total pago")
    unpaidRevenue: float = Field(..., alias="unpaid_revenue", description="A receber")
    unpaidExpenses: float = Field(..., alias="unpaid_expenses", description="A pagar")
    
    # Impostos e taxas (Brasil)
    totalTaxes: float = Field(..., alias="total_taxes", description="Total de impostos")
    
    # Detalhamento de impostos brasileiros
    totalIcms: float = Field(0.0, alias="total_icms", description="Total ICMS (12%)")
    totalIpi: float = Field(0.0, alias="total_ipi", description="Total IPI (10%)")
    totalPis: float = Field(0.0, alias="total_pis", description="Total PIS (1.65%)")
    totalCofins: float = Field(0.0, alias="total_cofins", description="Total COFINS (7.6%)")
    totalIcmsCredit: float = Field(0.0, alias="total_icms_credit", description="Crédito ICMS gerado")
    
    # Projeções
    projectedBalance: float = Field(..., alias="projected_balance", description="Saldo projetado")
    
    # Margem
    marginPercent: float = Field(..., alias="margin_percent", description="Margem (%)")
    marginHealth: MarginHealthType = Field(..., alias="margin_health", description="Saúde: excellent/attention/risk")
    
    # Dados adicionais para o período
    period: Optional[str] = Field(None, description="Período analisado")
    initialBalance: Optional[float] = Field(None, alias="initial_balance", description="Saldo inicial")
    cpUnpaid: float = Field(0.0, alias="cp_unpaid", description="Contas a pagar em aberto")
    totalOpenPayables: float = Field(0.0, alias="total_open_payables", description="Total a pagar (incluindo CP)")


class PaginatedResponse(BaseModel):
    """Schema base para respostas paginadas."""
    model_config = ConfigDict(from_attributes=True)
    
    items: List
    total: int = Field(..., description="Total de registros")
    page: int = Field(..., description="Página atual")
    limit: int = Field(..., description="Itens por página")
    pages: int = Field(..., description="Total de páginas")
    has_next: bool = Field(..., description="Tem próxima página")
    has_prev: bool = Field(..., description="Tem página anterior")


# Schemas específicos paginados
class FinanceEntryListResponse(PaginatedResponse):
    """Resposta paginada de lançamentos financeiros."""
    items: List[FinanceEntryResponse]


class ContaPagarListResponse(PaginatedResponse):
    """Resposta paginada de contas a pagar."""
    items: List[ContaPagarResponse]


# =============================================================================
# SCHEMAS EXTERNAL REVENUE (Receitas Externas)
# =============================================================================

PaymentMethodType = Literal["boleto", "pix", "transferencia", "dinheiro", "cheque", "cartao"]
PaymentStatusType = Literal["paid", "pending", "overdue"]
RevenueSourceType = Literal["Aluguel", "Rendimento", "Reembolso", "Outro"]


class ExternalRevenueBase(BaseModel):
    """Campos base para receitas externas."""
    model_config = ConfigDict(from_attributes=True)
    
    source: RevenueSourceType = Field(
        ...,
        description="Origem da receita"
    )
    
    description: str = Field(
        ...,
        min_length=3,
        max_length=300,
        description="Descrição detalhada"
    )
    
    value: float = Field(
        ...,
        gt=0,
        description="Valor em R$"
    )
    
    payment_method: Optional[PaymentMethodType] = Field(
        None,
        description="Forma de pagamento"
    )
    
    due_date: Optional[str] = Field(
        None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data de vencimento (YYYY-MM-DD)"
    )
    
    expected_date: Optional[str] = Field(
        None,
        pattern=r"^\d{4}-\d{2}-\d{2}$",
        description="Data prevista de recebimento (YYYY-MM-DD)"
    )
    
    notes: Optional[str] = Field(
        None,
        max_length=1000,
        description="Observações adicionais"
    )


class ExternalRevenueCreate(ExternalRevenueBase):
    """Schema para criar nova receita externa."""
    pass


class ExternalRevenueUpdate(BaseModel):
    """Schema para atualizar receita externa (PATCH - todos opcionais)."""
    model_config = ConfigDict(from_attributes=True)
    
    source: Optional[RevenueSourceType] = None
    description: Optional[str] = Field(None, min_length=3, max_length=300)
    value: Optional[float] = Field(None, gt=0)
    payment_method: Optional[PaymentMethodType] = None
    payment_status: Optional[PaymentStatusType] = None
    due_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    expected_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: Optional[str] = Field(None, max_length=1000)


class ExternalRevenueResponse(ExternalRevenueBase):
    """Schema de resposta completa para receita externa."""
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    
    id: str = Field(..., description="Identificador único (REV-EXT-YYYY-XXXXXX)")
    payment_status: PaymentStatusType = Field(..., description="Status do pagamento")
    paid_at: Optional[str] = Field(None, description="Data/hora do pagamento")
    created_at: str = Field(..., description="Data de criação")
    updated_at: str = Field(..., description="Última atualização")


class ExternalRevenueListResponse(PaginatedResponse):
    """Resposta paginada de receitas externas."""
    items: List[ExternalRevenueResponse]
