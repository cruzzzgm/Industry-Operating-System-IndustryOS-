# =============================================================================
# MODELS ORDER - Entidades de Pedidos e Itens
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: order.py
# RESPONSABILIDADE: Definir estrutura das tabelas de pedidos e itens
#
# ENTIDADES:
# - Order: Pedido principal (cabeçalho)
# - OrderItem: Itens/produtos de cada pedido
#
# RELACIONAMENTOS:
# - Order 1:N OrderItem (um pedido tem vários itens)
# - Order N:1 Customer (um pedido pertence a um cliente)
#
# =============================================================================

from sqlalchemy import Column, String, Integer, Float, Boolean, Text, ForeignKey, Index, Sequence
from sqlalchemy.orm import relationship, validates
from datetime import datetime

from app.db.database import Base


# =============================================================================
# ENTIDADE ORDER ITEM (Itens do Pedido)
# =============================================================================
class OrderItem(Base):
    """
    Item individual dentro de um pedido.
    
    Cada pedido pode ter um ou mais itens (produtos/serviços).
    Os itens são agregados para formar o valor total do pedido.
    
    Campos específicos para nota fiscal:
        - ncm_code: Código NCM brasileiro (classificação fiscal)
        - weight_per_unit: Peso unitário para cálculo de frete
    
    Attributes:
        id: Identificador único do item
        order_id: FK para o pedido pai
        description: Descrição do produto/serviço
        ncm_code: Código NCM (8 dígitos)
        unit: Unidade de medida (UN, KG, M, L...)
        quantity: Quantidade solicitada
        unit_price: Preço unitário (R$)
        total_price: Preço total (calculado)
        weight_per_unit: Peso por unidade (kg)
    """
    
    __tablename__ = "order_items"
    
    # -------------------------------------------------------------------------
    # COLUNAS IDENTIFICAÇÃO
    # -------------------------------------------------------------------------
    id = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True,
        index=True,
        comment="Identificador único do item (sequencial)"
    )
    
    order_id = Column(
        Integer, 
        ForeignKey('orders.id', ondelete='CASCADE'),
        nullable=False,
        index=True,
        comment="Referência ao pedido pai"
    )
    
    description = Column(
        String(300), 
        nullable=False,
        comment="Descrição detalhada do produto"
    )
    
    ncm_code = Column(
        String(20), 
        nullable=True,
        comment="Código NCM brasileiro (classificação fiscal)"
    )
    
    unit = Column(
        String(10), 
        nullable=False,
        default="UN",
        comment="Unidade de medida: UN, KG, MT, L, CX..."
    )
    
    quantity = Column(
        Float, 
        nullable=False,
        comment="Quantidade solicitada"
    )
    
    unit_price = Column(
        Float, 
        nullable=False,
        comment="Preço unitário em R$"
    )
    
    # Calculado automaticamente (quantity * unit_price)
    total_price = Column(
        Float, 
        nullable=False,
        comment="Total do item (quantity × unit_price)"
    )
    
    # Informações para transporte/Nota Fiscal
    weight_per_unit = Column(
        Float, 
        nullable=True,
        comment="Peso por unidade em kg (para cálculo de frete)"
    )
    
    # -------------------------------------------------------------------------
    # RELACIONAMENTOS
    # -------------------------------------------------------------------------
    order = relationship(
        "Order",
        back_populates="items"
    )
    
    # -------------------------------------------------------------------------
    # VALIDADORES
    # -------------------------------------------------------------------------
    @validates('quantity', 'unit_price')
    def validate_positive(self, key, value):
        """Valida que quantidade e preço são positivos."""
        if value <= 0:
            raise ValueError(f"{key} deve ser maior que zero")
        return value
    
    def __repr__(self):
        return f"<OrderItem(id={self.id}, desc={self.description[:30]}, qty={self.quantity})>"


# =============================================================================
# ENTIDADE ORDER (Pedido Principal)
# =============================================================================
class Order(Base):
    """
    Pedido de venda principal.
    
    Centraliza todas as informações de um pedido de venda, desde
    a identificação do cliente até os detalhes de entrega e valores
    fiscais (impostos, créditos ICMS).
    
    WORKFLOW DE STATUS:
        Pendente → Em Produção → Finalizado → Aguardando Coleta → Retirado
                                 ↓
                           Cancelado
    
    Attributes:
        id: Identificador único do pedido
        customer_id: FK para o cliente
        customer_name: Nome do cliente (denormalizado para performance)
        product: Descrição resumida (primeiro item)
        items: Lista de itens (relação 1:N)
        quantity: Quantidade total de itens
        total_value: Valor total do pedido (R$)
        status: Status atual do workflow
        delivery_method: Retirada ou Transportadora
        has_recibo: Se possui nota fiscal/recibo
        recibo_number: Número da NF/recibo
        shipping_type: Tipo de frete (CIF, FOB...)
        carrier_name: Nome da transportadora
        freight_responsibility: Quem paga o frete
        gross_weight: Peso total bruto (kg)
        package_type: Tipo de embalagem
        tax_amount: Valor dos impostos (R$)
        icms_credit: Crédito de ICMS gerado (R$)
        created_at: Data de criação
        updated_at: Última atualização
    """
    
    __tablename__ = "orders"
    
    # -------------------------------------------------------------------------
    # COLUNAS IDENTIFICAÇÃO
    # -------------------------------------------------------------------------
    id = Column(
        Integer, 
        primary_key=True, 
        autoincrement=True,
        index=True,
        comment="Identificador único do pedido (sequencial)"
    )
    
    customer_id = Column(
        Integer, 
        ForeignKey('customers.id', ondelete='RESTRICT'),
        nullable=False,
        index=True,
        comment="Referência ao cliente"
    )
    
    # Denormalização: guardar nome do cliente para exibição rápida
    # Evita JOIN desnecessário em listagens
    customer_name = Column(
        String(150), 
        nullable=False,
        index=True,
        comment="Nome do cliente (denormalizado para performance)"
    )
    
    # Resumo do produto (primeiro item ou descrição geral)
    product = Column(
        String(200), 
        nullable=True,
        comment="Descrição resumida do produto principal"
    )
    
    # -------------------------------------------------------------------------
    # COLUNAS VALORES
    # -------------------------------------------------------------------------
    quantity = Column(
        Integer, 
        default=1,
        comment="Quantidade total de itens"
    )
    
    total_value = Column(
        Float, 
        nullable=False,
        comment="Valor total do pedido em R$"
    )
    
    # -------------------------------------------------------------------------
    # COLUNAS STATUS E WORKFLOW
    # -------------------------------------------------------------------------
    status = Column(
        String(50), 
        nullable=False,
        default="Pendente",
        index=True,
        comment="Status: Pendente, Em Produção, Finalizado, Aguardando Coleta, Retirado, Cancelado"
    )
    
    # -------------------------------------------------------------------------
    # COLUNAS ENTREGA/TRANSPORTE
    # -------------------------------------------------------------------------
    delivery_method = Column(
        String(20), 
        nullable=False,
        default="Retirada",
        comment="Método: 'Retirada' ou 'Transportadora'"
    )
    
    shipping_type = Column(
        String(50), 
        nullable=True,
        comment="Tipo de frete: CIF, FOB, etc."
    )
    
    carrier_name = Column(
        String(150), 
        nullable=True,
        comment="Nome da transportadora"
    )
    
    freight_responsibility = Column(
        String(20), 
        nullable=True,
        comment="Responsável pelo frete: 'Remetente' ou 'Destinatário'"
    )
    
    gross_weight = Column(
        Float, 
        nullable=True,
        comment="Peso bruto total em kg"
    )
    
    package_type = Column(
        String(50), 
        nullable=True,
        comment="Tipo de embalagem: Caixa, Palete, Container..."
    )
    
    # -------------------------------------------------------------------------
    # COLUNAS FISCAIS (Nota Fiscal)
    # -------------------------------------------------------------------------
    has_recibo = Column(
        Boolean, 
        default=False,
        comment="True=pedido faturado com NF/recibo"
    )
    
    recibo_number = Column(
        String(50), 
        nullable=True,
        comment="Número da nota fiscal/recibo"
    )
    
    # -------------------------------------------------------------------------
    # CAMPOS DE IMPOSTOS (Sistema Tributário Brasileiro)
    # -------------------------------------------------------------------------
    
    # Valor total de impostos (soma de todos os impostos abaixo)
    tax_amount = Column(
        Float, 
        nullable=True,
        default=0.0,
        comment="Valor total de impostos (R$)"
    )
    
    # ICMS - Imposto sobre Circulação de Mercadorias e Serviços (12% a 18%)
    icms_amount = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Valor do ICMS (R$) - 12% a 18%"
    )
    
    # IPI - Imposto sobre Produtos Industrializados (0% a 300%, média 10%)
    ipi_amount = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Valor do IPI (R$) - varia por produto"
    )
    
    # PIS - Programa de Integração Social (1.65%)
    pis_amount = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Valor do PIS (R$) - 1.65%"
    )
    
    # COFINS - Contribuição para Financiamento da Seguridade Social (7.6%)
    cofins_amount = Column(
        Float,
        nullable=True,
        default=0.0,
        comment="Valor do COFINS (R$) - 7.6%"
    )
    
    # Crédito de ICMS gerado (para empresas do regime normal)
    icms_credit = Column(
        Float, 
        nullable=True,
        comment="Crédito de ICMS gerado neste pedido (R$)"
    )
    
    # Flag indicando se impostos foram calculados automaticamente
    taxes_calculated = Column(
        Boolean,
        nullable=True,
        default=False,
        comment="True=impostos calculados automaticamente"
    )
    
    # -------------------------------------------------------------------------
    # COLUNAS PAGAMENTO (Integração com Gestão de Receitas)
    # -------------------------------------------------------------------------
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
        comment="Status pagamento: paid, pending, overdue"
    )
    
    due_date = Column(
        String(10),  # Format: YYYY-MM-DD
        nullable=True,
        comment="Data de vencimento do pagamento"
    )
    
    expected_date = Column(
        String(10),  # Format: YYYY-MM-DD
        nullable=True,
        comment="Data prevista de recebimento (negociada com cliente)"
    )
    
    paid_at = Column(
        String(19),  # Format: YYYY-MM-DD HH:MM:SS
        nullable=True,
        comment="Data/hora do pagamento efetivo"
    )
    
    # -------------------------------------------------------------------------
    # TIMESTAMPS
    # -------------------------------------------------------------------------
    created_at = Column(
        String(19),  # Format: "YYYY-MM-DD HH:MM:SS"
        nullable=False,
        comment="Data/hora de criação do pedido"
    )
    
    updated_at = Column(
        String(19),  # Format: "YYYY-MM-DD HH:MM:SS"
        nullable=False,
        comment="Data/hora da última atualização"
    )
    
    # -------------------------------------------------------------------------
    # RELACIONAMENTOS
    # -------------------------------------------------------------------------
    # Itens do pedido (1:N)
    items = relationship(
        "OrderItem",
        back_populates="order",
        lazy="joined",  # Carrega itens junto (necessário para detalhes)
        cascade="all, delete-orphan"
    )
    
    # Cliente (N:1)
    customer_ref = relationship(
        "Customer",
        back_populates="orders",
        lazy="joined"
    )
    
    # -------------------------------------------------------------------------
    # ÍNDICES E RESTRIÇÕES
    # -------------------------------------------------------------------------
    __table_args__ = (
        # Índice composto essencial: cliente + status
        Index('ix_order_customer_status', 'customer_id', 'status'),
        
        # Índice para relatórios financeiros (status faturado)
        Index('ix_order_faturado', 'has_recibo', 'created_at'),
        
        # Índice para gestão de receitas
        Index('ix_order_payment_status', 'payment_status', 'due_date'),
        
        {'comment': 'Pedidos de venda com itens, entrega e dados fiscais'}
    )
    
    @validates('status')
    def validate_status(self, key, status):
        """Valida se o status é um dos permitidos."""
        allowed = [
            "Pendente", "Em Produção", "Finalizado", 
            "Aguardando Coleta", "Retirado", "Cancelado"
        ]
        if status not in allowed:
            raise ValueError(f"Status deve ser um de: {allowed}")
        return status
    
    @validates('delivery_method')
    def validate_delivery(self, key, method):
        """Valida método de entrega."""
        allowed = ["Retirada", "Transportadora"]
        if method not in allowed:
            raise ValueError(f"Método deve ser: {allowed}")
        return method
    
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
            raise ValueError(f"Status de pagamento deve ser: {allowed}")
        return status
    
    def calculate_taxes(self, force: bool = False) -> dict:
        """
        Calcula automaticamente os impostos brasileiros para o pedido.
        
        Implementa as alíquotas típicas para produtos industrializados no Brasil:
        - ICMS: 12% (interstate) ou 18% (interno) - usando 12% como padrão
        - IPI: 10% (média para produtos industriais comuns)
        - PIS: 1.65%
        - COFINS: 7.6%
        
        Args:
            force: Se True, recalcula mesmo que já tenha sido calculado
            
        Returns:
            Dict com valores de cada imposto e total
        """
        # Se já foi calculado e não está forçando, retorna valores atuais
        if self.taxes_calculated and not force:
            return {
                'icms': self.icms_amount or 0,
                'ipi': self.ipi_amount or 0,
                'pis': self.pis_amount or 0,
                'cofins': self.cofins_amount or 0,
                'total': self.tax_amount or 0,
                'icms_credit': self.icms_credit or 0
            }
        
        # Valor base para cálculo (valor total do pedido)
        base_value = self.total_value or 0
        
        if base_value <= 0:
            return {'icms': 0, 'ipi': 0, 'pis': 0, 'cofins': 0, 'total': 0, 'icms_credit': 0}
        
        # Alíquotas típicas do Brasil para indústria
        ICMS_RATE = 0.12  # 12% - ICMS interestadual
        IPI_RATE = 0.10   # 10% - IPI médio industrial
        PIS_RATE = 0.0165 # 1.65% - PIS cumulativo
        COFINS_RATE = 0.076  # 7.6% - COFINS cumulativo
        
        # Cálculo dos impostos
        self.icms_amount = round(base_value * ICMS_RATE, 2)
        self.ipi_amount = round(base_value * IPI_RATE, 2)
        self.pis_amount = round(base_value * PIS_RATE, 2)
        self.cofins_amount = round(base_value * COFINS_RATE, 2)
        
        # Total de impostos
        self.tax_amount = round(
            self.icms_amount + self.ipi_amount + self.pis_amount + self.cofins_amount, 2
        )
        
        # Crédito de ICMS (para empresas do regime normal, o crédito é o próprio ICMS)
        self.icms_credit = self.icms_amount
        
        # Marca como calculado automaticamente
        self.taxes_calculated = True
        
        return {
            'icms': self.icms_amount,
            'ipi': self.ipi_amount,
            'pis': self.pis_amount,
            'cofins': self.cofins_amount,
            'total': self.tax_amount,
            'icms_credit': self.icms_credit
        }
    
    def __repr__(self):
        return f"<Order(id={self.id}, customer={self.customer_name}, value={self.total_value}, status={self.status})>"
