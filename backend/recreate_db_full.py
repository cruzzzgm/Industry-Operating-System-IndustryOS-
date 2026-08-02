"""
Script para recriar completamente o banco de dados.
Execute: python recreate_db_full.py
"""
import os
import sys

# Adicionar o diretório atual ao path para importar os módulos do app
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings

# Path do banco
if settings.DATABASE_IS_SQLITE:
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    db_path = os.path.join(os.path.dirname(__file__), db_path)
else:
    db_path = None

print(f"🗑️  Deletando banco de dados: {db_path}")

if db_path and os.path.exists(db_path):
    os.remove(db_path)
    print("✅ Banco deletado com sucesso!")
else:
    print("⚠️  Banco não encontrado ou não é SQLite")

print("\n🔄 Recriando tabelas...")

# Importar e criar tabelas
from app.db.database import engine, Base
from app.models.carrier import Carrier  # Importar para registrar o modelo
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.product import Product

# Criar todas as tabelas
Base.metadata.create_all(bind=engine)

print("✅ Tabelas recriadas com sucesso!")
print(f"✅ Tabela 'carriers' criada com todas as colunas (phone, email, website, etc.)")
print("\n📝 Agora você pode iniciar o backend normalmente:")
print("   python -m uvicorn app.main:app --reload --port 8000")
