# =============================================================================
# MODELS FINANCEIROS - Entidades do Módulo Financeiro
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: financeiro.py
# RESPONSABILIDADE: Definir estrutura das tabelas financeiras do banco de dados
#
# ENTIDADES:
# 1. FinanceEntry: Registros financeiros (receitas e despesas)
# 2. FixedExpense: Despesas fixas recorrentes mensais
# 3. ContaPagar: Contas a pagar (CP) geradas a partir de despesas fixas
# 4. MonthlyHistory: Histórico mensal consolidado para relatórios
#
# RELACIONAMENTOS:
# - FixedExpense 1:N ContaPagar (uma despesa fixa gera várias contas mensais)
# - ContaPagar N:1 FixedExpense (cada conta pertence a uma despesa fixa)
#
# =============================================================================

from sqlalchemy import (
    Column,              # Definição de colunas
    String,              # Texto/VARCHAR
    Integer,             # Números inteiros
    Float,               # Números decimais (monetários)
    Boolean,             # True/False
    DateTime,            # Datas e horários
    ForeignKey,          # Chaves estrangeiras
    Text,                # Textos longos
    Index,               # Índices para performance
    CheckConstraint,     # Restrições de validação
)
from sqlalchemy.orm import relationship, validates
from datetime import datetime
from typing import Optional

# Base declarativa do SQLAlchemy (define a conexão com o banco)
from app.db.database import Base


# =============================================================================
# ENTIDADE 1: FINANCE ENTRY (Receitas e Despesas)
# =============================================================================
class FinanceEntry(Base):
    """
    Registro financeiro individual - receita ou despesa.
    
    Esta é a entidade principal do módulo financeiro. Representa cada
    movimentação de caixa do sistema, seja entrada (receita) ou saída
    (despesa) de recursos.
    
    Exemplos de uso:
        - Venda para cliente (receita)
        - Pagamento de fornecedor (despesa)
        - Conta de luz (despesa)
        - Recebimento de empréstimo (receita)
    
    Attributes:
        id: Identificador único (UUID)
        description: Descrição do lançamento
        type: Tipo - "receita" ou "despesa"
        value: Valor monetário (sempre positivo)
        due_date: Data de vencimento/pagamento esperado
        paid: Status de pagamento (True=quitado)
        paid_at: Data efetiva do pagamento
        category: Categoria para relatórios
        created_at: Timestamp de criação
        updated_at: Timestamp da última modificação
    
    Constraints:
        - type deve ser "receita" ou "despesa"
        - value deve ser positivo
        - paid_at só pode existir se paid=True
    """
    
    # Nome da tabela no banco de dados
    __tablename__ = "finance_entries"
    
    # -------------------------------------------------------------------------
    # COLUNAS PRINCIPAIS
    # -------------------------------------------------------------------------
    
    # Identificador único (chave primária)
    # Usando String para UUID (ex: "FIN-2024-001234") ou UUID nativo
    id = Column(
        String(50), 
        primary_key=True, 
        index=True,
        comment="Identificador único do lançamento financeiro"
    )
    
    # Descrição do lançamento
    description = Column(
        String(255), 
        nullable=False,
        comment="Descrição detalhada do lançamento (ex: 'Pagamento Cliente XYZ')"
    )
    
    # Tipo do lançamento: receita (entrada) ou despesa (saída)
    entry_type = Column(
        String(20), 
        nullable=False,
        comment="Tipo: 'receita' (entrada) ou 'despesa' (saída)"
    )
    
    # Valor monetário (em Reais)
    # Float é suficiente para valores monetários brasileiros
    # Alternativa: Decimal para precisão absoluta (cálculos fiscais)
    value = Column(
        Float, 
        nullable=False,
        comment="Valor monetário em Reais (R$)"
    )
    
    # Data de vencimento ou data prevista do pagamento
    due_date = Column(
        String(10),  # Format: "YYYY-MM-DD"
        nullable=False,
        index=True,
        comment="Data de vencimento no formato ISO (YYYY-MM-DD)"
    )
    
    # Status de pagamento: True=quitado, False=pagamento pendente
    paid = Column(
        Boolean, 
        default=False, 
        nullable=False,
        comment="Status: True=pago, False=pendente"
    )
    
    # Data efetiva do pagamento (quando foi quitado)
    # Pode ser nulo se ainda não foi pago
    paid_at = Column(
        String(10),  # Format: "YYYY-MM-DD" ou null
        nullable=True,
        comment="Data do pagamento efetivo (null se pendente)"
    )
    
    # Categoria para agrupamento em relatórios
    # Exemplos: "Vendas", "Fornecedores", "Impostos", "Salários", "Operacional"
    category = Column(
        String(100), 
        nullable=True,
        index=True,
        comment="Categoria para relatórios (ex: 'Vendas', 'Fornecedores')"
    )
    
    # Timestamps de auditoria
    created_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        nullable=False,
        comment="Data/hora de criação do registro"
    )
    
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        nullable=False,
        comment="Data/hora da última atualização"
    )
    
    # -------------------------------------------------------------------------
    # ÍNDICES PARA PERFORMANCE
    # -------------------------------------------------------------------------
    __table_args__ = (
        # Índice composto para consultas por período + tipo
        Index('ix_finance_period_type', 'due_date', 'entry_type'),
        
        # Índice para consultas por status de pagamento
        Index('ix_finance_paid', 'paid'),
        
        # Restrição de integridade: tipo deve ser válido
        CheckConstraint(
            "entry_type IN ('receita', 'despesa')",
            name='ck_finance_entry_type'
        ),
        
        # Restrição: valor deve ser positivo
        CheckConstraint(
            "value > 0",
            name='ck_finance_value_positive'
        ),
        
        # Comentário da tabela
        {'comment': 'Tabela principal de lançamentos financeiros (receitas e despesas)'}
    )
    
    # -------------------------------------------------------------------------
    # VALIDADORES SQLALCHEMY
    # -------------------------------------------------------------------------
    
    @validates('entry_type')
    def validate_entry_type(self, key, entry_type):
        """
        Valida se o tipo é válido.
        
        Args:
            key: Nome da coluna sendo validada
            entry_type: Valor a ser validado
            
        Returns:
            str: Valor validado (lowercase)
            
        Raises:
            ValueError: Se tipo não for 'receita' ou 'despesa'
        """
        allowed = ['receita', 'despesa']
        if entry_type.lower() not in allowed:
            raise ValueError(f"Tipo deve ser um de: {allowed}")
        return entry_type.lower()
    
    @validates('value')
    def validate_value(self, key, value):
        """Valida se valor é positivo."""
        if value <= 0:
            raise ValueError("Valor deve ser positivo")
        return value
    
    # -------------------------------------------------------------------------
    # REPRESENTAÇÃO STRING
    # -------------------------------------------------------------------------
    
    def __repr__(self):
        return (
            f"<FinanceEntry(id={self.id}, "
            f"type={self.entry_type}, "
            f"value={self.value}, "
            f"date={self.due_date}, "
            f"paid={self.paid})>"
        )
    
    def __str__(self):
        status = "✓" if self.paid else "○"
        return f"[{status}] {self.description}: R$ {self.value:,.2f}"


# =============================================================================
# ENTIDADE 2: FIXED EXPENSE (Despesas Fixas Mensais)
# =============================================================================
class FixedExpense(Base):
    """
    Despesa fixa recorrente mensal.
    
    Representa despesas que se repetem todo mês, como:
        - Aluguel
        - Salários
        - Internet/Telefone
        - Conta de luz/água
        - Software/SaaS
    
    Estas despesas são usadas para gerar automaticamente as
    "Contas a Pagar" (ContaPagar) de cada mês.
    
    Attributes:
        id: Identificador único
        name: Nome da despesa (ex: "Aluguel Escritório")
        category: Categoria (ex: "Fixas", "Pessoal", "Operacional")
        estimated_value: Valor estimado mensal
        due_day: Dia do vencimento (1-31)
        active: Se está ativa (gera contas automaticamente)
        created_at: Data de criação
    """
    
    __tablename__ = "fixed_expenses"
    
    # -------------------------------------------------------------------------
    # COLUNAS
    # -------------------------------------------------------------------------
    id = Column(
        String(50), 
        primary_key=True, 
        index=True,
        comment="Identificador único da despesa fixa"
    )
    
    name = Column(
        String(150), 
        nullable=False,
        comment="Nome da despesa (ex: 'Aluguel Matriz')"
    )
    
    category = Column(
        String(100), 
        nullable=True,
        comment="Categoria: 'Fixas', 'Pessoal', 'Operacional', 'Impostos'"
    )
    
    estimated_value = Column(
        Float, 
        nullable=False,
        comment="Valor estimado mensal em R$"
    )
    
    due_day = Column(
        Integer, 
        nullable=False,
        comment="Dia do vencimento (1-31)"
    )
    
    active = Column(
        Boolean, 
        default=True, 
        nullable=False,
        comment="Ativa=True gera contas automaticamente todo mês"
    )
    
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Data de cadastro"
    )
    
    # -------------------------------------------------------------------------
    # RELACIONAMENTOS
    # -------------------------------------------------------------------------
    # Uma despesa fixa pode gerar várias contas a pagar (uma por mês)
    contas_pagar = relationship(
        "ContaPagar",
        back_populates="fixed_expense",
        lazy="dynamic",  # Query sob demanda para performance
        cascade="all, delete-orphan"  # Deletar contas se despesa for deletada
    )
    
    # -------------------------------------------------------------------------
    # ÍNDICES E RESTRIÇÕES
    # -------------------------------------------------------------------------
    __table_args__ = (
        # Índice para consultas por categoria
        Index('ix_fixed_expense_category', 'category'),
        
        # Índice para ativas (filtro comum)
        Index('ix_fixed_expense_active', 'active'),
        
        # Restrição: dia deve estar entre 1 e 31
        CheckConstraint(
            "due_day >= 1 AND due_day <= 31",
            name='ck_fixed_expense_due_day'
        ),
        
        {'comment': 'Cadastro de despesas fixas mensais recorrentes'}
    )
    
    def __repr__(self):
        return f"<FixedExpense(id={self.id}, name={self.name}, value={self.estimated_value})>"


# =============================================================================
# ENTIDADE 3: CONTA PAGAR (Contas a Pagar Mensais)
# =============================================================================
class ContaPagar(Base):
    """
    Conta a pagar gerada mensalmente a partir de despesas fixas.
    
    Cada mês, o sistema gera automaticamente uma ContaPagar para cada
    FixedExpense ativa. Isso permite:
        - Controle mensal de cada pagamento
        - Marcar como pago individualmente
        - Alterar valores específicos de um mês
        - Histórico completo
    
    Attributes:
        id: Identificador único
        fixed_expense_id: Referência à despesa fixa origem (nullable)
        description: Descrição da conta
        category: Categoria herdada ou customizada
        value: Valor específico deste mês (pode diferir do estimado)
        due_date: Data de vencimento (YYYY-MM-DD)
        month: Mês de referência (YYYY-MM)
        paid: Status de pagamento
        paid_at: Data do pagamento
        is_fixed: Se veio de uma despesa fixa (True) ou é avulsa (False)
    """
    
    __tablename__ = "contas_pagar"
    
    # -------------------------------------------------------------------------
    # COLUNAS
    # -------------------------------------------------------------------------
    id = Column(
        String(50), 
        primary_key=True, 
        index=True,
        comment="Identificador único da conta a pagar"
    )
    
    # Chave estrangeira para despesa fixa (opcional)
    # Pode ser NULL se a conta foi criada manualmente (não veio de despesa fixa)
    fixed_expense_id = Column(
        String(50), 
        ForeignKey('fixed_expenses.id', ondelete='SET NULL'),
        nullable=True,
        index=True,
        comment="Referência à despesa fixa (null se conta avulsa)"
    )
    
    description = Column(
        String(255), 
        nullable=False,
        comment="Descrição da conta (ex: 'Aluguel Abril/2024')"
    )
    
    category = Column(
        String(100), 
        nullable=True,
        comment="Categoria para agrupamento"
    )
    
    value = Column(
        Float, 
        nullable=False,
        comment="Valor desta conta específica (pode diferir do estimado)"
    )
    
    due_date = Column(
        String(10),  # YYYY-MM-DD
        nullable=False,
        index=True,
        comment="Data de vencimento"
    )
    
    # Mês de referência no formato YYYY-MM (ex: "2024-04")
    # Facilita filtros por mês específico
    month = Column(
        String(7),  # YYYY-MM
        nullable=False,
        index=True,
        comment="Mês de referência (YYYY-MM)"
    )
    
    paid = Column(
        Boolean, 
        default=False, 
        nullable=False,
        comment="True=quitada, False=pendente"
    )
    
    paid_at = Column(
        String(10),  # YYYY-MM-DD
        nullable=True,
        comment="Data do pagamento efetivo"
    )
    
    # Flag para identificar origem: True=despesa fixa, False=conta avulsa
    is_fixed = Column(
        Boolean, 
        default=False, 
        nullable=False,
        comment="True=gerada de despesa fixa, False=conta avulsa manual"
    )
    
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Data de criação"
    )
    
    # -------------------------------------------------------------------------
    # RELACIONAMENTOS
    # -------------------------------------------------------------------------
    fixed_expense = relationship(
        "FixedExpense",
        back_populates="contas_pagar",
        lazy="joined"  # Carrega junto para acesso rápido
    )
    
    # -------------------------------------------------------------------------
    # ÍNDICES
    # -------------------------------------------------------------------------
    __table_args__ = (
        # Índice composto essencial: mês + status de pagamento
        Index('ix_conta_pagar_month_paid', 'month', 'paid'),
        
        # Índice para consultas por período
        Index('ix_conta_pagar_due_date', 'due_date'),
        
        {'comment': 'Contas a pagar mensais (CP) - fluxo de caixa'}
    )
    
    def __repr__(self):
        return f"<ContaPagar(id={self.id}, desc={self.description[:30]}, month={self.month}, paid={self.paid})>"


# =============================================================================
# ENTIDADE 4: MONTHLY HISTORY (Histórico Mensal Consolidado)
# =============================================================================
class MonthlyHistory(Base):
    """
    Histórico consolidado mensal para relatórios e projeções.
    
    Esta tabela armazena snapshots mensais dos principais indicadores
    financeiros, permitindo:
        - Gráficos de evolução temporal
        - Análise de tendências
        - Projeções futuras
        - Comparativos mês a mês
    
    Os dados são agregados automaticamente a partir de:
        - FinanceEntry (receitas e despesas)
        - ContaPagar (contas pagas)
        - Order (pedidos finalizados)
    
    Attributes:
        id: Identificador
        month: Mês de referência (YYYY-MM)
        total_revenue: Receita total do mês
        total_expenses: Despesas totais do mês
        profit: Lucro líquido (receita - despesas)
        margin_percent: Margem de lucro (%)
        margin_health: Saúde da margem (excellent/attention/risk)
        total_received: Valor efetivamente recebido
        total_paid: Valor efetivamente pago
        unpaid_revenue: Valor a receber pendente
        unpaid_expenses: Valor a pagar pendente
        total_taxes: Impostos pagos no mês
        projected_balance: Saldo projetado
        is_prediction: Se é valor real (False) ou projeção (True)
    """
    
    __tablename__ = "monthly_history"
    
    # -------------------------------------------------------------------------
    # COLUNAS
    # -------------------------------------------------------------------------
    id = Column(
        String(50), 
        primary_key=True, 
        index=True,
        comment="Identificador único do registro mensal"
    )
    
    month = Column(
        String(7),  # YYYY-MM
        nullable=False,
        unique=True,  # Um registro por mês
        index=True,
        comment="Mês de referência (YYYY-MM)"
    )
    
    # Métricas de receita e despesa
    total_revenue = Column(
        Float, 
        default=0.0,
        comment="Receita total do mês (R$)"
    )
    
    total_expenses = Column(
        Float, 
        default=0.0,
        comment="Despesa total do mês (R$)"
    )
    
    # Lucro e margem
    profit = Column(
        Float, 
        default=0.0,
        comment="Lucro líquido (receita - despesa)"
    )
    
    margin_percent = Column(
        Float, 
        default=0.0,
        comment="Margem de lucro em percentual (%)"
    )
    
    margin_health = Column(
        String(20), 
        default="risk",
        comment="Classificação: 'excellent', 'attention', 'risk'"
    )
    
    # Fluxo de caixa (valores efetivos vs esperados)
    total_received = Column(
        Float, 
        default=0.0,
        comment="Valor efetivamente recebido (R$)"
    )
    
    total_paid = Column(
        Float, 
        default=0.0,
        comment="Valor efetivamente pago (R$)"
    )
    
    unpaid_revenue = Column(
        Float, 
        default=0.0,
        comment="Valor a receber pendente (R$)"
    )
    
    unpaid_expenses = Column(
        Float, 
        default=0.0,
        comment="Valor a pagar pendente (R$)"
    )
    
    # Impostos
    total_taxes = Column(
        Float, 
        default=0.0,
        comment="Total de impostos pagos (R$)"
    )
    
    # Projeções
    projected_balance = Column(
        Float, 
        default=0.0,
        comment="Saldo projetado para o mês"
    )
    
    is_prediction = Column(
        Boolean, 
        default=False,
        comment="True=projeção futura, False=dado real consolidado"
    )
    
    # Timestamps
    created_at = Column(
        DateTime, 
        default=datetime.utcnow,
        comment="Data de criação do snapshot"
    )
    
    updated_at = Column(
        DateTime, 
        default=datetime.utcnow, 
        onupdate=datetime.utcnow,
        comment="Última atualização"
    )
    
    # -------------------------------------------------------------------------
    # ÍNDICES
    # -------------------------------------------------------------------------
    __table_args__ = (
        # Índice para projeções vs reais
        Index('ix_monthly_history_prediction', 'is_prediction'),
        
        # Restrição de integridade
        CheckConstraint(
            "margin_health IN ('excellent', 'attention', 'risk')",
            name='ck_monthly_health'
        ),
        
        {'comment': 'Histórico mensal consolidado para relatórios e gráficos'}
    )
    
    def __repr__(self):
        status = "PROJ" if self.is_prediction else "REAL"
        return (
            f"<MonthlyHistory(month={self.month}, "
            f"revenue={self.total_revenue}, "
            f"profit={self.profit}, "
            f"status={status})>"
        )


# =============================================================================
# ENTIDADE 5: EXTERNAL REVENUE (Receitas Externas)
# =============================================================================
class ExternalRevenue(Base):
    """
    Receitas de fontes externas (não relacionadas a pedidos).
    
    Representa entradas de recursos que não vêm de vendas para clientes,
    como aluguel, rendimentos, reembolsos, etc.
    
    Attributes:
        id: Identificador único (REV-EXT-YYYY-XXXXXX)
        source: Origem da receita (Aluguel, Rendimento, Reembolso, Outro)
        description: Descrição detalhada
        value: Valor em R$
        payment_method: Forma de pagamento
        payment_status: Status (paid, pending, overdue)
        due_date: Data de vencimento/expectativa
        expected_date: Data prevista de recebimento
        paid_at: Data do pagamento efetivo
        notes: Observações adicionais
    """
    
    __tablename__ = "external_revenues"
    
    # Identificação
    id = Column(
        String(50),
        primary_key=True,
        comment="Identificador único (REV-EXT-YYYY-XXXXXX)"
    )
    
    # Origem
    source = Column(
        String(50),
        nullable=False,
        comment="Origem: Aluguel, Rendimento, Reembolso, Outro"
    )
    
    # Descrição
    description = Column(
        String(300),
        nullable=False,
        comment="Descrição detalhada da receita"
    )
    
    # Valor
    value = Column(
        Float,
        nullable=False,
        comment="Valor em R$"
    )
    
    # Pagamento
    payment_method = Column(
        String(20),
        nullable=True,
        comment="Forma de pagamento: boleto, pix, transferencia, dinheiro, cheque, cartao"
    )
    
    payment_status = Column(
        String(20),
        nullable=False,
        default="pending",
        index=True,
        comment="Status: paid, pending, overdue"
    )
    
    due_date = Column(
        String(10),  # YYYY-MM-DD
        nullable=True,
        comment="Data de vencimento"
    )
    
    expected_date = Column(
        String(10),  # YYYY-MM-DD
        nullable=True,
        comment="Data prevista de recebimento"
    )
    
    paid_at = Column(
        String(19),  # YYYY-MM-DD HH:MM:SS
        nullable=True,
        comment="Data/hora do pagamento efetivo"
    )
    
    # Observações
    notes = Column(
        Text,
        nullable=True,
        comment="Observações adicionais"
    )
    
    # Timestamps
    created_at = Column(
        String(19),  # YYYY-MM-DD HH:MM:SS
        nullable=False,
        comment="Data de criação"
    )
    
    updated_at = Column(
        String(19),  # YYYY-MM-DD HH:MM:SS
        nullable=False,
        comment="Última atualização"
    )
    
    # Índices
    __table_args__ = (
        Index('ix_external_revenue_status', 'payment_status', 'due_date'),
        Index('ix_external_revenue_source', 'source'),
        {'comment': 'Receitas de fontes externas (não pedidos)'}
    )
    
    @validates('payment_method')
    def validate_payment_method(self, key, method):
        """Valida forma de pagamento."""
        if method is None:
            return method
        allowed = ["boleto", "pix", "transferencia", "dinheiro", "cheque", "cartao"]
        if method not in allowed:
            raise ValueError(f"Forma de pagamento deve ser: {allowed}")
        return method
    
    @validates('payment_status')
    def validate_payment_status(self, key, status):
        """Valida status de pagamento."""
        allowed = ["paid", "pending", "overdue"]
        if status not in allowed:
            raise ValueError(f"Status deve ser: {allowed}")
        return status
    
    @validates('value')
    def validate_value(self, key, value):
        """Valida e formata valor monetário."""
        if value is None:
            return value
        # Arredonda para 2 casas decimais (formato Real brasileiro)
        return round(float(value), 2)
    
    @validates('source')
    def validate_source(self, key, source):
        """Valida origem da receita - agora aceita qualquer texto livre."""
        if source is None:
            return source
        # Remove espaços extras e limita a 50 caracteres
        source = str(source).strip()
        if len(source) > 50:
            source = source[:50]
        return source
    
    def __repr__(self):
        return (
            f"<ExternalRevenue(id={self.id}, source={self.source}, "
            f"value={self.value}, status={self.payment_status})>"
        )
