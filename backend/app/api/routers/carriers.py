# =============================================================================
# ROUTER CARRIERS - API de Transportadoras
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: carriers.py
# RESPONSABILIDADE: Endpoints CRUD para transportadoras
#
# ENDPOINTS:
# - GET /carriers/ - Listar transportadoras
# - GET /carriers/{id} - Obter transportadora por ID
# - POST /carriers/ - Criar nova transportadora
# - PUT /carriers/{id} - Atualizar transportadora
# - DELETE /carriers/{id} - Deletar transportadora
#
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.models.carrier import Carrier

router = APIRouter(prefix="/carriers", tags=["carriers"])


# =============================================================================
# SCHEMAS PYDANTIC
# =============================================================================

class CarrierCreate(BaseModel):
    id: str
    name: str
    cnpj: str
    is_active: bool = True
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None


class CarrierUpdate(BaseModel):
    name: Optional[str] = None
    cnpj: Optional[str] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None


class CarrierResponse(BaseModel):
    id: str
    name: str
    cnpj: str
    is_active: bool
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    created_at: str
    updated_at: str


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/health", status_code=200)
def carriers_health_check():
    """
    Health check para o módulo de transportadoras.
    """
    return {"status": "ok", "module": "carriers"}


@router.get("/", response_model=List[CarrierResponse])
def list_carriers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Lista transportadoras com paginação e filtros.
    """
    query = db.query(Carrier)
    
    if is_active is not None:
        query = query.filter(Carrier.is_active == is_active)
    
    carriers = query.offset(skip).limit(limit).all()
    
    return [
        CarrierResponse(
            id=c.id,
            name=c.name,
            cnpj=c.cnpj,
            is_active=c.is_active,
            phone=c.phone,
            email=c.email,
            website=c.website,
            address=c.address,
            city=c.city,
            state=c.state,
            zip_code=c.zip_code,
            contact_person=c.contact_person,
            contact_phone=c.contact_phone,
            contact_email=c.contact_email,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c in carriers
    ]


@router.get("/{carrier_id}", response_model=CarrierResponse)
def get_carrier(carrier_id: str, db: Session = Depends(get_db)):
    """
    Obtém uma transportadora por ID.
    """
    carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    
    if not carrier:
        raise HTTPException(status_code=404, detail="Transportadora não encontrada")
    
    return CarrierResponse(
        id=carrier.id,
        name=carrier.name,
        cnpj=carrier.cnpj,
        is_active=carrier.is_active,
        phone=carrier.phone,
        email=carrier.email,
        website=carrier.website,
        address=carrier.address,
        city=carrier.city,
        state=carrier.state,
        zip_code=carrier.zip_code,
        contact_person=carrier.contact_person,
        contact_phone=carrier.contact_phone,
        contact_email=carrier.contact_email,
        created_at=carrier.created_at,
        updated_at=carrier.updated_at,
    )


@router.post("/", response_model=CarrierResponse)
def create_carrier(carrier: CarrierCreate, db: Session = Depends(get_db)):
    """
    Cria uma nova transportadora.
    """
    # Verificar se ID já existe
    existing = db.query(Carrier).filter(Carrier.id == carrier.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="ID de transportadora já existe")
    
    # Verificar se CNPJ já existe
    existing_cnpj = db.query(Carrier).filter(Carrier.cnpj == carrier.cnpj).first()
    if existing_cnpj:
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    
    new_carrier = Carrier(
        id=carrier.id,
        name=carrier.name,
        cnpj=carrier.cnpj,
        is_active=carrier.is_active,
        phone=carrier.phone,
        email=carrier.email,
        website=carrier.website,
        address=carrier.address,
        city=carrier.city,
        state=carrier.state,
        zip_code=carrier.zip_code,
        contact_person=carrier.contact_person,
        contact_phone=carrier.contact_phone,
        contact_email=carrier.contact_email,
        created_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
        updated_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S"),
    )
    
    db.add(new_carrier)
    db.commit()
    db.refresh(new_carrier)
    
    return CarrierResponse(
        id=new_carrier.id,
        name=new_carrier.name,
        cnpj=new_carrier.cnpj,
        is_active=new_carrier.is_active,
        phone=new_carrier.phone,
        email=new_carrier.email,
        website=new_carrier.website,
        address=new_carrier.address,
        city=new_carrier.city,
        state=new_carrier.state,
        zip_code=new_carrier.zip_code,
        contact_person=new_carrier.contact_person,
        contact_phone=new_carrier.contact_phone,
        contact_email=new_carrier.contact_email,
        created_at=new_carrier.created_at,
        updated_at=new_carrier.updated_at,
    )


@router.put("/{carrier_id}", response_model=CarrierResponse)
def update_carrier(carrier_id: str, carrier: CarrierUpdate, db: Session = Depends(get_db)):
    """
    Atualiza uma transportadora existente.
    """
    db_carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    
    if not db_carrier:
        raise HTTPException(status_code=404, detail="Transportadora não encontrada")
    
    # Atualizar apenas campos fornecidos
    update_data = carrier.model_dump(exclude_unset=True)
    
    # Mapeamento de camelCase para snake_case
    field_mapping = {
        "contact_person": "contact_person",
        "contact_phone": "contact_phone",
        "contact_email": "contact_email",
        "zip_code": "zip_code",
    }
    
    for key, value in update_data.items():
        # Atualizar o campo se ele foi fornecido (incluindo False para booleanos)
        if key == "is_active":
            db_carrier.is_active = value
        elif key == "name":
            db_carrier.name = value
        elif key == "cnpj":
            db_carrier.cnpj = value
        elif key == "phone":
            db_carrier.phone = value
        elif key == "email":
            db_carrier.email = value
        elif key == "website":
            db_carrier.website = value
        elif key == "address":
            db_carrier.address = value
        elif key == "city":
            db_carrier.city = value
        elif key == "state":
            db_carrier.state = value
        elif key == "zip_code":
            db_carrier.zip_code = value
        elif key == "contact_person":
            db_carrier.contact_person = value
        elif key == "contact_phone":
            db_carrier.contact_phone = value
        elif key == "contact_email":
            db_carrier.contact_email = value
    
    db_carrier.updated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    
    db.commit()
    db.refresh(db_carrier)
    
    return CarrierResponse(
        id=db_carrier.id,
        name=db_carrier.name,
        cnpj=db_carrier.cnpj,
        is_active=db_carrier.is_active,
        phone=db_carrier.phone,
        email=db_carrier.email,
        website=db_carrier.website,
        address=db_carrier.address,
        city=db_carrier.city,
        state=db_carrier.state,
        zip_code=db_carrier.zip_code,
        contact_person=db_carrier.contact_person,
        contact_phone=db_carrier.contact_phone,
        contact_email=db_carrier.contact_email,
        created_at=db_carrier.created_at,
        updated_at=db_carrier.updated_at,
    )


@router.delete("/{carrier_id}")
def delete_carrier(carrier_id: str, db: Session = Depends(get_db)):
    """
    Deleta uma transportadora.
    """
    db_carrier = db.query(Carrier).filter(Carrier.id == carrier_id).first()
    
    if not db_carrier:
        raise HTTPException(status_code=404, detail="Transportadora não encontrada")
    
    db.delete(db_carrier)
    db.commit()
    
    return {"message": "Transportadora deletada com sucesso"}
