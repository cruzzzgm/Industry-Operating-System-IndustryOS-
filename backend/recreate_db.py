"""
Script para recriar o banco de dados com todas as colunas novas.
Execute: python recreate_db.py
"""
import os
import sys

# Path do banco
DB_PATH = os.path.join(os.path.dirname(__file__), "app", "db", "industry_os.db")

print(f"🗑️  Deletando banco de dados: {DB_PATH}")

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print("✅ Banco deletado com sucesso!")
else:
    print("⚠️  Banco não encontrado (pode já ter sido deletado)")

print("\n🔄 Agora reinicie o backend com:")
print("   python -m uvicorn app.main:app --reload --port 8000")
print("\n📝 O banco será recriado automaticamente com todas as colunas novas!")
