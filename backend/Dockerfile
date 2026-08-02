# =============================================================================
# DOCKERFILE - Backend Python FastAPI
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
# 
# IMAGEM BASE: Python 3.11 Slim (otimizado para produção)
# - Menor footprint de imagem
# - Segurança aprimorada
# - Performance otimizada
#
# MULTI-STAGE BUILD:
# - Stage 1: Builder (compilação de dependências)
# - Stage 2: Runtime (imagem final minimalista)
#
# =============================================================================

# =============================================================================
# STAGE 1: BUILDER
# Compilação das dependências Python em ambiente isolado
# =============================================================================
FROM python:3.11-slim as builder

# Definir variáveis de ambiente para build
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Instalar dependências de sistema necessárias para compilação
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Criar diretório de trabalho
WORKDIR /build

# Instalar dependências em virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copiar e instalar requirements
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# =============================================================================
# STAGE 2: RUNTIME
# Imagem final minimalista apenas com o necessário para execução
# =============================================================================
FROM python:3.11-slim as runtime

# Metadados da imagem
LABEL maintainer="IndustryOS Team" \
      description="IndustryOS Backend API - FastAPI + SQLite" \
      version="1.0.0"

# Definir variáveis de ambiente de runtime
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONFAULTHANDLER=1 \
    # Configurações da aplicação
    APP_NAME="IndustryOS" \
    APP_VERSION="1.0.0" \
    # Caminho do banco de dados (volume montado)
    DATABASE_PATH=/app/data \
    # Não gerar bytecode .pyc em produção
    PYTHONDONTWRITEBYTECODE=1

# Instalar dependências de runtime mínimas
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Criar usuário não-root para segurança
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copiar virtual environment do stage builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Diretório da aplicação
WORKDIR /app

# Criar estrutura de diretórios necessários
RUN mkdir -p /app/data /app/logs && \
    chown -R appuser:appgroup /app

# Copiar código da aplicação
COPY --chown=appuser:appgroup app/ ./app/

# Copiar scripts de inicialização
COPY --chown=appuser:appgroup docker-scripts/ ./docker-scripts/
RUN chmod +x docker-scripts/*.sh

# Mudar para usuário não-root
USER appuser

# Expor porta da API
EXPOSE 8000

# Healthcheck da aplicação
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# Comando de inicialização
# Usa entrypoint script para migrations e setup inicial
ENTRYPOINT ["./docker-scripts/entrypoint.sh"]
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
