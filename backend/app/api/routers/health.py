# =============================================================================
# ROUTER HEALTH - Verificação de Saúde do Sistema
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: health.py
# RESPONSABILIDADE: Endpoints para monitoramento e health checks
#
# ENDPOINTS:
# - GET /api/v1/health: Verificação básica de saúde
# - GET /api/v1/health/detailed: Verificação detalhada (DB, etc.)
#
# USO:
#   - Docker healthcheck
#   - Load balancers
#   - Monitoramento externo
# =============================================================================

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any

from app.db.database import get_db
from app.core.config import settings

# Criar router
router = APIRouter(prefix="/health", tags=["Health"])


# =============================================================================
# ENDPOINT: HEALTH CHECK BÁSICO
# =============================================================================

@router.get(
    "",
    status_code=status.HTTP_200_OK,
    summary="Verificação básica de saúde",
    description="Retorna status da aplicação. Usado por load balancers e Docker.",
    response_description="Status OK se a aplicação está respondendo"
)
async def health_check() -> Dict[str, Any]:
    """
    Health check básico.
    
    Retorna informações essenciais sobre o estado da aplicação.
    Este endpoint deve ser rápido e não realizar operações pesadas.
    
    Returns:
        dict: Status da aplicação
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


# =============================================================================
# ENDPOINT: HEALTH CHECK DETALHADO
# =============================================================================

@router.get(
    "/detailed",
    status_code=status.HTTP_200_OK,
    summary="Verificação detalhada de saúde",
    description="Verifica conexão com banco de dados e outros serviços externos.",
    response_description="Status detalhado incluindo saúde do banco de dados"
)
async def health_check_detailed(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """
    Health check detalhado com verificação de dependências.
    
    Verifica:
    - Conexão com banco de dados
    - Versão do banco
    - Tempo de resposta
    
    Args:
        db: Sessão de banco injetada automaticamente
        
    Returns:
        dict: Status detalhado da aplicação e dependências
    """
    import time
    start_time = time.time()
    
    # Verificar conexão com banco de dados
    db_status = "unknown"
    db_message = ""
    try:
        # Executar query simples para testar conexão
        db.execute("SELECT 1")
        db_status = "healthy"
        db_message = "Conexão estabelecida"
    except Exception as e:
        db_status = "unhealthy"
        db_message = f"Erro: {str(e)}"
    
    response_time = time.time() - start_time
    
    # Determinar status geral
    overall_status = "healthy" if db_status == "healthy" else "degraded"
    
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "response_time_ms": round(response_time * 1000, 2),
        "checks": {
            "database": {
                "status": db_status,
                "message": db_message,
                "type": "SQLite" if settings.DATABASE_IS_SQLITE else "PostgreSQL"
            }
        }
    }


# =============================================================================
# ENDPOINT: INFORMAÇÕES DO SISTEMA
# =============================================================================

@router.get(
    "/info",
    status_code=status.HTTP_200_OK,
    summary="Informações do sistema",
    description="Retorna metadados e configurações da aplicação."
)
async def system_info() -> Dict[str, Any]:
    """
    Informações sobre o sistema.
    
    Retorna dados úteis para debugging e documentação.
    Não expõe informações sensíveis (senhas, chaves secretas).
    
    Returns:
        dict: Informações do sistema
    """
    return {
        "app": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "description": settings.APP_DESCRIPTION,
            "environment": settings.ENVIRONMENT,
        },
        "database": {
            "type": "SQLite" if settings.DATABASE_IS_SQLITE else "PostgreSQL",
            "echo": settings.DATABASE_ECHO,
        },
        "api": {
            "version": "v1",
            "prefix": settings.API_V1_PREFIX,
            "docs_url": "/docs",
            "redoc_url": "/redoc",
        },
        "features": {
            "financeiro": True,
            "auth": False,  # Futuro: JWT
            "reports": False,  # Futuro: PDF/Excel
        }
    }
