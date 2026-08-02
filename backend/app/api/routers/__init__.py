# =============================================================================
# PACOTE ROUTERS - Endpoints da API
# =============================================================================

from app.api.routers.financeiro import router as financeiro_router
from app.api.routers.health import router as health_router
from app.api.routers.orders import router as orders_router
from app.api.routers.customers import router as customers_router
from app.api.routers.products import router as products_router
from app.api.routers.carriers import router as carriers_router
from app.api.routers.auth import router as auth_router
from app.api.routers.statistics import router as statistics_router

__all__ = ["financeiro_router", "health_router", "orders_router", "customers_router", "products_router", "carriers_router", "auth_router", "statistics_router"]
