# =============================================================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: database.py
# RESPONSABILIDADE: Configurar conexão e sessões SQLAlchemy
# 
# ARQUITETURA:
# - SQLAlchemy 2.0+ (versão moderna com suporte async)
# - SQLite (desenvolvimento) / PostgreSQL (futuro)
# - SessionLocal: Factory para criar sessões de banco
# - Base: Classe base para todos os models (declarative)
# 
# PADRÃO DE USO:
#   from app.db.database import SessionLocal
#   
#   db = SessionLocal()
#   try:
#       result = db.query(Model).all()
#   finally:
#       db.close()
#
#   # Ou usando context manager (recomendado):
#   from app.db.dependencies import get_db
#   @app.get("/items")
#   def read_items(db: Session = Depends(get_db)):
#       return db.query(Model).all()
#
# =============================================================================

from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import Generator
import logging

# Configurações da aplicação
from app.core.config import settings


# =============================================================================
# CONFIGURAÇÃO DE LOGGING
# =============================================================================
logger = logging.getLogger(__name__)


# =============================================================================
# CONFIGURAÇÃO ESPECÍFICA PARA SQLITE
# =============================================================================
# SQLite tem particularidades que precisam de configuração especial:
# 1. check_same_thread=False: permite uso em múltiplas threads (FastAPI async)
# 2. StaticPool: mantém uma única conexão para SQLite

connect_args = {}
poolclass = None

if settings.DATABASE_IS_SQLITE:
    # Configuração específica para SQLite
    connect_args = {"check_same_thread": False}
    poolclass = StaticPool
    logger.info("Configurando banco de dados SQLite")
else:
    # Configuração para PostgreSQL (futuro)
    logger.info("Configurando banco de dados PostgreSQL")


# =============================================================================
# CRIAÇÃO DO ENGINE SQLALCHEMY
# =============================================================================
# Engine é o ponto central de conexão com o banco de dados
# Responsável por gerenciar o pool de conexões

engine = create_engine(
    settings.DATABASE_URL,
    
    # Configurações de conexão
    connect_args=connect_args,
    poolclass=poolclass,
    
    # Echo: logar todas as queries SQL (útil para debug)
    echo=settings.DATABASE_ECHO,
)


# =============================================================================
# LISTENER PARA SQLITE - Foreign Keys
# =============================================================================
# SQLite desabilita foreign keys por padrão
# Este listener habilita a cada nova conexão

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, connection_record):
    """
    Habilita foreign keys no SQLite para cada nova conexão.
    
    SQLite não enforce foreign keys por padrão. Este evento é chamado
    sempre que uma nova conexão é criada, garantindo integridade referencial.
    
    Args:
        dbapi_conn: Conexão raw do DBAPI (sqlite3.Connection)
        connection_record: Registro interno do SQLAlchemy
    """
    if settings.DATABASE_IS_SQLITE:
        cursor = dbapi_conn.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
        logger.debug("Foreign keys habilitadas para conexão SQLite")


# =============================================================================
# SESSION MAKER - FÁBRICA DE SESSÕES
# =============================================================================
# SessionLocal é uma factory que cria novas sessões de banco de dados
# Cada sessão representa uma transação/escopo de trabalho

SessionLocal = sessionmaker(
    autocommit=False,    # Controle manual de commit (mais seguro)
    autoflush=False,     # Controle manual de flush (performance)
    bind=engine,         # Engine de conexão configurado acima
    expire_on_commit=True  # Expirar objetos após commit (evita stale data)
)


# =============================================================================
# BASE DECLARATIVA PARA MODELS
# =============================================================================
# Base é a classe que todos os models ORM devem herdar
# Ela conecta as classes Python às tabelas do banco de dados

Base = declarative_base()


# =============================================================================
# FUNÇÃO UTILITÁRIA - DEPENDÊNCIA FASTAPI
# =============================================================================
# Esta função é usada como dependência no FastAPI para injetar
# sessões de banco de dados nos endpoints automaticamente

def get_db() -> Generator[Session, None, None]:
    """
    Gerador de sessões de banco de dados para FastAPI.
    
    Esta função é projetada para ser usada com Depends() do FastAPI,
    garantindo que a sessão seja sempre fechada após o request.
    
    Padrão de uso:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    
    Yields:
        Session: Sessão SQLAlchemy pronta para uso
        
    Raises:
        Exception: Qualquer erro é propagado, mas a sessão é sempre fechada
    """
    db = SessionLocal()
    try:
        logger.debug("Nova sessão de banco de dados criada")
        yield db
        # Se chegou aqui sem exceção, commit automático (opcional)
        # db.commit()  # Descomentar se quiser autocommit
    except Exception as e:
        # Rollback em caso de erro para manter consistência
        logger.error(f"Erro na sessão de banco de dados: {e}")
        db.rollback()
        raise
    finally:
        # SEMPRE fechar a sessão, mesmo em caso de erro
        db.close()
        logger.debug("Sessão de banco de dados fechada")


# =============================================================================
# FUNÇÕES DE GERENCIAMENTO DO BANCO
# =============================================================================

def create_tables():
    """
    Cria todas as tabelas definidas nos models.
    
    ATENÇÃO: Em produção, use Alembic para migrations!
    Esta função é apenas para desenvolvimento inicial.
    """
    logger.info("Criando tabelas do banco de dados...")
    Base.metadata.create_all(bind=engine)
    logger.info("Tabelas criadas com sucesso")


def drop_tables():
    """
    Remove todas as tabelas do banco de dados.
    
    ATENÇÃO: Operação destrutiva! Usar apenas em desenvolvimento.
    """
    logger.warning("Removendo todas as tabelas do banco de dados!")
    Base.metadata.drop_all(bind=engine)
    logger.info("Tabelas removidas")


def reset_database():
    """
    Reseta o banco de dados (drop + create).
    
    Útil para desenvolvimento e testes.
    """
    drop_tables()
    create_tables()
    logger.info("Banco de dados resetado")


# =============================================================================
# INICIALIZAÇÃO VERIFICADA
# =============================================================================

def init_database():
    """
    Inicializa o banco de dados de forma segura.
    
    - Cria diretório de dados se necessário
    - Cria tabelas se não existirem
    - Loga informações úteis
    """
    import os
    from pathlib import Path
    
    # Criar diretório de dados se não existir
    data_dir = Path(settings.DATA_DIR)
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Extrair caminho do arquivo SQLite da URL
    if settings.DATABASE_IS_SQLITE:
        db_path = settings.DATABASE_URL.replace("sqlite:///", "")
        db_path = os.path.join(settings.BASE_DIR, db_path)
        db_file = Path(db_path)
        
        logger.info(f"Banco de dados SQLite: {db_file.absolute()}")
        
        # Criar tabelas se arquivo não existir
        if not db_file.exists():
            logger.info("Arquivo de banco não existe. Criando...")
            create_tables()
    else:
        # Para PostgreSQL, apenas tentar conectar
        try:
            with engine.connect() as conn:
                logger.info("Conexão com PostgreSQL estabelecida")
        except Exception as e:
            logger.error(f"Erro ao conectar ao PostgreSQL: {e}")
            raise


# Executar inicialização ao importar (opcional)
# init_database()
