# =============================================================================
# SERVICE FINANCEIRO - Lógica de Negócio Financeira
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: financeiro_service.py
# RESPONSABILIDADE: Implementar todas as operações financeiras do sistema
#
# MIGRAÇÃO: Este arquivo substitui a lógica do financeUtils.ts (frontend)
#           movendo todo processamento para o backend Python.
#
# FUNCIONALIDADES:
# - CRUD de lançamentos financeiros (receitas/despesas)
# - CRUD de despesas fixas e contas a pagar
# - Cálculos financeiros complexos (margens, projeções)
# - Geração de relatórios e histórico mensal
# - Agregações e filtros de dados
#
# =============================================================================

from typing import List, Optional, Tuple, Dict, Any, Literal
from datetime import datetime
from decimal import Decimal
import logging

from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc

# Models (entidades do banco de dados)
from app.models import (
    FinanceEntry,
    FixedExpense,
    ContaPagar,
    MonthlyHistory,
    Order,
    ExternalRevenue,
)

# Schemas (validação e serialização)
from app.schemas.financeiro import (
    FinanceEntryCreate,
    FinanceEntryUpdate,
    FinanceEntryFilter,
    FixedExpenseCreate,
    FixedExpenseUpdate,
    ContaPagarCreate,
    ContaPagarUpdate,
    FinanceSummaryResponse,
)

# Configurações
from app.core.config import settings

# Logger para este módulo
logger = logging.getLogger(__name__)


# =============================================================================
# TIPOS PERSONALIZADOS
# =============================================================================

MarginHealth = Literal["excellent", "attention", "risk"]


# =============================================================================
# CLASSE PRINCIPAL: FINANCEIRO SERVICE
# =============================================================================

class FinanceiroService:
    """
    Service para operações financeiras.
    
    Esta classe encapsula toda a lógica de negócio do módulo financeiro,
    incluindo cálculos complexos, agregações e geração de relatórios.
    
    Design Pattern: Service Layer
    - Separa lógica de negócio da camada de API
    - Facilita testes unitários
    - Permite reutilização entre diferentes interfaces
    
    Attributes:
        db: Sessão SQLAlchemy para operações no banco
    """
    
    def __init__(self, db: Session):
        """
        Inicializa o service com uma sessão de banco.
        
        Args:
            db: Sessão SQLAlchemy ativa
        """
        self.db = db
    
    # =====================================================================
    # OPERAÇÕES: FINANCE ENTRY (Receitas e Despesas)
    # =====================================================================
    
    def create_finance_entry(self, data: FinanceEntryCreate) -> FinanceEntry:
        """
        Cria um novo lançamento financeiro.
        
        Args:
            data: Dados validados do lançamento
            
        Returns:
            FinanceEntry: Registro criado no banco
        """
        # Gerar ID único (formato: FIN-YYYY-XXXXXX)
        entry_id = f"FIN-{datetime.now().year}-{datetime.now().strftime('%m%d%H%M%S')}"
        
        db_entry = FinanceEntry(
            id=entry_id,
            description=data.description,
            entry_type=data.entry_type,
            value=data.value,
            due_date=data.due_date,
            paid=data.paid,
            paid_at=data.paid_at,
            category=data.category,
        )
        
        self.db.add(db_entry)
        self.db.commit()
        self.db.refresh(db_entry)
        
        logger.info(f"Lançamento criado: {entry_id} - {data.description}")
        return db_entry
    
    def get_finance_entry_by_id(self, entry_id: str) -> Optional[FinanceEntry]:
        """
        Busca um lançamento pelo ID.
        
        Args:
            entry_id: Identificador do lançamento
            
        Returns:
            FinanceEntry ou None se não encontrado
        """
        return self.db.query(FinanceEntry).filter(FinanceEntry.id == entry_id).first()
    
    def list_finance_entries(
        self, 
        filters: FinanceEntryFilter
    ) -> Tuple[List[FinanceEntry], int]:
        """
        Lista lançamentos financeiros com filtros e paginação.
        
        Esta é a implementação backend dos filtros que antes eram
        feitos no frontend via useMemo/useCallback.
        
        Args:
            filters: Parâmetros de filtro, ordenação e paginação
            
        Returns:
            Tuple: (lista de registros, total de registros)
        """
        # Query base
        query = self.db.query(FinanceEntry)
        
        # Aplicar filtros
        if filters.search:
            # Busca textual na descrição (case-insensitive)
            search_pattern = f"%{filters.search}%"
            query = query.filter(FinanceEntry.description.ilike(search_pattern))
        
        if filters.entry_type:
            query = query.filter(FinanceEntry.entry_type == filters.entry_type)
        
        if filters.paid is not None:
            query = query.filter(FinanceEntry.paid == filters.paid)
        
        if filters.category:
            query = query.filter(FinanceEntry.category == filters.category)
        
        # Filtro por período específico (YYYY-MM)
        if filters.period:
            query = query.filter(FinanceEntry.due_date.like(f"{filters.period}%"))
        
        # Filtro por range de datas
        if filters.start_date:
            query = query.filter(FinanceEntry.due_date >= filters.start_date)
        if filters.end_date:
            query = query.filter(FinanceEntry.due_date <= filters.end_date)
        
        # Contar total antes da paginação
        total = query.count()
        
        # Aplicar ordenação
        sort_column = getattr(FinanceEntry, filters.sort_by or "due_date")
        if filters.sort_order == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))
        
        # Aplicar paginação
        offset = (filters.page - 1) * filters.limit
        entries = query.offset(offset).limit(filters.limit).all()
        
        return entries, total
    
    def update_finance_entry(
        self, 
        entry_id: str, 
        data: FinanceEntryUpdate
    ) -> Optional[FinanceEntry]:
        """
        Atualiza um lançamento existente (PATCH - campos opcionais).
        
        Args:
            entry_id: ID do lançamento
            data: Campos a atualizar (todos opcionais)
            
        Returns:
            FinanceEntry atualizado ou None
        """
        db_entry = self.get_finance_entry_by_id(entry_id)
        if not db_entry:
            return None
        
        # Atualizar apenas campos fornecidos (parcial)
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_entry, field, value)
        
        # Atualizar timestamp
        db_entry.updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(db_entry)
        
        logger.info(f"Lançamento atualizado: {entry_id}")
        return db_entry
    
    def delete_finance_entry(self, entry_id: str) -> bool:
        """
        Remove um lançamento financeiro.
        
        Args:
            entry_id: ID do lançamento
            
        Returns:
            bool: True se deletado, False se não encontrado
        """
        db_entry = self.get_finance_entry_by_id(entry_id)
        if not db_entry:
            return False
        
        self.db.delete(db_entry)
        self.db.commit()
        
        logger.info(f"Lançamento deletado: {entry_id}")
        return True
    
    # =====================================================================
    # OPERAÇÕES: FIXED EXPENSE (Despesas Fixas)
    # =====================================================================
    
    def create_fixed_expense(self, data: FixedExpenseCreate) -> FixedExpense:
        """Cria uma nova despesa fixa mensal."""
        expense_id = f"EXP-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        db_expense = FixedExpense(
            id=expense_id,
            name=data.name,
            category=data.category,
            estimated_value=data.estimated_value,
            due_day=data.due_day,
            active=data.active,
        )
        
        self.db.add(db_expense)
        self.db.commit()
        self.db.refresh(db_expense)
        
        logger.info(f"Despesa fixa criada: {expense_id} - {data.name}")
        return db_expense
    
    def list_fixed_expenses(self, active_only: bool = False) -> List[FixedExpense]:
        """Lista todas as despesas fixas."""
        query = self.db.query(FixedExpense)
        
        if active_only:
            query = query.filter(FixedExpense.active == True)
        
        return query.all()
    
    # =====================================================================
    # OPERAÇÕES: CONTA PAGAR (Contas a Pagar)
    # =====================================================================
    
    def create_conta_pagar(self, data: ContaPagarCreate) -> ContaPagar:
        """Cria uma nova conta a pagar."""
        conta_id = f"CP-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # Extrair mês do due_date (YYYY-MM-DD -> YYYY-MM)
        month = data.due_date[:7] if data.due_date else datetime.now().strftime("%Y-%m")
        
        db_conta = ContaPagar(
            id=conta_id,
            fixed_expense_id=data.fixed_expense_id,
            description=data.description,
            category=data.category,
            value=data.value,
            due_date=data.due_date,
            month=month,
            paid=data.paid,
            paid_at=data.paid_at,
            is_fixed=data.is_fixed,
        )
        
        self.db.add(db_conta)
        self.db.commit()
        self.db.refresh(db_conta)
        
        logger.info(f"Conta a pagar criada: {conta_id}")
        return db_conta
    
    def list_contas_pagar(
        self, 
        month: Optional[str] = None,
        paid: Optional[bool] = None
    ) -> List[ContaPagar]:
        """
        Lista contas a pagar com filtros.
        
        Args:
            month: Filtro por mês (YYYY-MM)
            paid: Filtro por status de pagamento
        """
        query = self.db.query(ContaPagar)
        
        if month:
            query = query.filter(ContaPagar.month == month)
        
        if paid is not None:
            query = query.filter(ContaPagar.paid == paid)
        
        return query.order_by(ContaPagar.due_date).all()
    
    # =====================================================================
    # CÁLCULOS FINANCEIROS (Migração de financeUtils.ts)
    # =====================================================================
    
    def calculate_period_summary(
        self, 
        selected_period: str,
        initial_balance: float = None
    ) -> FinanceSummaryResponse:
        """
        Calcula resumo financeiro do período selecionado.
        
        Esta é a implementação Python do calculatePeriodFinanceSummary
        que existia no frontend (financeUtils.ts).
        
        Args:
            selected_period: Período no formato YYYY-MM ou "all"
            initial_balance: Saldo inicial (usa DEFAULT_INITIAL_BALANCE se None)
            
        Returns:
            FinanceSummaryResponse: Resumo completo do período
        """
        # Usar saldo inicial padrão se não fornecido
        if initial_balance is None:
            initial_balance = settings.DEFAULT_INITIAL_BALANCE
        
        # Determinar se é período específico ou todos
        is_all_periods = selected_period == "all"
        
        def matches_period(date_str: str) -> bool:
            """Helper para verificar se data pertence ao período."""
            if is_all_periods:
                return True
            return date_str.startswith(selected_period) if date_str else False
        
        # =====================================================================
        # 1. BUSCAR DADOS DO BANCO
        # =====================================================================
        
        # Lançamentos financeiros (receitas e despesas)
        all_entries = self.db.query(FinanceEntry).all()
        
        # Filtrar por período
        period_entries = [e for e in all_entries if matches_period(e.due_date)]
        
        # Separar receitas e despesas
        revenues = [e for e in period_entries if e.entry_type == "receita"]
        expenses_entries = [e for e in period_entries if e.entry_type == "despesa"]
        
        # Contas a pagar do período
        if is_all_periods:
            all_cp = self.db.query(ContaPagar).all()
        else:
            all_cp = self.db.query(ContaPagar).filter(
                ContaPagar.month == selected_period
            ).all()
        
        # Pedidos com nota fiscal (para cálculo de impostos)
        orders_query = self.db.query(Order).filter(Order.has_recibo == True)
        if not is_all_periods:
            # Filtrar pedidos do período (usando updated_at como referência)
            orders_query = orders_query.filter(
                Order.updated_at.like(f"{selected_period}%")
            )
        orders_with_nf = orders_query.all()
        
        # =====================================================================
        # 2. CÁLCULOS PRINCIPAIS
        # =====================================================================
        
        # Receita Total: soma de todas as receitas do período
        total_revenue = sum(r.value for r in revenues)
        
        # Despesas Totais: despesas lançadas + contas a pagar
        total_expenses_list = sum(e.value for e in expenses_entries)
        total_cp = sum(cp.value for cp in all_cp)
        total_expenses = total_expenses_list + total_cp
        
        # Lucro Líquido
        profit = total_revenue - total_expenses
        
        # A Receber (receitas pendentes)
        unpaid_revenue = sum(r.value for r in revenues if not r.paid)
        
        # A Pagar (despesas pendentes + CP pendentes)
        unpaid_expenses_list = sum(e.value for e in expenses_entries if not e.paid)
        cp_unpaid = sum(cp.value for cp in all_cp if not cp.paid)
        total_open_payables = unpaid_expenses_list + cp_unpaid
        
        # Total Recebido (receitas pagas)
        total_received = sum(r.value for r in revenues if r.paid)
        
        # Total Pago (despesas pagas + CP pagas)
        total_paid_list = sum(e.value for e in expenses_entries if e.paid)
        total_paid_cp = sum(cp.value for cp in all_cp if cp.paid)
        total_paid = total_paid_list + total_paid_cp
        
        # Impostos: taxAmount dos pedidos com NF
        total_taxes = sum(o.tax_amount or 0 for o in orders_with_nf)
        
        # Detalhamento de impostos (brasileiros)
        total_icms = sum(o.icms_amount or 0 for o in orders_with_nf)
        total_ipi = sum(o.ipi_amount or 0 for o in orders_with_nf)
        total_pis = sum(o.pis_amount or 0 for o in orders_with_nf)
        total_cofins = sum(o.cofins_amount or 0 for o in orders_with_nf)
        total_icms_credit = sum(o.icms_credit or 0 for o in orders_with_nf)
        
        # Saldo Projetado
        projected_balance = initial_balance + total_revenue - total_expenses
        
        # Margem de Lucro (%)
        margin_percent = (profit / total_revenue * 100) if total_revenue > 0 else 0.0
        
        # Saúde da Margem
        if margin_percent > settings.MARGIN_HEALTH_EXCELLENT:
            margin_health = "excellent"
        elif margin_percent >= settings.MARGIN_HEALTH_ATTENTION:
            margin_health = "attention"
        else:
            margin_health = "risk"
        
        # =====================================================================
        # 3. MONTAR RESPOSTA
        # =====================================================================
        
        summary = FinanceSummaryResponse(
            total_revenue=total_revenue,
            total_expenses=total_expenses,
            profit=profit,
            total_received=total_received,
            total_paid=total_paid,
            unpaid_revenue=unpaid_revenue,
            unpaid_expenses=unpaid_expenses_list,
            cp_unpaid=cp_unpaid,
            total_open_payables=total_open_payables,
            total_taxes=total_taxes,
            projected_balance=projected_balance,
            margin_percent=round(margin_percent, 2),
            margin_health=margin_health,
            period=selected_period,
            initial_balance=initial_balance,
            # Detalhamento de impostos brasileiros
            total_icms=total_icms,
            total_ipi=total_ipi,
            total_pis=total_pis,
            total_cofins=total_cofins,
            total_icms_credit=total_icms_credit,
        )
        
        logger.info(
            f"Resumo calculado para {selected_period}: "
            f"Receita={total_revenue:.2f}, "
            f"Despesa={total_expenses:.2f}, "
            f"Margem={margin_percent:.1f}%"
        )
        
        return summary
    
    def get_monthly_history(self, months: int = 6) -> List[Dict[str, Any]]:
        """
        Gera histórico mensal para gráficos e relatórios.
        
        Args:
            months: Quantidade de meses para trás
            
        Returns:
            List: Lista de dicionários com dados mensais
        """
        # TODO: Implementar consulta agregada por mês
        # Por enquanto retorna estrutura vazia
        return []
    
    # =====================================================================
    # MÉTODOS UTILITÁRIOS
    # =====================================================================
    
    def get_categories(self) -> List[str]:
        """Retorna lista única de categorias usadas nos lançamentos."""
        categories = self.db.query(FinanceEntry.category).distinct().all()
        return [c[0] for c in categories if c[0]]
    
    def get_available_periods(self) -> List[str]:
        """Retorna lista de períodos disponíveis (YYYY-MM) dos dados."""
        # Extrair meses únicos das due_dates
        entries = self.db.query(FinanceEntry.due_date).all()
        periods = set()
        for (date_str,) in entries:
            if date_str and len(date_str) >= 7:
                periods.add(date_str[:7])
        return sorted(list(periods), reverse=True)
    
    # =====================================================================
    # EXTERNAL REVENUE METHODS (Receitas Externas)
    # =====================================================================
    
    def list_external_revenues(
        self,
        source: Optional[str] = None,
        payment_status: Optional[str] = None,
        period: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Lista receitas externas com filtros.
        
        Args:
            source: Origem da receita (Aluguel, Rendimento, etc)
            payment_status: Status do pagamento (paid, pending, overdue)
            period: Período YYYY-MM
            page: Número da página
            limit: Itens por página
            
        Returns:
            Dict com items, total, page, pages, has_next, has_prev
        """
        query = self.db.query(ExternalRevenue)
        
        # Aplicar filtros
        if source:
            query = query.filter(ExternalRevenue.source == source)
        if payment_status:
            query = query.filter(ExternalRevenue.payment_status == payment_status)
        if period:
            query = query.filter(ExternalRevenue.due_date.like(f"{period}%"))
        
        # Ordenar por data de vencimento (mais recente primeiro)
        query = query.order_by(desc(ExternalRevenue.due_date))
        
        # Contar total
        total = query.count()
        
        # Paginação
        offset = (page - 1) * limit
        items = query.offset(offset).limit(limit).all()
        
        pages = (total + limit - 1) // limit
        
        return {
            "items": items,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
            "has_next": page < pages,
            "has_prev": page > 1,
        }
    
    def create_external_revenue(self, data) -> ExternalRevenue:
        """Cria nova receita externa."""
        from datetime import datetime
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Gerar ID
        revenue_id = f"REV-EXT-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        revenue = ExternalRevenue(
            id=revenue_id,
            source=data.source,
            description=data.description,
            value=data.value,
            payment_method=data.payment_method,
            payment_status="pending",
            due_date=data.due_date,
            expected_date=data.expected_date,
            notes=data.notes,
            created_at=now,
            updated_at=now,
        )
        
        self.db.add(revenue)
        self.db.commit()
        self.db.refresh(revenue)
        
        logger.info(f"Receita externa criada: {revenue_id} - {data.source} - R$ {data.value}")
        return revenue
    
    def get_external_revenue_by_id(self, revenue_id: str) -> Optional[ExternalRevenue]:
        """Busca receita externa por ID."""
        return self.db.query(ExternalRevenue).filter(ExternalRevenue.id == revenue_id).first()
    
    def update_external_revenue(self, revenue_id: str, data) -> Optional[ExternalRevenue]:
        """Atualiza receita externa."""
        revenue = self.get_external_revenue_by_id(revenue_id)
        if not revenue:
            return None
        
        # Atualizar campos fornecidos
        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(revenue, field, value)
        
        revenue.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        self.db.commit()
        self.db.refresh(revenue)
        
        logger.info(f"Receita externa atualizada: {revenue_id}")
        return revenue
    
    def delete_external_revenue(self, revenue_id: str) -> bool:
        """Remove receita externa."""
        revenue = self.get_external_revenue_by_id(revenue_id)
        if not revenue:
            return False
        
        self.db.delete(revenue)
        self.db.commit()
        
        logger.info(f"Receita externa removida: {revenue_id}")
        return True
    
    def mark_external_revenue_paid(self, revenue_id: str) -> Optional[ExternalRevenue]:
        """Marca receita externa como paga."""
        revenue = self.get_external_revenue_by_id(revenue_id)
        if not revenue:
            return None
        
        revenue.payment_status = "paid"
        revenue.paid_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        revenue.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        self.db.commit()
        self.db.refresh(revenue)
        
        logger.info(f"Receita externa marcada como paga: {revenue_id}")
        return revenue
