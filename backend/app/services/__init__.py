# =============================================================================
# PACOTE SERVICES - Lógica de Negócio
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# Este pacote contém a lógica de negócio da aplicação.
# Services encapsulam operações complexas e regras de negócio,
# mantendo os routers (API) limpos e focados apenas em HTTP.
#
# PRINCÍPIOS:
# - Single Responsibility: Cada service tem uma função específica
# - Dependency Injection: Recebem db: Session como parâmetro
# - Testabilidade: Fácil de testar isoladamente
#
# =============================================================================

from app.services.financeiro_service import FinanceiroService

__all__ = ["FinanceiroService"]
