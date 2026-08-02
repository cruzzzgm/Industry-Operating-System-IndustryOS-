# =============================================================================
# INDUSTRYOS BACKEND - API REST Python
# =============================================================================
#
# Pacote principal da aplicação FastAPI.
#
# ESTRUTURA:
# - api/: Endpoints REST (Routers)
# - core/: Configurações centralizadas
# - db/: Conexão e sessões de banco de dados
# - models/: Entidades ORM (SQLAlchemy)
# - schemas/: Validação Pydantic
# - services/: Lógica de negócio
#
# USO:
#   from app.main import app
#   uvicorn app.main:app --reload
#
# =============================================================================

__version__ = "1.0.0"
__author__ = "IndustryOS Team"
