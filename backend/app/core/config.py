# =============================================================================
# CONFIGURAÇÕES CENTRAIS DO SISTEMA
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: config.py
# RESPONSABILIDADE: Centralizar todas as configurações da aplicação
# 
# PRINCÍPIOS:
# - 12-Factor App: Configurações via variáveis de ambiente
# - Type Safety: Uso de Pydantic Settings para validação
# - Separação de ambientes: dev, staging, production
# - Documentação inline: cada configuração explicada
#
# USO:
#   from app.core.config import settings
#   database_url = settings.DATABASE_URL
#
# =============================================================================

from functools import lru_cache
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator
import os


# =============================================================================
# CLASSE PRINCIPAL DE CONFIGURAÇÕES
# =============================================================================
class Settings(BaseSettings):
    """
    Configurações centralizadas do IndustryOS Backend.
    
    Todas as configurações são carregadas de:
    1. Variáveis de ambiente (prioridade máxima)
    2. Arquivo .env (se existir)
    3. Valores padrão definidos abaixo
    
    Attributes:
        APP_NAME: Nome da aplicação
        DEBUG: Modo debug (True em desenvolvimento)
        DATABASE_URL: URL de conexão com o banco de dados
        SECRET_KEY: Chave secreta para JWT e criptografia
    """
    
    # =========================================================================
    # 1. CONFIGURAÇÕES GERAIS DA APLICAÇÃO
    # =========================================================================
    APP_NAME: str = Field(
        default="IndustryOS",
        description="Nome oficial da aplicação"
    )
    
    APP_VERSION: str = Field(
        default="1.0.0",
        description="Versão semântica da API (MAJOR.MINOR.PATCH)"
    )
    
    APP_DESCRIPTION: str = Field(
        default="API RESTful para Sistema de Gestão Industrial",
        description="Descrição curta para documentação OpenAPI"
    )
    
    ENVIRONMENT: str = Field(
        default="development",
        description="Ambiente de execução: development, staging, production"
    )
    
    DEBUG: bool = Field(
        default=True,
        description="Modo debug: True=logs detalhados, auto-reload | False=produção"
    )
    
    # =========================================================================
    # 2. CONFIGURAÇÕES DE BANCO DE DADOS
    # =========================================================================
    # Nota: SQLite para desenvolvimento, PostgreSQL para produção futura
    
    DATABASE_URL: str = Field(
        default="sqlite:///./data/industryos.db",
        description="URL de conexão SQLAlchemy (SQLite local por padrão)"
    )
    
    DATABASE_ECHO: bool = Field(
        default=False,
        description="Logar todas as queries SQL (útil para debug)"
    )
    
    DATABASE_POOL_SIZE: int = Field(
        default=5,
        description="Número de conexões no pool (PostgreSQL futuro)"
    )
    
    # =========================================================================
    # 3. CONFIGURAÇÕES DE SEGURANÇA (JWT - Implementação Futura)
    # =========================================================================
    
    SECRET_KEY: str = Field(
        default="dev-secret-key-change-in-production-32-chars-long",
        description="Chave secreta para assinatura de JWT tokens"
    )
    
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30,
        description="Tempo de expiração do token JWT em minutos"
    )
    
    ALGORITHM: str = Field(
        default="HS256",
        description="Algoritmo de criptografia para JWT"
    )
    
    # =========================================================================
    # 4. CONFIGURAÇÕES CORS (Cross-Origin Resource Sharing)
    # =========================================================================
    # Permite que o frontend React acesse a API
    
    CORS_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:5173",    # Vite dev server
            "http://localhost:3000",    # React dev server alternativo
            "http://127.0.0.1:5173",
        ],
        description="Lista de origens permitidas para requisições CORS"
    )
    
    CORS_ALLOW_CREDENTIALS: bool = Field(
        default=True,
        description="Permitir cookies em requisições CORS"
    )
    
    CORS_ALLOW_METHODS: List[str] = Field(
        default=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        description="Métodos HTTP permitidos via CORS"
    )
    
    CORS_ALLOW_HEADERS: List[str] = Field(
        default=["*"],
        description="Headers HTTP permitidos via CORS"
    )
    
    # =========================================================================
    # 5. CONFIGURAÇÕES DE PAGINAÇÃO E LIMITES
    # =========================================================================
    
    DEFAULT_PAGE_SIZE: int = Field(
        default=20,
        description="Número padrão de itens por página nas listagens"
    )
    
    MAX_PAGE_SIZE: int = Field(
        default=100,
        description="Limite máximo de itens por página (proteção contra sobrecarga)"
    )
    
    # =========================================================================
    # 6. CONFIGURAÇÕES FINANCEIRAS
    # =========================================================================
    
    DEFAULT_INITIAL_BALANCE: float = Field(
        default=10000.0,
        description="Saldo inicial padrão para projeções financeiras (R$)"
    )
    
    MARGIN_HEALTH_EXCELLENT: float = Field(
        default=15.0,
        description="Margem de lucro considerada excelente (%)"
    )
    
    MARGIN_HEALTH_ATTENTION: float = Field(
        default=5.0,
        description="Margem de lucro mínima aceitável (%)"
    )
    
    # =========================================================================
    # 7. CONFIGURAÇÕES DE DIRETÓRIOS E ARQUIVOS
    # =========================================================================
    
    BASE_DIR: Path = Field(
        default=Path(__file__).resolve().parent.parent.parent,
        description="Diretório raiz da aplicação"
    )
    
    DATA_DIR: Path = Field(
        default=Path(__file__).resolve().parent.parent.parent / "data",
        description="Diretório para persistência de dados (SQLite, uploads)"
    )
    
    LOGS_DIR: Path = Field(
        default=Path(__file__).resolve().parent.parent.parent / "logs",
        description="Diretório para arquivos de log"
    )
    
    # =========================================================================
    # 8. CONFIGURAÇÃO DO PYDANTIC SETTINGS
    # =========================================================================
    # Carrega variáveis de ambiente do arquivo .env se existir
    
    model_config = SettingsConfigDict(
        env_file=".env",           # Arquivo de variáveis de ambiente
        env_file_encoding="utf-8", # Encoding do arquivo .env
        case_sensitive=False,      # Variáveis não são case-sensitive
        extra="ignore"             # Ignorar variáveis não definidas
    )
    
    # =========================================================================
    # VALIDADORES CUSTOMIZADOS
    # =========================================================================
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v: str) -> str:
        """
        Valida se o ambiente é um dos permitidos.
        
        Args:
            v: Valor do ambiente
            
        Returns:
            str: Ambiente validado (lowercase)
            
        Raises:
            ValueError: Se ambiente não for válido
        """
        allowed = ["development", "staging", "production", "test"]
        v = v.lower()
        if v not in allowed:
            raise ValueError(f"Ambiente deve ser um de: {allowed}")
        return v
    
    @validator("SECRET_KEY")
    def validate_secret_key(cls, v: str, values) -> str:
        """
        Valida tamanho da chave secreta (mínimo 32 caracteres em produção).
        
        Args:
            v: Valor da chave secreta
            values: Dicionário com outros valores das settings
            
        Returns:
            str: Chave validada
            
        Raises:
            ValueError: Se chave for muito curta em produção
        """
        env = values.get("ENVIRONMENT", "development")
        if env == "production" and len(v) < 32:
            raise ValueError("SECRET_KEY deve ter pelo menos 32 caracteres em produção")
        return v
    
    @validator("CORS_ORIGINS", pre=True)
    def parse_cors_origins(cls, v):
        """
        Converte string de origens CORS em lista.
        
        Suporta formatos:
        - Lista Python: ["http://localhost:5173"]
        - JSON array string: '["http://localhost:5173","http://localhost:3000"]'
        - String separada por vírgula: "http://localhost:5173,http://localhost:3000"
        
        Args:
            v: Valor das origens CORS
            
        Returns:
            List[str]: Lista de origens
        """
        if isinstance(v, str):
            # Try to parse as JSON first
            if v.startswith("[") and v.endswith("]"):
                try:
                    import json
                    return json.loads(v)
                except json.JSONDecodeError:
                    pass
            # Fall back to comma-separated
            return [origin.strip() for origin in v.split(",")]
        return v
    
    # =========================================================================
    # PROPRIEDADES CALCULADAS
    # =========================================================================
    
    @property
    def IS_DEVELOPMENT(self) -> bool:
        """Retorna True se ambiente é desenvolvimento."""
        return self.ENVIRONMENT == "development"
    
    @property
    def IS_PRODUCTION(self) -> bool:
        """Retorna True se ambiente é produção."""
        return self.ENVIRONMENT == "production"
    
    @property
    def DATABASE_IS_SQLITE(self) -> bool:
        """Retorna True se banco de dados é SQLite."""
        return "sqlite" in self.DATABASE_URL.lower()
    
    @property
    def API_V1_PREFIX(self) -> str:
        """Prefixo da API versão 1."""
        return "/api/v1"


# =============================================================================
# INSTÂNCIA GLOBAL DE CONFIGURAÇÕES (SINGLETON)
# =============================================================================
# Usa LRU cache para garantir uma única instância em toda a aplicação
# Isso evita recarregar as configurações a cada import

@lru_cache()
def get_settings() -> Settings:
    """
    Retorna instância única das configurações (Singleton).
    
    O decorator @lru_cache garante que as configurações sejam carregadas
    apenas uma vez, melhorando performance e consistência.
    
    Returns:
        Settings: Instância das configurações da aplicação
    """
    return Settings()


# Instância global para uso direto
settings = get_settings()
