#!/usr/bin/env python3
"""
Script para resetar o banco de dados e criar tabelas limpas
"""
import sys
sys.path.insert(0, '/app')

from app.db.database import engine, Base
from app.models import (
    FinanceEntry,
    FixedExpense,
    ContaPagar,
    MonthlyHistory,
    ExternalRevenue,
    Customer,
    Order,
    OrderItem,
    Product,
    Carrier,
    User,
)

print("=" * 60)
print("RESETANDO BANCO DE DADOS")
print("=" * 60)

# Drop todas as tabelas
print("\n1. Removendo tabelas existentes...")
try:
    Base.metadata.drop_all(bind=engine)
    print("   ✓ Tabelas removidas")
except Exception as e:
    print(f"   ⚠ Erro ao remover tabelas (pode não existir): {e}")

# Cria todas as tabelas
print("\n2. Criando tabelas...")
Base.metadata.create_all(bind=engine)
print("   ✓ Tabelas criadas")

print("\n3. Listando tabelas criadas...")
for table_name in Base.metadata.tables.keys():
    print(f"   - {table_name}")

print("\n" + "=" * 60)
print("RESET CONCLUÍDO - Banco limpo e pronto para uso!")
print("=" * 60)
