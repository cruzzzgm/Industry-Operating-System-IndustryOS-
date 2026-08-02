#!/bin/bash
# =============================================================================
# ENTRYPOINT SCRIPT - Inicialização do Backend IndustryOS
# =============================================================================
# 
# RESPONSABILIDADES:
# 1. Criar diretório de dados se não existir
# 2. Executar migrations do banco de dados (Alembic)
# 3. Verificar conexão com banco de dados
# 4. Inicializar dados mock se banco estiver vazio (desenvolvimento)
# 5. Iniciar aplicação FastAPI
#
# USO:
#   entrypoint.sh [comando]
#   entrypoint.sh uvicorn app.main:app --host 0.0.0.0 --port 8000
#
# =============================================================================

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# =============================================================================
# 1. CONFIGURAÇÃO INICIAL
# =============================================================================
log_info "Iniciando IndustryOS Backend..."
log_info "Ambiente: ${ENVIRONMENT:-development}"

# Criar diretório de dados com permissões corretas
if [ ! -d "/app/data" ]; then
    log_info "Criando diretório de dados..."
    mkdir -p /app/data
fi

# Verificar permissões de escrita
if [ ! -w "/app/data" ]; then
    log_error "Sem permissão de escrita em /app/data"
    exit 1
fi

# =============================================================================
# 2. MIGRAÇÕES DO BANCO DE DADOS (Futuro - Alembic)
# =============================================================================
# Nota: Por enquanto usando SQLAlchemy create_all()
# Futuro: alembic upgrade head

log_info "Verificando banco de dados..."

# Criar tabelas se não existirem (via script Python)
python << PYTHON_EOF
import sys
sys.path.insert(0, '/app')

from app.db.database import engine, Base
from app.models.financeiro import FinanceEntry, FixedExpense, ContaPagar, MonthlyHistory
from app.models.order import Order, OrderItem
from app.models.customer import Customer

try:
    print("[INFO] Criando tabelas no banco de dados...")
    Base.metadata.create_all(bind=engine)
    print("[SUCCESS] Tabelas criadas com sucesso!")
except Exception as e:
    print(f"[ERROR] Falha ao criar tabelas: {e}")
    sys.exit(1)
PYTHON_EOF

if [ $? -ne 0 ]; then
    log_error "Falha na inicialização do banco de dados"
    exit 1
fi

log_success "Banco de dados inicializado"

# =============================================================================
# 3. SEED DE DADOS (Apenas em desenvolvimento e se banco estiver vazio)
# =============================================================================
if [ "${ENVIRONMENT:-development}" = "development" ] && [ "${SEED_DATA:-false}" = "true" ]; then
    log_info "Verificando necessidade de seed de dados..."
    
    python << PYTHON_EOF
import sys
sys.path.insert(0, '/app')

from app.db.database import SessionLocal
from app.models.financeiro import FinanceEntry
from app.scripts.seed_data_fixed import seed_database

session = SessionLocal()
try:
    # Verificar se já existem dados
    count = session.query(FinanceEntry).count()
    if count == 0:
        print("[INFO] Banco de dados vazio. Executando seed...")
        seed_database()
        print("[SUCCESS] Seed de dados concluído!")
    else:
        print(f"[INFO] Banco já possui {count} registros. Pulando seed.")
finally:
    session.close()
PYTHON_EOF
fi

# =============================================================================
# 4. INICIAR APLICAÇÃO
# =============================================================================
log_success "Setup concluído! Iniciando aplicação..."
log_info "API disponível em: http://localhost:8000"
log_info "Documentação Swagger: http://localhost:8000/docs"
log_info "Documentação ReDoc: http://localhost:8000/redoc"

# Executar comando passado como argumento (ou padrão)
exec "$@"
