# IndustryOS Backend - API REST Python

API RESTful em **Python (FastAPI)** para o Sistema de Gestão Industrial IndustryOS.

## 🏗️ Arquitetura

```
backend/
├── app/
│   ├── api/              # Endpoints REST (Routers)
│   │   └── routers/
│   │       ├── financeiro.py    # Módulo financeiro
│   │       └── health.py        # Health checks
│   ├── core/             # Configurações centrais
│   │   └── config.py     # Settings e variáveis de ambiente
│   ├── db/               # Database layer
│   │   └── database.py   # Conexão SQLAlchemy + SQLite
│   ├── models/           # Entidades ORM
│   │   ├── financeiro.py # FinanceEntry, FixedExpense, ContaPagar
│   │   ├── customer.py   # Cliente
│   │   └── order.py      # Pedido e Itens
│   ├── schemas/          # Validação Pydantic
│   │   └── financeiro.py # DTOs para API
│   ├── services/         # Lógica de negócio
│   │   └── financeiro_service.py  # Cálculos financeiros
│   └── main.py           # Aplicação FastAPI
├── data/                 # Persistência SQLite
├── docker-scripts/       # Scripts Docker
│   └── entrypoint.sh     # Inicialização
├── requirements.txt      # Dependências Python
└── Dockerfile            # Imagem Docker
```

## 🚀 Quick Start

### Via Docker Compose (Recomendado)

```bash
# Na raiz do projeto (onde está docker-compose.yml)
docker-compose up -d

# Backend disponível em: http://localhost:8000
# Documentação Swagger: http://localhost:8000/docs
```

### Desenvolvimento Local

```bash
# 1. Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# 2. Instalar dependências
cd backend
pip install -r requirements.txt

# 3. Inicializar banco
python -c "from app.db.database import init_database; init_database()"

# 4. Rodar aplicação
uvicorn app.main:app --reload --port 8000
```

## 📚 Endpoints API

### Health Check
- `GET /api/v1/health` - Status da aplicação
- `GET /api/v1/health/detailed` - Status com verificação de DB

### Módulo Financeiro

#### Lançamentos Financeiros (CRUD)
- `GET /api/v1/financeiro/entries` - Listar (com filtros avançados)
- `POST /api/v1/financeiro/entries` - Criar
- `GET /api/v1/financeiro/entries/{id}` - Obter
- `PATCH /api/v1/financeiro/entries/{id}` - Atualizar parcial
- `DELETE /api/v1/financeiro/entries/{id}` - Deletar

#### Despesas Fixas
- `GET /api/v1/financeiro/fixed-expenses` - Listar
- `POST /api/v1/financeiro/fixed-expenses` - Criar

#### Contas a Pagar
- `GET /api/v1/financeiro/contas-pagar` - Listar
- `POST /api/v1/financeiro/contas-pagar` - Criar

#### Relatórios
- `GET /api/v1/financeiro/summary` - Resumo financeiro do período
- `GET /api/v1/financeiro/categories` - Categorias disponíveis
- `GET /api/v1/financeiro/periods` - Períodos com dados

### Exemplos de Uso

#### Criar Lançamento Financeiro
```bash
curl -X POST http://localhost:8000/api/v1/financeiro/entries \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Venda Cliente XYZ",
    "entry_type": "receita",
    "value": 15000.00,
    "due_date": "2024-04-15",
    "paid": false,
    "category": "Vendas"
  }'
```

#### Listar com Filtros
```bash
# Receitas pagas de abril 2024
curl "http://localhost:8000/api/v1/financeiro/entries?entry_type=receita&paid=true&period=2024-04"
```

#### Obter Resumo Financeiro
```bash
curl "http://localhost:8000/api/v1/financeiro/summary?period=2024-04"
```

## 🧪 Testes

```bash
# Executar testes
pytest

# Com cobertura
pytest --cov=app --cov-report=html
```

## 🔧 Configuração

Variáveis de ambiente (`.env`):

```env
# Ambiente
ENVIRONMENT=development
DEBUG=true

# Banco de dados
DATABASE_URL=sqlite:///./data/industryos.db
DATABASE_ECHO=false

# Segurança (futuro)
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📝 Documentação

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI Schema**: http://localhost:8000/openapi.json

## 🐳 Docker

### Build manual
```bash
docker build -t industryos-backend .
docker run -p 8000:8000 -v ./data:/app/data industryos-backend
```

### Com Docker Compose
```bash
# Iniciar tudo (backend + frontend)
docker-compose up -d

# Ver logs
docker-compose logs -f backend

# Parar
docker-compose down
```

## 📦 Stack Tecnológico

- **FastAPI**: Framework web moderno e rápido
- **SQLAlchemy 2.0**: ORM para banco de dados
- **Pydantic**: Validação de dados e settings
- **SQLite**: Banco de dados local (futuro: PostgreSQL)
- **Uvicorn**: Servidor ASGI de alta performance
- **Alembic**: Migrations de banco (futuro)



## 📄 Licença

Proprietário - IndustryOS
