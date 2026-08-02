# =============================================================================
# ROUTER AUTH - API de Autenticação
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: auth.py
# RESPONSABILIDADE: Endpoints de autenticação e autorização
#
# ENDPOINTS:
# - POST /auth/register - Registrar novo usuário
# - POST /auth/login - Login
# - POST /auth/refresh - Refresh token
#
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
import uuid

from app.db.database import get_db
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


# =============================================================================
# CONFIGURAÇÕES JWT
# =============================================================================

# Em produção, usar variáveis de ambiente
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


# =============================================================================
# SCHEMAS PYDANTIC
# =============================================================================

class UserRegister(BaseModel):
    username: str
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    is_active: bool
    is_admin: bool
    created_at: str


# =============================================================================
# FUNÇÕES UTILITÁRIAS
# =============================================================================

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Cria um token JWT.
    
    Args:
        data: Dados para incluir no token
        expires_delta: Tempo de expiração
        
    Returns:
        str: Token JWT codificado
    """
    from jose import JWTError, jwt
    
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifica se a senha está correta.
    
    Args:
        plain_password: Senha em texto plano
        hashed_password: Senha criptografada
        
    Returns:
        bool: True se senha está correta
    """
    import bcrypt
    
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_password_hash(password: str) -> str:
    """
    Criptografa a senha.
    
    Args:
        password: Senha em texto plano
        
    Returns:
        str: Senha criptografada
    """
    import bcrypt
    
    # Truncar senha para máximo de 72 bytes (limite do bcrypt)
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    """
    Autentica um usuário.
    
    Args:
        db: Sessão do banco de dados
        username: Nome de usuário
        password: Senha em texto plano
        
    Returns:
        User: Usuário autenticado ou None
    """
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=UserResponse)
def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """
    Registra um novo usuário.
    """
    # Verificar se username já existe
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já existe"
        )
    
    # Verificar se email já existe
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="E-mail já cadastrado"
        )
    
    # Criar novo usuário
    new_user = User(
        id=str(uuid.uuid4()),
        username=user_data.username,
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_active=True,
        is_admin=False,
        created_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        updated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return UserResponse(
        id=new_user.id,
        username=new_user.username,
        email=new_user.email,
        full_name=new_user.full_name,
        is_active=new_user.is_active,
        is_admin=new_user.is_admin,
        created_at=new_user.created_at,
    )


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Login de usuário.
    
    Retorna um token JWT para autenticação.
    """
    user = authenticate_user(db, user_data.username, user_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nome de usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuário desativado"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "is_admin": user.is_admin,
        }
    )


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Renova o token de acesso.
    
    Este endpoint requer autenticação.
    """
    # Por enquanto, apenas gera um novo token
    # Em produção, verificar se o token ainda é válido
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário desativado"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.username, "user_id": current_user.id},
        expires_delta=access_token_expires
    )
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user={
            "id": current_user.id,
            "username": current_user.username,
            "email": current_user.email,
            "full_name": current_user.full_name,
            "is_admin": current_user.is_admin,
        }
    )
