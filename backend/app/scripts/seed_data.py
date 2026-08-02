# =============================================================================
# SCRIPT DE SEED - Dados Iniciais para Desenvolvimento
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: seed_data.py
# RESPONSABILIDADE: Popular banco de dados com dados mockados
#
# USO:
#   - Executado automaticamente pelo entrypoint.sh em desenvolvimento
#   - Pode ser executado manualmente: python -m app.scripts.seed_data
#
# ATENÇÃO: Não executar em produção! Apenas para desenvolvimento/testes.
#
# =============================================================================

from datetime import datetime, timedelta
import random
import uuid
from sqlalchemy.orm import Session

# Database
from app.db.database import SessionLocal, init_database

# Models
from app.models.customer import Customer
from app.models.order import Order, OrderItem
from app.models.financeiro import FinanceEntry, FixedExpense, ContaPagar, ExternalRevenue, MonthlyHistory
from app.models.notification import Notification, NotificationType, NotificationPriority


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
    # 2025
    "2025-01", "2025-02", "2025-03", "2025-04", "2025-05", "2025-06",
    "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12",
    # 2026
    "2026-01", "2026-02", "2026-03", "2026-04",
]

# Dados atuais (mês corrente)
CURRENT_MONTH = "2026-04"

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
    """Gera ID único no formato PREFIX-UUID."""
    return f"{prefix}-{str(uuid.uuid4())}"


def random_date(month: str) -> str:
    """Gera data aleatória dentro do mês."""
    year, mon = month.split("-")
    day = random.randint(1, 28)  # Evitar problemas com dias 29-31
    return f"{year}-{mon}-{day:02d}"


# =============================================================================
# SEED: CLIENTES
# =============================================================================

def seed_customers(db: Session) -> None:
    """Cria clientes de exemplo."""
    print("Criando clientes...")
    
    customers_data = [
        {"name": "João Silva", "email": "joao@metalurgica.com", "phone": "(11) 98765-4321", "company": "Metalúrgica Silva Ltda", "cnpj": "12.345.678/0001-90", "address": "Av. Industrial, 1234 - Distrito Industrial", "city": "São Paulo", "state": "SP", "segment": "Indústria"},
        {"name": "Maria Santos", "email": "maria@caldeiraria.com", "phone": "(21) 97654-3210", "company": "Caldeiraria Santos", "cnpj": "23.456.789/0001-10", "address": "Rua das Indústrias, 567 - Centro Industrial", "city": "Rio de Janeiro", "state": "RJ", "segment": "Indústria"},
        {"name": "Pedro Oliveira", "email": "pedro@construcoes.com", "phone": "(31) 96543-2109", "company": "Construções Oliveira", "cnpj": "34.567.890/0001-20", "address": "Av. das Construções, 890 - Zona Industrial", "city": "Belo Horizonte", "state": "MG", "segment": "Construção"},
        {"name": "Ana Costa", "email": "ana@moveis.com", "phone": "(41) 95432-1098", "company": "Móveis Costa", "cnpj": "45.678.901/0001-30", "address": "Rod. BR-277, KM 42 - Distrito Industrial", "city": "Curitiba", "state": "PR", "segment": "Móveis"},
        {"name": "Carlos Ferreira", "email": "carlos@automotiva.com", "phone": "(51) 94321-0987", "company": "Peças Automotivas Ferreira", "cnpj": "56.789.012/0001-40", "address": "Av. das Indústrias, 234 - Parque Industrial", "city": "Porto Alegre", "state": "RS", "segment": "Automotivo"},
        {"name": "Lucia Mendes", "email": "lucia@textil.com", "phone": "(61) 93210-9876", "company": "Têxtil Mendes", "cnpj": "67.890.123/0001-50", "address": "Quadra 5, Lote 23 - Setor Industrial", "city": "Brasília", "state": "DF", "segment": "Têxtil"},
        {"name": "Roberto Almeida", "email": "roberto@eletrica.com", "phone": "(71) 92109-8765", "company": "Elétrica Almeida", "cnpj": "78.901.234/0001-60", "address": "Av. Paralela, 1500 - Centro Industrial", "city": "Salvador", "state": "BA", "segment": "Elétrica"},
        {"name": "Fernanda Lima", "email": "fernanda@plasticos.com", "phone": "(81) 91098-7654", "company": "Plásticos Lima", "cnpj": "89.012.345/0001-70", "address": "Av. Industrial, 456 - Distrito Industrial", "city": "Recife", "state": "PE", "segment": "Plásticos"},
        {"name": "Ricardo Souza", "email": "ricardo@alimentos.com", "phone": "(92) 98765-6543", "company": "Alimentos Souza", "cnpj": "90.123.456/0001-80", "address": "Rod. AM-010, KM 15 - Zona Industrial", "city": "Manaus", "state": "AM", "segment": "Alimentos"},
        {"name": "Juliana Rocha", "email": "juliana@quimica.com", "phone": "(85) 97654-5432", "company": "Química Rocha", "cnpj": "01.234.567/0001-90", "address": "Av. das Indústrias, 789 - Pici", "city": "Fortaleza", "state": "CE", "segment": "Química"},
        {"name": "Marcos Pereira", "email": "marcos@metalurgica.com", "phone": "(27) 96543-4321", "company": "Metalúrgica Pereira", "cnpj": "12.345.678/0002-00", "address": "Rod. BR-101, KM 50 - Distrito Industrial", "city": "Vitória", "state": "ES", "segment": "Indústria"},
        {"name": "Patricia Castro", "email": "patricia@moveis.com", "phone": "(31) 95432-3210", "company": "Móveis Castro", "cnpj": "23.456.789/0002-10", "address": "Av. Contorno, 2000 - Centro Industrial", "city": "Belo Horizonte", "state": "MG", "segment": "Móveis"},
        {"name": "André Santos", "email": "andre@construcoes.com", "phone": "(11) 94321-2109", "company": "Construções Santos", "cnpj": "35.678.901/0002-20", "address": "Marginal Pinheiros, 1500 - Industrial", "city": "São Paulo", "state": "SP", "segment": "Construção"},
        {"name": "Carla Dias", "email": "carla@automotiva.com", "phone": "(21) 93210-1098", "company": "Peças Automotivas Dias", "cnpj": "46.789.012/0002-30", "address": "Av. Brasil, 5678 - Industrial", "city": "Rio de Janeiro", "state": "RJ", "segment": "Automotivo"},
        {"name": "Eduardo Martins", "email": "eduardo@plast.com", "phone": "(31) 98765-4333", "company": "Plásticos Minas Ltda", "cnpj": "34.567.890/0002-20", "address": "Av. das Indústrias, 1500", "city": "Contagem", "state": "MG", "segment": "Indústria"},
        {"name": "Luciana Dias", "email": "luciana@moveis.com", "phone": "(47) 98765-4334", "company": "Móveis Elegance", "cnpj": "45.678.901/0002-30", "address": "Rua do Móvel, 321 - Bairro Industrial", "city": "Joinville", "state": "SC", "segment": "Móveis"},
        {"name": "Gustavo Henrique", "email": "gustavo@eletrica.com", "phone": "(11) 98765-4335", "company": "Elétrica Potência S.A.", "cnpj": "56.789.012/0002-40", "address": "Av. Volts, 888 - Distrito Industrial", "city": "São Bernardo", "state": "SP", "segment": "Elétrica"},
        {"name": "Maria Souza", "email": "maria@souzacomercio.com", "phone": "(21) 99876-5432", "company": "Souza Comércio ME", "cnpj": "98.765.432/0001-10", "address": "Av. Principal, 456 - Bairro Novo", "city": "Rio de Janeiro", "state": "RJ", "segment": "Varejo"},
        {"name": "Carlos Ferreira", "email": "carlos@ferreiratec.com", "phone": "(31) 91234-5678", "company": "Ferreira Tech", "cnpj": "45.678.901/0003-30", "address": "Rua Tecnologia, 789 - Distrito Industrial", "city": "Belo Horizonte", "state": "MG", "segment": "Tecnologia"},
        {"name": "Bruno Carvalho", "email": "bruno@concretos.com", "phone": "(19) 97654-3210", "company": "Concretos Brasil S.A.", "cnpj": "67.890.123/0003-50", "address": "Av. das Pedreiras, 2000 - Distrito Industrial", "city": "Sorocaba", "state": "SP", "segment": "Construção"},
        {"name": "Amanda Costa", "email": "amanda@laticinios.com", "phone": "(41) 96543-2109", "company": "Laticínios Pinheiros", "cnpj": "78.901.234/0003-60", "address": "Rod. PR-151, KM 42 - Zona Rural", "city": "Londrina", "state": "PR", "segment": "Alimentos"},
        {"name": "Fernando Lima", "email": "fernando@logistica.com", "phone": "(11) 91234-5679", "company": "Logística Express", "cnpj": "12.345.678/0003-10", "address": "Av. dos Transportes, 500", "city": "São Paulo", "state": "SP", "segment": "Logística"},
    ]
    
    for data in customers_data:
        customer = Customer(
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
    print(f"  ✓ {entries_created} lançamentos criados")


# =============================================================================
# SEED: DESPESAS FIXAS
# =============================================================================

def seed_fixed_expenses(db: Session) -> None:
    """Cria despesas fixas mensais."""
    print("Criando despesas fixas...")
    
    expenses_data = [
        {"name": "Aluguel Escritório", "value": 3500, "day": 10, "cat": "Fixas"},
        {"name": "Internet Fibra", "value": 250, "day": 5, "cat": "Operacional"},
        {"name": "Salário Designer", "value": 5000, "day": 5, "cat": "Pessoal"},
        {"name": "Software ERP", "value": 800, "day": 15, "cat": "Operacional"},
        {"name": "Contador", "value": 1200, "day": 10, "cat": "Fixas"},
    ]
    
    for data in expenses_data:
        expense_id = generate_id("EXP")
        expense = FixedExpense(
            id=expense_id,
            name=data["name"],
            category=data["cat"],
            estimated_value=data["value"],
            due_day=data["day"],
            active=True,
            created_at=datetime.utcnow(),
        )
        db.add(expense)
    
    db.commit()
    print(f"  ✓ {len(expenses_data)} despesas fixas criadas")


# =============================================================================
# SEED: CONTAS A PAGAR
# =============================================================================

def seed_contas_pagar(db: Session) -> None:
    """Cria contas a pagar baseadas nas despesas fixas."""
    print("Criando contas a pagar...")
    
    # Buscar despesas fixas
    fixed_expenses = db.query(FixedExpense).all()
    contas_created = 0
    
    for month in MESES:
        for expense in fixed_expenses:
            conta_id = generate_id("CP")
            due_date = f"{month}-{expense.due_day:02d}"
            paid = random.random() > 0.4  # 60% pagos
            
            conta = ContaPagar(
                id=conta_id,
                fixed_expense_id=expense.id,
                description=f"{expense.name} - {month}",
                category=expense.category,
                value=expense.estimated_value,
                due_date=due_date,
                month=month,
                paid=paid,
                paid_at=due_date if paid else None,
                is_fixed=True,
                created_at=datetime.utcnow(),
            )
            db.add(conta)
            contas_created += 1
    
    db.commit()
    print(f"  ✓ {contas_created} contas a pagar criadas")


# =============================================================================
# SEED: PEDIDOS
# =============================================================================

def seed_orders(db: Session) -> None:
    """Cria pedidos de exemplo com produtos variados."""
    print("Criando pedidos...")
    
    # Buscar clientes
    customers = db.query(Customer).all()
    if not customers:
        print("  ✗ Nenhum cliente encontrado, pulando pedidos")
        return
    
    orders_created = 0
    items_created = 0
    
    # Pesos para status (mais pedidos finalizados e em produção)
    status_choices = STATUS_PEDIDOS
    status_weights = STATUS_PESOS
    
    for month in MESES:
        # Mais pedidos por mês (5-12 pedidos por mês)
        for _ in range(random.randint(5, 12)):
            customer = random.choice(customers)
            
            # Escolher tipo de produto principal
            tipo_produto = random.choice(["ilhos", "arruela", "misto"])
            
            items = []
            total_value = 0
            total_quantity = 0
            
            if tipo_produto == "ilhos":
                # 1-4 tipos de ilhós
                produtos_escolhidos = random.sample(PRODUTOS_ILHOS, random.randint(1, min(4, len(PRODUTOS_ILHOS))))
                for produto in produtos_escolhidos:
                    qtd = random.randint(50, 1000)
                    preco_unit = round(random.uniform(0.15, 2.50), 2)
                    item = OrderItem(
                        description=produto,
                        ncm_code=random.choice(["8308.10.00", "8308.90.00"]),
                        unit="UN",
                        quantity=qtd,
                        unit_price=preco_unit,
                        total_price=round(qtd * preco_unit, 2),
                    )
                    items.append(item)
                    total_value += item.total_price
                    total_quantity += qtd
                    
            elif tipo_produto == "arruela":
                # 1-4 tipos de arruelas
                produtos_escolhidos = random.sample(PRODUTOS_ARRUELAS, random.randint(1, min(4, len(PRODUTOS_ARRUELAS))))
                for produto in produtos_escolhidos:
                    qtd = random.randint(100, 2000)
                    preco_unit = round(random.uniform(0.08, 1.80), 2)
                    item = OrderItem(
                        description=produto,
                        ncm_code=random.choice(["7318.22.00", "7326.90.00"]),
                        unit="UN",
                        quantity=qtd,
                        unit_price=preco_unit,
                        total_price=round(qtd * preco_unit, 2),
                    )
                    items.append(item)
                    total_value += item.total_price
                    total_quantity += qtd
                    
            else:  # misto
                # Mistura de ilhós e arruelas
                produtos_ilhos = random.sample(PRODUTOS_ILHOS, random.randint(1, 2))
                produtos_arruelas = random.sample(PRODUTOS_ARRUELAS, random.randint(1, 2))
                
                for produto in produtos_ilhos:
                    qtd = random.randint(50, 500)
                    preco_unit = round(random.uniform(0.15, 2.50), 2)
                    item = OrderItem(
                        description=produto,
                        ncm_code="8308.10.00",
                        unit="UN",
                        quantity=qtd,
                        unit_price=preco_unit,
                        total_price=round(qtd * preco_unit, 2),
                    )
                    items.append(item)
                    total_value += item.total_price
                    total_quantity += qtd
                    
                for produto in produtos_arruelas:
                    qtd = random.randint(100, 1000)
                    preco_unit = round(random.uniform(0.08, 1.80), 2)
                    item = OrderItem(
                        description=produto,
                        ncm_code="7318.22.00",
                        unit="UN",
                        quantity=qtd,
                        unit_price=preco_unit,
                        total_price=round(qtd * preco_unit, 2),
                    )
                    items.append(item)
                    total_value += item.total_price
                    total_quantity += qtd
            
            # Dia aleatório do mês
            day = random.randint(1, 28)
            
            # Status com distribuição realista
            status = random.choices(status_choices, weights=status_weights)[0]
            
            # Nota fiscal (mais comum em pedidos finalizados)
            has_recibo = random.random() < (0.7 if status == "Finalizado" else 0.4)
            
            order = Order(
                customer_id=customer.id,
                customer_name=customer.company,
                product=items[0].description if items else "Venda diversa",
                quantity=total_quantity,
                total_value=round(total_value, 2),
                status=status,
                delivery_method=random.choice(["Retirada", "Transportadora"]),
                has_recibo=has_recibo,
                recibo_number=f"NF-{random.randint(10000, 99999)}" if has_recibo else None,
                carrier_name=random.choice(["Correios", "Jadlog", "Total Express", "DHL"]) if has_recibo and random.random() > 0.5 else None,
                gross_weight=round(total_quantity * 0.05, 2),  # aprox 50g por unidade
                created_at=f"{month}-{day:02d} 10:{random.randint(0,59):02d}:00",
                updated_at=f"{month}-{day:02d} 10:{random.randint(0,59):02d}:00",
                items=items,
            )
            
            # Calcular impostos automaticamente para pedidos com NF
            if order.has_recibo:
                order.calculate_taxes()
            
            db.add(order)
            orders_created += 1
            items_created += len(items)
    
    db.commit()
    print(f"  ✓ {orders_created} pedidos criados")
    print(f"  ✓ {items_created} itens de pedido criados")


# =============================================================================
# SEED: RECEITAS EXTERNAS
# =============================================================================

def seed_external_revenues(db: Session) -> None:
    """Cria receitas externas (aluguel, rendimentos, etc)."""
    print("Criando receitas externas...")
    
    # Fontes de receita externa
    sources = ["Aluguel", "Rendimento", "Reembolso", "Outro"]
    
    revenues_created = 0
    
    for month in MESES:
        # 2-4 receitas externas por mês
        for _ in range(random.randint(2, 4)):
            source = random.choice(sources)
            value = random.uniform(1500, 8000)
            due_date = random_date(month)
            payment_status = "paid" if random.random() > 0.3 else "pending"  # 70% pagos
            paid_at = None
            
            if payment_status == "paid":
                # Data de pagamento entre a data de vencimento e o fim do mês
                due_dt = datetime.strptime(due_date, "%Y-%m-%d")
                year, month_num = map(int, month.split("-"))
                if month_num == 12:
                    month_end = datetime(year + 1, 1, 1) - timedelta(days=1)
                else:
                    month_end = datetime(year, month_num + 1, 1) - timedelta(days=1)
                paid_at = due_dt + timedelta(days=random.randint(0, (month_end - due_dt).days))
            
            revenue = ExternalRevenue(
                id=generate_id("REV"),
                source=source,
                description=f"Receita de {source} - {month}",
                value=round(value, 2),
                due_date=due_date,
                payment_status=payment_status,
                paid_at=paid_at,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            
            db.add(revenue)
            revenues_created += 1
    
    db.commit()
    print(f"  ✓ {revenues_created} receitas externas criadas")


# =============================================================================
# SEED: PRODUTOS
# =============================================================================

def seed_products(db: Session) -> None:
    """Cria produtos de exemplo."""
    print("Criando produtos...")
    
    from app.models.product import Product
    
    products_data = [
        {
            "code": "ILH-LAT-17",
            "name": "Ilhós de Latão 17mm",
            "description": "Ilhós de latão para aplicação em couro e tecido",
            "ncm_code": "8308.10.00",
            "category": "Ilhós",
            "subcategory": "Latão",
            "cost_price": 0.50,
            "sale_price": 1.20,
            "min_sale_price": 0.80,
            "stock_quantity": 5000,
            "min_stock": 500,
            "unit": "UN",
            "weight_kg": 0.05,
            "is_active": True,
            "is_featured": True,
        },
        {
            "code": "ILH-ALU-12",
            "name": "Ilhós de Alumínio 12mm",
            "description": "Ilhós de alumínio leve para materiais finos",
            "ncm_code": "8308.10.00",
            "category": "Ilhós",
            "subcategory": "Alumínio",
            "cost_price": 0.30,
            "sale_price": 0.90,
            "min_sale_price": 0.60,
            "stock_quantity": 8000,
            "min_stock": 800,
            "unit": "UN",
            "weight_kg": 0.03,
            "is_active": True,
            "is_featured": False,
        },
        {
            "code": "ILH-INOX-20",
            "name": "Ilhós de Aço Inox 20mm",
            "description": "Ilhós de aço inoxidável para aplicações marítimas",
            "ncm_code": "8308.10.00",
            "category": "Ilhós",
            "subcategory": "Inox",
            "cost_price": 0.80,
            "sale_price": 2.50,
            "min_sale_price": 1.50,
            "stock_quantity": 2000,
            "min_stock": 300,
            "unit": "UN",
            "weight_kg": 0.08,
            "is_active": True,
            "is_featured": True,
        },
        {
            "code": "ARR-LIS-ALU-12",
            "name": "Arruela Lisa de Alumínio 12mm",
            "description": "Arruela lisa de alumínio para fixação",
            "ncm_code": "7318.22.00",
            "category": "Arruelas",
            "subcategory": "Lisa",
            "cost_price": 0.15,
            "sale_price": 0.50,
            "min_sale_price": 0.30,
            "stock_quantity": 15000,
            "min_stock": 2000,
            "unit": "UN",
            "weight_kg": 0.01,
            "is_active": True,
            "is_featured": False,
        },
        {
            "code": "ARR-LOK-AZ-10",
            "name": "Arruela de Pressão Aço Zincado 10mm",
            "description": "Arruela de pressão zincada para alta resistência",
            "ncm_code": "7318.22.00",
            "category": "Arruelas",
            "subcategory": "Pressão",
            "cost_price": 0.20,
            "sale_price": 0.70,
            "min_sale_price": 0.40,
            "stock_quantity": 12000,
            "min_stock": 1500,
            "unit": "UN",
            "weight_kg": 0.015,
            "is_active": True,
            "is_featured": False,
        },
        {
            "code": "PAR-FEND-M6",
            "name": "Parafuso Fenda M6x20",
            "description": "Parafuso com fenda para madeira",
            "ncm_code": "7318.15.00",
            "category": "Parafusos",
            "subcategory": "Madeira",
            "cost_price": 0.10,
            "sale_price": 0.35,
            "min_sale_price": 0.20,
            "stock_quantity": 25000,
            "min_stock": 3000,
            "unit": "UN",
            "weight_kg": 0.008,
            "is_active": True,
            "is_featured": False,
        },
        {
            "code": "PAR-PHX-M8",
            "name": "Parafuso Phillips M8x30",
            "description": "Parafuso Phillips para metal",
            "ncm_code": "7318.15.00",
            "category": "Parafusos",
            "subcategory": "Metal",
            "cost_price": 0.15,
            "sale_price": 0.50,
            "min_sale_price": 0.30,
            "stock_quantity": 20000,
            "min_stock": 2500,
            "unit": "UN",
            "weight_kg": 0.012,
            "is_active": True,
            "is_featured": False,
        },
        {
            "code": "POR-HEX-M10",
            "name": "Porca Hexagonal M10",
            "description": "Porca hexagonal zincada",
            "ncm_code": "7318.16.00",
            "category": "Porcas",
            "subcategory": "Hexagonal",
            "cost_price": 0.12,
            "sale_price": 0.40,
            "min_sale_price": 0.25,
            "stock_quantity": 30000,
            "min_stock": 4000,
            "unit": "UN",
            "weight_kg": 0.01,
            "is_active": True,
            "is_featured": False,
        },
        {
            "code": "POR-NYLO-M8",
            "name": "Porca Nylon M8",
            "description": "Porca nylon autotravante",
            "ncm_code": "7318.16.00",
            "category": "Porcas",
            "subcategory": "Nylon",
            "cost_price": 0.18,
            "sale_price": 0.60,
            "min_sale_price": 0.35,
            "stock_quantity": 15000,
            "min_stock": 2000,
            "unit": "UN",
            "weight_kg": 0.005,
            "is_active": True,
            "is_featured": False,
        },
        {
            "code": "REB-TUB-3",
            "name": "Rebite Tubular 3mm",
            "description": "Rebite tubular para montagem",
            "ncm_code": "7318.24.00",
            "category": "Rebites",
            "subcategory": "Tubular",
            "cost_price": 0.08,
            "sale_price": 0.25,
            "min_sale_price": 0.15,
            "stock_quantity": 40000,
            "min_stock": 5000,
            "unit": "UN",
            "weight_kg": 0.003,
            "is_active": True,
            "is_featured": False,
        },
    ]
    
    products_created = 0
    for product_data in products_data:
        existing = db.query(Product).filter(Product.code == product_data["code"]).first()
        if not existing:
            product = Product(**product_data)
            db.add(product)
            products_created += 1
    
    db.commit()
    print(f"  ✓ {products_created} produtos criados")


# =============================================================================
# SEED: ATUALIZAR ESTATÍSTICAS DOS CLIENTES
# =============================================================================

def update_customer_stats(db: Session) -> None:
    """Atualiza estatísticas dos clientes baseado nos pedidos criados."""
    print("Atualizando estatísticas dos clientes...")
    
    customers = db.query(Customer).all()
    updated = 0
    
    for customer in customers:
        # Buscar pedidos do cliente
        orders = db.query(Order).filter(Order.customer_id == customer.id).all()
        
        if orders:
            # Atualizar estatísticas
            customer.total_orders = len(orders)
            customer.total_spent = sum(o.total_value for o in orders)
            
            # Último pedido
            last_order = max(orders, key=lambda o: o.created_at)
            customer.last_order_date = last_order.created_at.split()[0] if last_order.created_at else None
            
            # ICMS credit (20% dos pedidos com NF)
            orders_with_nf = [o for o in orders if o.has_recibo]
            customer.icms_credit = sum(o.icms_credit or 0 for o in orders_with_nf)
            
            updated += 1
    
    db.commit()
    print(f"  ✓ {updated} clientes atualizados")


# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================

def seed_notifications(db: Session) -> None:
    """Cria notificações de exemplo."""
    print("Criando notificações...")
    
    notifications_data = [
        {
            "title": "Novo pedido recebido",
            "message": "Pedido #246 recebido de Metalúrgica Silva",
            "notification_type": NotificationType.ORDER_CREATED,
            "priority": NotificationPriority.HIGH,
            "icon": "ShoppingCart",
            "color": "blue",
            "entity_type": "order",
            "entity_id": "246",
            "action_url": "/orders",
            "action_text": "Ver pedido"
        },
        {
            "title": "Status atualizado",
            "message": "Pedido #245 foi para produção",
            "notification_type": NotificationType.ORDER_STATUS_CHANGED,
            "priority": NotificationPriority.MEDIUM,
            "icon": "Activity",
            "color": "green",
            "entity_type": "order",
            "entity_id": "245",
            "action_url": "/orders",
            "action_text": "Ver detalhes"
        },
        {
            "title": "Pagamento recebido",
            "message": "Receita de R$ 15.000,00 confirmada",
            "notification_type": NotificationType.PAYMENT_RECEIVED,
            "priority": NotificationPriority.HIGH,
            "icon": "DollarSign",
            "color": "green",
            "entity_type": "finance",
            "entity_id": None,
            "action_url": "/finance",
            "action_text": "Ver financeiro"
        },
        {
            "title": "Estoque baixo",
            "message": "Ilhós Nº 51 abaixo do mínimo (50 unidades)",
            "notification_type": NotificationType.STOCK_LOW,
            "priority": NotificationPriority.MEDIUM,
            "icon": "AlertTriangle",
            "color": "yellow",
            "entity_type": "product",
            "entity_id": "1",
            "action_url": "/products",
            "action_text": "Ver produtos"
        },
        {
            "title": "Pedido finalizado",
            "message": "Pedido #244 finalizado com sucesso",
            "notification_type": NotificationType.ORDER_COMPLETED,
            "priority": NotificationPriority.LOW,
            "icon": "CheckCircle",
            "color": "green",
            "entity_type": "order",
            "entity_id": "244",
            "action_url": "/orders",
            "action_text": "Ver pedido"
        },
        {
            "title": "Pagamento em atraso",
            "message": "Conta #123 vencida há 5 dias",
            "notification_type": NotificationType.PAYMENT_OVERDUE,
            "priority": NotificationPriority.URGENT,
            "icon": "AlertCircle",
            "color": "red",
            "entity_type": "finance",
            "entity_id": "123",
            "action_url": "/finance",
            "action_text": "Ver conta"
        },
        {
            "title": "Sistema",
            "message": "Backup do banco de dados concluído",
            "notification_type": NotificationType.SYSTEM,
            "priority": NotificationPriority.LOW,
            "icon": "Database",
            "color": "blue",
            "entity_type": None,
            "entity_id": None,
            "action_url": None,
            "action_text": None
        },
        {
            "title": "Lembrete",
            "message": "Reunião com fornecedor às 14:00",
            "notification_type": NotificationType.REMINDER,
            "priority": NotificationPriority.MEDIUM,
            "icon": "Calendar",
            "color": "purple",
            "entity_type": None,
            "entity_id": None,
            "action_url": None,
            "action_text": None
        },
        {
            "title": "Pedido cancelado",
            "message": "Pedido #243 cancelado pelo cliente",
            "notification_type": NotificationType.ORDER_CANCELLED,
            "priority": NotificationPriority.MEDIUM,
            "icon": "XCircle",
            "color": "red",
            "entity_type": "order",
            "entity_id": "243",
            "action_url": "/orders",
            "action_text": "Ver pedido"
        },
        {
            "title": "Estoque esgotado",
            "message": "Arruela M8 esgotada",
            "notification_type": NotificationType.STOCK_OUT,
            "priority": NotificationPriority.URGENT,
            "icon": "X",
            "color": "red",
            "entity_type": "product",
            "entity_id": "2",
            "action_url": "/products",
            "action_text": "Repor estoque"
        },
        {
            "title": "Aniversário de cliente",
            "message": "Metalúrgica Silva completa 5 anos",
            "notification_type": NotificationType.CUSTOMER_ANNIVERSARY,
            "priority": NotificationPriority.LOW,
            "icon": "Cake",
            "color": "purple",
            "entity_type": "customer",
            "entity_id": "1",
            "action_url": "/customers",
            "action_text": "Ver cliente"
        },
        {
            "title": "Novo pedido recebido",
            "message": "Pedido #247 recebido de TechParts Global",
            "notification_type": NotificationType.ORDER_CREATED,
            "priority": NotificationPriority.HIGH,
            "icon": "ShoppingCart",
            "color": "blue",
            "entity_type": "order",
            "entity_id": "247",
            "action_url": "/orders",
            "action_text": "Ver pedido"
        },
        {
            "title": "Status atualizado",
            "message": "Pedido #246 aguardando coleta",
            "notification_type": NotificationType.ORDER_STATUS_CHANGED,
            "priority": NotificationPriority.MEDIUM,
            "icon": "Package",
            "color": "orange",
            "entity_type": "order",
            "entity_id": "246",
            "action_url": "/orders",
            "action_text": "Ver detalhes"
        },
        {
            "title": "Pagamento recebido",
            "message": "Receita de R$ 8.500,00 confirmada",
            "notification_type": NotificationType.PAYMENT_RECEIVED,
            "priority": NotificationPriority.HIGH,
            "icon": "DollarSign",
            "color": "green",
            "entity_type": "finance",
            "entity_id": None,
            "action_url": "/finance",
            "action_text": "Ver financeiro"
        },
        {
            "title": "Pedido finalizado",
            "message": "Pedido #247 finalizado com sucesso",
            "notification_type": NotificationType.ORDER_COMPLETED,
            "priority": NotificationPriority.LOW,
            "icon": "CheckCircle",
            "color": "green",
            "entity_type": "order",
            "entity_id": "247",
            "action_url": "/orders",
            "action_text": "Ver pedido"
        },
        {
            "title": "Sistema",
            "message": "Atualização do sistema disponível",
            "notification_type": NotificationType.SYSTEM,
            "priority": NotificationPriority.LOW,
            "icon": "RefreshCw",
            "color": "blue",
            "entity_type": None,
            "entity_id": None,
            "action_url": None,
            "action_text": None
        },
    ]
    
    for data in notifications_data:
        notification = Notification(
            **data,
            is_read=False,
            read_at=None,
            created_at=datetime.utcnow() - timedelta(hours=random.randint(0, 72))
        )
        db.add(notification)
    
    db.commit()
    print(f"  ✓ {len(notifications_data)} notificações criadas")


def seed_database():
    """
    Executa todos os seeds para popular o banco de dados.
    
    Esta função é chamada automaticamente pelo entrypoint.sh
    quando o banco está vazio (ambiente de desenvolvimento).
    """
    print("=" * 60)
    print("SEED DE DADOS - IndustryOS")
    print("=" * 60)
    
    # Inicializar banco
    init_database()
    
    # Criar sessão
    db = SessionLocal()
    
    try:
        # Verificar se já existem dados
        existing = db.query(FinanceEntry).first()
        if existing:
            print("\nBanco de dados já possui dados. Pulando seed.")
            return
        
        # Executar seeds
        seed_customers(db)
        seed_finance_entries(db)
        seed_fixed_expenses(db)
        seed_contas_pagar(db)
        seed_products(db)
        seed_orders(db)
        seed_external_revenues(db)
        seed_notifications(db)
        update_customer_stats(db)
        
        print("\n" + "=" * 60)
        print("✓ Seed concluído com sucesso!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Erro durante seed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


# =============================================================================
# ENTRY POINT
# =============================================================================

if __name__ == "__main__":
    seed_database()
