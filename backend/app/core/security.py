# =============================================================================
# SECURITY - Autenticação e Autorização
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: security.py
# RESPONSABILIDADE: Funções de segurança e JWT
#
# =============================================================================

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from jose import JWTError, jwt

from app.db.database import get_db
from app.models.user import User

# Configurações JWT
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"


# =============================================================================
# DEPENDÊNCIA DE AUTENTICAÇÃO
# =============================================================================

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Obtém o usuário atual a partir do token JWT.
    
    Args:
        credentials: Credenciais HTTP Bearer
        db: Sessão do banco de dados
        
    Returns:
        User: Usuário autenticado
        
    Raises:
        HTTPException: Se token for inválido ou usuário não existir
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Não foi possível validar as credenciais",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Decodificar token
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Obter username do token
        username: str = payload.get("sub")
        user_id: str = payload.get("user_id")
        
        if username is None or user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Buscar usuário no banco
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário desativado"
        )
    
    return user


async def get_current_admin(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Obtém o usuário atual e verifica se é administrador.
    
    Args:
        current_user: Usuário autenticado
        
    Returns:
        User: Usuário administrador
        
    Raises:
        HTTPException: Se usuário não for administrador
    """
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permissão insuficiente"
        )
    
    return current_user


# =============================================================================
# FUNÇÕES UTILITÁRIAS
# =============================================================================

def create_access_token(data: dict, expires_delta: Optional[int] = None):
    """
    Cria um token JWT.
    
    Args:
        data: Dados para incluir no token
        expires_delta: Tempo de expiração em minutos
        
    Returns:
        str: Token JWT codificado
    """
    from datetime import datetime, timedelta
    
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + timedelta(minutes=expires_delta)
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
