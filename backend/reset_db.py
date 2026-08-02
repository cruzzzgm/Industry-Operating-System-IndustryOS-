import os
from app.db.database import init_database, SessionLocal
from app.models.financeiro import FinanceEntry
from app.models.customer import Customer
from app.models.order import Order

def reset_database():
    """Limpa todas as tabelas e executa o seed novamente."""
    print("=" * 60)
    print("RESET DO BANCO DE DADOS - IndustryOS")
    print("=" * 60)
    
    # Deletar arquivo do banco
    db_path = "data/industryos.db"
    if os.path.exists(db_path):
        os.remove(db_path)
        print(f"✓ Banco de dados {db_path} removido.")
    
    # Recriar tabelas
    print("\nRecriando tabelas...")
    init_database()
    print("✓ Tabelas recriadas.")
    
    # Executar seed
    print("\nExecutando seed...")
    from app.scripts.seed_data import seed_database
    seed_database()
    
    print("\n" + "=" * 60)
    print("✓ Reset concluído com sucesso!")
    print("=" * 60)

if __name__ == "__main__":
    reset_database()
