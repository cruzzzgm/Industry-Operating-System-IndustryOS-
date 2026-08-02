# =============================================================================
# FASTAPI MAIN APPLICATION
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: main.py
# RESPONSABILIDADE: Ponto de entrada da aplicação FastAPI
#
# CONFIGURAÇÕES:
# - CORS: Permite comunicação com frontend React
# - Middleware: Logging, tratamento de erros, tempo de resposta
# - Routers: Registro de endpoints da API
# - Eventos: Startup e shutdown handlers
#
# DOCUMENTAÇÃO AUTOMÁTICA:
# - Swagger UI: http://localhost:8000/docs
# - ReDoc: http://localhost:8000/redoc
# - OpenAPI Schema: http://localhost:8000/openapi.json
#
# =============================================================================

import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

# Configurações da aplicação
from app.core.config import settings

# Routers (endpoints da API)
from app.api.routers import financeiro, health, orders, customers, carriers, auth, statistics, notifications
from app.api.routes.products import router as products_router

# Database
from app.db.database import init_database


# =============================================================================
# CONFIGURAÇÃO DE LOGGING
# =============================================================================
# Formato padronizado para fácil análise de logs

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

logger = logging.getLogger(__name__)


# =============================================================================
# LIFESPAN - GERENCIAMENTO DE CICLO DE VIDA
# =============================================================================
# Executa código na inicialização e finalização da aplicação

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gerenciador de ciclo de vida da aplicação.
    
    Executa código ao iniciar (startup) e ao parar (shutdown) a aplicação.
    Útil para inicializar banco de dados, conexões, cache, etc.
    
    Yields:
        None: Controle passa para a aplicação rodando
    """
    # -------------------------------------------------------------------------
    # STARTUP: Inicialização
    # -------------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info(f"Iniciando {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info(f"Ambiente: {settings.ENVIRONMENT}")
    logger.info(f"Debug: {settings.DEBUG}")
    logger.info(f"Database: {settings.DATABASE_URL}")
    logger.info("=" * 60)
    
    # Inicializar banco de dados (criar tabelas se não existirem)
    try:
        init_database()
        logger.info("Banco de dados inicializado com sucesso")
    except Exception as e:
        logger.error(f"Erro ao inicializar banco de dados: {e}")
        # Não levanta exceção para permitir que a aplicação inicie mesmo com erro
        # (útil para debugging)
    
    # Inicializar cache, conexões externas, etc. (futuro)
    logger.info("Aplicação pronta para receber requisições")
    
    yield  # Aplicação está rodando
    
    # -------------------------------------------------------------------------
    # SHUTDOWN: Finalização
    # -------------------------------------------------------------------------
    logger.info("=" * 60)
    logger.info("Encerrando aplicação...")
    logger.info("=" * 60)
    
    # Fechar conexões, liberar recursos, etc.
    logger.info("Recursos liberados")


# =============================================================================
# CRIAÇÃO DA APLICAÇÃO FASTAPI
# =============================================================================

app = FastAPI(
    # Metadados da API
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    
    # Configurações de documentação
    docs_url="/docs",           # Swagger UI
    redoc_url="/redoc",         # ReDoc
    openapi_url="/openapi.json", # Schema OpenAPI
    
    # Configurações de segurança
    openapi_tags=[
        {"name": "Health", "description": "Endpoints de verificação de saúde"},
        {"name": "Financeiro", "description": "Gestão financeira: contas, despesas, relatórios"},
    ],
    
    # Gerenciador de ciclo de vida
    lifespan=lifespan,
    
    # Configurações de debug
    debug=settings.DEBUG,
)


# =============================================================================
# MIDDLEWARE CORS (Cross-Origin Resource Sharing)
# =============================================================================
# Permite que o frontend React acesse a API de outro domínio/porta
# IMPORTANTE: Deve ser adicionado ANTES de qualquer outro middleware ou router

# Adicionar middleware CORS no início da aplicação
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:53493",
        "http://localhost:53493",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "*",  # Permitir todas as origens em desenvolvimento
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

logger.info(f"CORS configurado para permitir todas as origens (desenvolvimento)")


# =============================================================================
# MIDDLEWARE DE LOGGING DE REQUISIÇÕES
# =============================================================================
# Loga todas as requisições para monitoramento e debugging

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """
    Middleware para logar todas as requisições HTTP.
    
    Loga método, path, tempo de resposta e status code.
    Útil para debugging e monitoramento de performance.
    
    Args:
        request: Objeto Request do FastAPI
        call_next: Função para chamar o próximo middleware/endpoint
        
    Returns:
        Response: Resposta do endpoint
    """
    start_time = time.time()
    
    # Informações da requisição
    method = request.method
    url = request.url.path
    client = request.client.host if request.client else "unknown"
    
    # Processar requisição
    response = await call_next(request)
    
    # Calcular tempo de processamento
    process_time = time.time() - start_time
    
    # Log formatado
    status_code = response.status_code
    log_msg = f"{method} {url} - {status_code} - {process_time:.3f}s - {client}"
    
    # Logar com nível apropriado baseado no status
    if status_code >= 500:
        logger.error(log_msg)
    elif status_code >= 400:
        logger.warning(log_msg)
    else:
        logger.info(log_msg)
    
    # Adicionar header de tempo de resposta (útil para debugging)
    response.headers["X-Process-Time"] = str(process_time)
    
    return response


# =============================================================================
# HANDLERS DE EXCEÇÕES GLOBALS
# =============================================================================
# Tratamento padronizado de erros para respostas consistentes

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """
    Handler para exceções HTTP (404, 401, 403, etc.).
    
    Retorna resposta JSON padronizada com detalhes do erro.
    """
    logger.warning(f"HTTP {exc.status_code}: {exc.detail} - {request.url.path}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "type": "http_error",
                "path": request.url.path
            }
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handler para erros de validação Pydantic (400 Bad Request).
    
    Ocorre quando o body da requisição não passa na validação dos schemas.
    """
    logger.warning(f"Validation error: {exc.errors()} - {request.url.path}")
    
    # Formatar erros de validação de forma legível
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " -> ".join(str(x) for x in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": 422,
                "message": "Dados de entrada inválidos",
                "type": "validation_error",
                "details": errors,
                "path": request.url.path
            }
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """
    Handler genérico para exceções não tratadas (500 Internal Server Error).
    
    Captura qualquer erro não previsto e retorna resposta segura
    (sem expor detalhes internos em produção).
    """
    logger.exception(f"Erro não tratado: {exc} - {request.url.path}")
    
    # Em produção, não expor detalhes do erro interno
    message = str(exc) if settings.DEBUG else "Erro interno do servidor"
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": message,
                "type": "internal_error",
                "path": request.url.path
            }
        }
    )


# =============================================================================
# REGISTRO DE ROUTERS (ENDPOINTS DA API)
# =============================================================================

# Router de health check (verificação de saúde)
app.include_router(
    health.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Health"]
)

# Router do módulo financeiro
app.include_router(
    financeiro.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Financeiro"]
)

# Router de pedidos
app.include_router(
    orders.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Pedidos"]
)

# Router de clientes
app.include_router(
    customers.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Clientes"]
)

# Router de produtos
app.include_router(
    products_router,
    prefix=settings.API_V1_PREFIX,
    tags=["Produtos"]
)

# Router de transportadoras
app.include_router(
    carriers.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Transportadoras"]
)

# Router de autenticação
app.include_router(
    auth.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Auth"]
)

# Router de notificações
app.include_router(
    notifications.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Notificações"]
)

# Router de estatísticas
app.include_router(
    statistics.router,
    prefix=settings.API_V1_PREFIX,
    tags=["Statistics"]
)

logger.info("Routers registrados:")
logger.info(f"  - {settings.API_V1_PREFIX}/health")
logger.info(f"  - {settings.API_V1_PREFIX}/financeiro")
logger.info(f"  - {settings.API_V1_PREFIX}/orders")
logger.info(f"  - {settings.API_V1_PREFIX}/customers")
logger.info(f"  - {settings.API_V1_PREFIX}/products")
logger.info(f"  - {settings.API_V1_PREFIX}/carriers")
logger.info(f"  - {settings.API_V1_PREFIX}/auth")
logger.info(f"  - {settings.API_V1_PREFIX}/statistics")


# =============================================================================
# ROOT ENDPOINT
# =============================================================================
# Endpoint raiz para verificação rápida

@app.get("/")
async def root():
    """
    Endpoint raiz - informações básicas da API.
    
    Returns:
        dict: Metadados da aplicação
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/health"
    }


# =============================================================================
# PONTO DE ENTRADA PARA EXECUÇÃO DIRETA
# =============================================================================
# Permite executar: python -m app.main

if __name__ == "__main__":
    import uvicorn
    
    logger.info("Iniciando servidor Uvicorn...")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,      # Auto-reload em desenvolvimento
        log_level="debug" if settings.DEBUG else "info"
    )
