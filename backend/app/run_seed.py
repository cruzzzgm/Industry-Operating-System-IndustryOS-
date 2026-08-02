#!/usr/bin/env python3
import sys
sys.path.insert(0, '/app')

from app.db.database import SessionLocal, engine, Base
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.financeiro import FinanceEntry, FixedExpense, ContaPagar, ExternalRevenue
from app.scripts.seed_data import seed_database

# Create all tables
print("Criando tabelas...")
Base.metadata.create_all(bind=engine)

db = SessionLocal()

customers = db.query(Customer).count()
orders = db.query(Order).count()

print(f"Clientes: {customers}")
print(f"Pedidos: {orders}")

if customers == 0:
    print("\nBanco vazio! Executando seed...")
    try:
        seed_database()
        print("\n✓ Seed concluído com sucesso!")
        
        # Verify
        customers = db.query(Customer).count()
        orders = db.query(Order).count()
        finance = db.query(FinanceEntry).count()
        print(f"\nDados criados:")
        print(f"- Clientes: {customers}")
        print(f"- Pedidos: {orders}")
        print(f"- Finance Entries: {finance}")
    except Exception as e:
        print(f"\n✗ Erro no seed: {e}")
        import traceback
        traceback.print_exc()
else:
    print("\nBanco já tem dados. Pulando seed.")

db.close()
