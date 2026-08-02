# =============================================================================
# PACOTE MODELS - Entidades do Banco de Dados
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# Este pacote contém todas as entidades ORM (Object-Relational Mapping)
# que representam as tabelas do banco de dados.
#
# ESTRUTURA:
# - financeiro.py: Entidades financeiras (contas, despesas, histórico)
# - customer.py: Clientes
# - order.py: Pedidos e itens
# - product.py: Produtos
# - carrier.py: Transportadoras
# - user.py: Usuários
#
# USO:
#   from app.models import FinanceEntry, Customer, Order, Product, Carrier, User
#
# =============================================================================

# Importações centralizadas para facilitar uso
from app.models.financeiro import (
    FinanceEntry,
    FixedExpense,
    ContaPagar,
    MonthlyHistory,
    ExternalRevenue,
)
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.carrier import Carrier
from app.models.user import User
from app.models.notification import Notification, NotificationPreference, NotificationTemplate

# Exporta todas as entidades
__all__ = [
    "FinanceEntry",
    "FixedExpense", 
    "ContaPagar",
    "MonthlyHistory",
    "ExternalRevenue",
    "Customer",
    "Order",
    "OrderItem",
    "Product",
    "Carrier",
    "User",
    "Notification",
    "NotificationPreference",
    "NotificationTemplate",
]
