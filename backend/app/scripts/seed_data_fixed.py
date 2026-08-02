# =============================================================================
# SCRIPT DE SEED - Dados Iniciais para Desenvolvimento
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: seed_data_fixed.py
# RESPONSABILIDADE: Popular banco de dados com dados mockados (versão corrigida)
#
# USO:
#   - Executado manualmente: python -m app.scripts.seed_data_fixed
#
# ATENÇÃO: Não executar em produção! Apenas para desenvolvimento/testes.
# =============================================================================

from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

# Database
from app.db.database import SessionLocal, init_database

# Models
from app.models.financeiro import FinanceEntry, FixedExpense, ContaPagar, MonthlyHistory, ExternalRevenue
from app.models.customer import Customer
from app.models.order import Order, OrderItem


# =============================================================================
# CONFIGURAÇÕES
# =============================================================================

# Seed para reprodutibilidade
random.seed(42)

# Período de dados (últimos 18 meses - para ter dados históricos completos)
MESES = [
    # 2024
    "2024-01", "2024-02", "2024-03", "2024-04", "2024-05", "2024-06",
    "2024-07", "2024-08", "2024-09", "2024-10", "2024-11", "2024-12",
    # 2025 - até o mês atual
    "2025-01", "2025-02", "2025-03", "2025-04"
]

# Dados atuais (mês corrente)
CURRENT_MONTH = "2025-04"

# Categorias
CATEGORIAS_RECEITA = ["Vendas", "Serviços", "Consultoria", "Licenciamento", "Aluguel", "Rendimentos"]
CATEGORIAS_DESPESA = ["Fornecedores", "Salários", "Operacional", "Marketing", "Impostos", "Infraestrutura", "Logística", "Manutenção"]

# Produtos para pedidos
PRODUTOS_ILHOS = [
    "Ilhós de Latão 17mm",
    "Ilhós de Alumínio 12mm",
    "Ilhós de Aço Inox 20mm",
    "Ilhós Reforçado 15mm",
    "Ilhós Industrial 25mm",
    "Ilhós para Lonas 30mm",
    "Ilhós Cromado 10mm",
    "Ilhós com Costura 18mm"
]

PRODUTOS_ARRUELAS = [
    "Arruela Lisa de Latão 17mm",
    "Arruela Lisa de Alumínio 12mm",
    "Arruela Dentada de Aço",
    "Arruela de Pressão Inox",
    "Arruela Vedação Borracha",
    "Arruela Ondulada Zincada",
    "Arruela Plástica Nylon",
    "Arruela Cobre Puro 20mm"
]

# Status de pedidos
STATUS_PEDIDOS = ["Pendente", "Em Produção", "Finalizado", "Aguardando Coleta", "Retirado", "Cancelado"]
STATUS_PESOS = [0.20, 0.25, 0.30, 0.15, 0.08, 0.02]  # Probabilidades


# =============================================================================
# FUNÇÕES AUXILIARES
# =============================================================================

def generate_id(prefix: str) -> str:
    """Gera ID único no formato PREFIX-YYYYMMDDHHMMSS-XXX."""
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    suffix = random.randint(100, 999)
    return f"{prefix}-{timestamp}-{suffix}"


def random_date(month: str) -> str:
    """Gera data aleatória dentro do mês."""
    year, mon = month.split("-")
    day = random.randint(1, 28)  # Evitar problemas com dias 29-31
    return f"{year}-{mon}-{day:02d}"


# =============================================================================
# SEED: CLIENTES
# =============================================================================

def seed_customers(db: Session) -> None:
    """Cria clientes de exemplo com CNPJs únicos."""
    print("Criando clientes...")
    
    customers_data = [
        {"name": "João Silva", "email": "joao@empresa1.com", "phone": "(11) 98765-4321", "company": "Empresa ABC Ltda", "cnpj": "11.111.111/0001-11", "address": "Rua A, 123 - Centro", "city": "São Paulo", "state": "SP", "segment": "Indústria"},
        {"name": "Maria Santos", "email": "maria@empresa2.com", "phone": "(21) 98765-4322", "company": "Comércio XYZ S.A.", "cnpj": "22.222.222/0001-22", "address": "Av. B, 456 - Bairro", "city": "Rio de Janeiro", "state": "RJ", "segment": "Varejo"},
        {"name": "Pedro Costa", "email": "pedro@empresa3.com", "phone": "(31) 98765-4323", "company": "Indústria 123 ME", "cnpj": "33.333.333/0001-33", "address": "Rua C, 789 - Industrial", "city": "Belo Horizonte", "state": "MG", "segment": "Indústria"},
        {"name": "Ana Oliveira", "email": "ana@metalurgica.com", "phone": "(11) 98765-4324", "company": "Metalúrgica Silva Ltda", "cnpj": "44.444.444/0001-44", "address": "Av. Industrial, 1000 - Distrito Industrial", "city": "São Paulo", "state": "SP", "segment": "Metalurgia"},
        {"name": "Carlos Mendes", "email": "carlos@construcao.com", "phone": "(19) 98765-4325", "company": "Construtora Horizonte S.A.", "cnpj": "55.555.555/0001-55", "address": "Rua das Obras, 500 - Centro", "city": "Campinas", "state": "SP", "segment": "Construção"},
        {"name": "Fernanda Lima", "email": "fernanda@moda.com", "phone": "(41) 98765-4326", "company": "Moda Express Ltda", "cnpj": "66.666.666/0001-66", "address": "Av. Fashion, 789 - Centro", "city": "Curitiba", "state": "PR", "segment": "Varejo"},
        {"name": "Ricardo Souza", "email": "ricardo@tech.com", "phone": "(51) 98765-4327", "company": "Tech Solutions S.A.", "cnpj": "77.777.777/0001-77", "address": "Rua da Inovação, 321 - Tech Park", "city": "Porto Alegre", "state": "RS", "segment": "Tecnologia"},
        {"name": "Juliana Ferreira", "email": "juliana@agro.com", "phone": "(62) 98765-4328", "company": "Agro Brasil Ltda", "cnpj": "88.888.888/0001-88", "address": "Rodovia GO-020, KM 15 - Zona Rural", "city": "Goiânia", "state": "GO", "segment": "Agronegócio"},
        {"name": "Marcelo Braga", "email": "marcelo@logistica.com", "phone": "(11) 98765-4329", "company": "Log Express Transportes", "cnpj": "99.999.999/0001-99", "address": "Av. dos Transportes, 2000 - Galpão 5", "city": "Guarulhos", "state": "SP", "segment": "Logística"},
        {"name": "Patrícia Almeida", "email": "patricia@alimentos.com", "phone": "(71) 98765-4330", "company": "Alimentos Premium S.A.", "cnpj": "12.345.678/0001-90", "address": "Rua do Comércio, 456 - Centro", "city": "Salvador", "state": "BA", "segment": "Alimentos"},
        {"name": "Roberto Nunes", "email": "roberto@automacao.com", "phone": "(48) 98765-4331", "company": "Automação Industrial Ltda", "cnpj": "23.456.789/0001-01", "address": "Av. das Máquinas, 789 - Pavilhão 3", "city": "Florianópolis", "state": "SC", "segment": "Indústria"},
        {"name": "Camila Rocha", "email": "camila@textil.com", "phone": "(85) 98765-4332", "company": "Têxtil Nordeste S.A.", "cnpj": "34.567.890/0001-12", "address": "Rua dos Tecidos, 100 - Distrito Têxtil", "city": "Fortaleza", "state": "CE", "segment": "Têxtil"},
        {"name": "Eduardo Martins", "email": "eduardo@plast.com", "phone": "(31) 98765-4333", "company": "Plásticos Minas Ltda", "cnpj": "45.678.901/0001-23", "address": "Av. das Indústrias, 1500", "city": "Contagem", "state": "MG", "segment": "Indústria"},
        {"name": "Luciana Dias", "email": "luciana@moveis.com", "phone": "(47) 98765-4334", "company": "Móveis Elegance", "cnpj": "56.789.012/0001-34", "address": "Rua do Móvel, 321 - Bairro Industrial", "city": "Joinville", "state": "SC", "segment": "Móveis"},
        {"name": "Gustavo Henrique", "email": "gustavo@eletrica.com", "phone": "(11) 98765-4335", "company": "Elétrica Potência S.A.", "cnpj": "67.890.123/0001-45", "address": "Av. Volts, 888 - Distrito Industrial", "city": "São Bernardo", "state": "SP", "segment": "Elétrica"},
        {"name": "Maria Souza", "email": "maria@souzacomercio.com", "phone": "(21) 99876-5432", "company": "Souza Comércio ME", "cnpj": "78.901.234/0001-56", "address": "Av. Principal, 456 - Bairro Novo", "city": "Rio de Janeiro", "state": "RJ", "segment": "Varejo"},
        {"name": "Carlos Ferreira", "email": "carlos@ferreiratec.com", "phone": "(31) 91234-5678", "company": "Ferreira Tech", "cnpj": "89.012.345/0001-67", "address": "Rua Tecnologia, 789 - Distrito Industrial", "city": "Belo Horizonte", "state": "MG", "segment": "Tecnologia"},
        {"name": "Bruno Carvalho", "email": "bruno@concretos.com", "phone": "(19) 97654-3210", "company": "Concretos Brasil S.A.", "cnpj": "90.123.456/0001-78", "address": "Av. das Pedreiras, 2000 - Distrito Industrial", "city": "Sorocaba", "state": "SP", "segment": "Construção"},
        {"name": "Amanda Costa", "email": "amanda@laticinios.com", "phone": "(41) 96543-2109", "company": "Laticínios Pinheiros", "cnpj": "01.234.567/0001-89", "address": "Rod. PR-151, KM 42 - Zona Rural", "city": "Londrina", "state": "PR", "segment": "Alimentos"},
    ]
    
    for data in customers_data:
        customer_id = generate_id("CLI")
        customer = Customer(
            id=customer_id,
            **data,
            last_order_date="2024-06-15",
            total_orders=random.randint(5, 20),
            total_spent=random.uniform(50000, 200000),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(customer)
    
    db.commit()
    print(f"  ✓ {len(customers_data)} clientes criados")


# =============================================================================
# SEED: PEDIDOS
# =============================================================================

def seed_orders(db: Session) -> None:
    """Cria pedidos de exemplo."""
    print("Criando pedidos...")
    
    orders_created = 0
    
    # Obter clientes para associar aos pedidos
    customers = db.query(Customer).all()
    if not customers:
        print("  ⚠ Nenhum cliente encontrado. Execute seed_customers primeiro.")
        return
    
    for month in MESES:
        # 5-8 pedidos por mês
        for _ in range(random.randint(5, 8)):
            order_id = generate_id("PED")
            customer = random.choice(customers)
            
            # Gerar itens do pedido
            num_items = random.randint(1, 4)
            items = []
            total_value = 0
            
            for i in range(num_items):
                # Misturar ilhós e arruelas
                is_ilho = random.choice([True, False])
                if is_ilho:
                    product = random.choice(PRODUTOS_ILHOS)
                    unit_price = random.uniform(5, 50)
                else:
                    product = random.choice(PRODUTOS_ARRUELAS)
                    unit_price = random.uniform(2, 25)
                
                quantity = random.randint(100, 2000)
                item_total = unit_price * quantity
                total_value += item_total
                
                items.append({
                    "description": product,
                    "ncmCode": f"{random.randint(1000, 9999)}.{random.randint(10, 99)}",
                    "unit": "UN",
                    "quantity": quantity,
                    "unitPrice": unit_price,
                    "totalPrice": item_total,
                    "weightPerUnit": random.uniform(0.1, 2.0)
                })
            
            order = Order(
                id=order_id,
                customer_id=customer.id,
                customer_name=customer.company,
                status=random.choice(STATUS_PEDIDOS),
                delivery_method=random.choice(["Retirada", "Transportadora"]),
                freight_responsibility=random.choice(["Remetente", "Destinatário"]),
                total_value=total_value,
                created_at=random_date(month),
                updated_at=datetime.utcnow(),
            )
            
            # Adicionar itens ao pedido
            for item in items:
                order_item = OrderItem(
                    id=generate_id("ITM"),
                    order_id=order.id,
                    **item
                )
                db.add(order_item)
            
            db.add(order)
            orders_created += 1
    
    db.commit()
    print(f"  ✓ {orders_created} pedidos criados")


# =============================================================================
# SEED: LANÇAMENTOS FINANCEIROS
# =============================================================================

def seed_finance_entries(db: Session) -> None:
    """Cria lançamentos financeiros de exemplo."""
    print("Criando lançamentos financeiros...")
    
    entries_created = 0
    
    for month in MESES:
        # Receitas do mês (5-8 lançamentos)
        for _ in range(random.randint(5, 8)):
            entry_id = generate_id("FIN")
            value = random.uniform(5000, 50000)
            due_date = random_date(month)
            paid = random.random() > 0.3  # 70% pagos
            
            entry = FinanceEntry(
                id=entry_id,
                description=f"Venda - {random.choice(['Produto A', 'Produto B', 'Serviço X'])}",
                entry_type="receita",
                value=round(value, 2),
                due_date=due_date,
                paid=paid,
                paid_at=due_date if paid else None,
                category=random.choice(CATEGORIAS_RECEITA),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(entry)
            entries_created += 1
        
        # Despesas do mês (3-6 lançamentos)
        for _ in range(random.randint(3, 6)):
            entry_id = generate_id("FIN")
            value = random.uniform(1000, 15000)
            due_date = random_date(month)
            paid = random.random() > 0.2  # 80% pagos
            
            entry = FinanceEntry(
                id=entry_id,
                description=f"Despesa - {random.choice(['Fornecedor X', 'Serviço Y', 'Material Z'])}",
                entry_type="despesa",
                value=round(value, 2),
                due_date=due_date,
                paid=paid,
                paid_at=due_date if paid else None,
                category=random.choice(CATEGORIAS_DESPESA),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(entry)
            entries_created += 1
    
    db.commit()
    print(f"  ✓ {entries_created} lançamentos financeiros criados")


# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================

def main():
    """Função principal que executa todos os seeds."""
    print("=" * 60)
    print("INDUSTRYOS - SEED DE DADOS INICIAIS")
    print("=" * 60)
    
    # Inicializar banco
    init_database()
    
    # Criar sessão
    db = SessionLocal()
    
    try:
        # Executar seeds na ordem correta
        seed_customers(db)
        seed_orders(db)
        seed_finance_entries(db)
        
        print("\n" + "=" * 60)
        print("✅ Seed de dados concluído com sucesso!")
        print("Banco de dados populado com dados de exemplo.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Erro durante o seed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()


# Compatibilidade com entrypoint.sh
seed_database = main
