# =============================================================================
# ROUTER PRODUCTS - API de Produtos
# IndustryOS - Sistema de Gestão Industrial
# =============================================================================
#
# ARQUIVO: products.py
# RESPONSABILIDADE: Endpoints CRUD para produtos
#
# ENDPOINTS:
# - GET /products/ - Listar produtos (com paginação e filtros)
# - GET /products/{id} - Obter produto por ID
# - POST /products/ - Criar novo produto
# - PUT /products/{id} - Atualizar produto
# - DELETE /products/{id} - Deletar produto
#
# =============================================================================

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime
from pydantic import BaseModel

from app.db.database import get_db
from app.models.product import Product

router = APIRouter(prefix="/products", tags=["products"])


# =============================================================================
# SCHEMAS PYDANTIC
# =============================================================================

class ProductCreate(BaseModel):
    code: str
    name: str
    category: str
    description: Optional[str] = None
    ncm_code: Optional[str] = None
    cost_price: float = 0.0
    sale_price: float = 0.0
    min_sale_price: Optional[float] = None
    stock_quantity: float = 0.0
    min_stock: float = 0.0
    max_stock: Optional[float] = None
    unit: str = "UN"
    weight_kg: Optional[float] = None
    dimensions: Optional[str] = None
    is_active: bool = True
    is_featured: bool = False
    image_url: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    ncm_code: Optional[str] = None
    cost_price: Optional[float] = None
    sale_price: Optional[float] = None
    min_sale_price: Optional[float] = None
    stock_quantity: Optional[float] = None
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    unit: Optional[str] = None
    weight_kg: Optional[float] = None
    dimensions: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    image_url: Optional[str] = None


class ProductResponse(BaseModel):
    id: int
    code: str
    name: str
    category: str
    description: Optional[str]
    ncm_code: Optional[str]
    cost_price: float
    sale_price: float
    min_sale_price: Optional[float]
    stock_quantity: float
    min_stock: float
    max_stock: Optional[float]
    unit: str
    weight_kg: Optional[float]
    dimensions: Optional[str]
    is_active: bool
    is_featured: bool
    total_sales: int
    total_revenue: float
    last_sale_date: Optional[str]
    image_url: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]


# =============================================================================
# ENDPOINTS
# =============================================================================

@router.get("/", response_model=List[ProductResponse])
def list_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    category: Optional[str] = None,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """
    Lista produtos com paginação e filtros.
    """
    query = db.query(Product)
    
    if category:
        query = query.filter(Product.category == category)
    
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | 
            Product.code.ilike(f"%{search}%")
        )
    
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    
    products = query.offset(skip).limit(limit).all()
    
    return [
        ProductResponse(
            id=p.id,
            code=p.code,
            name=p.name,
            category=p.category,
            description=p.description,
            ncm_code=p.ncm_code,
            cost_price=p.cost_price,
            sale_price=p.sale_price,
            min_sale_price=p.min_sale_price,
            stock_quantity=p.stock_quantity,
            min_stock=p.min_stock,
            max_stock=p.max_stock,
            unit=p.unit,
            weight_kg=p.weight_kg,
            dimensions=p.dimensions,
            is_active=p.is_active,
            is_featured=p.is_featured,
            total_sales=p.total_sales,
            total_revenue=p.total_revenue,
            last_sale_date=p.last_sale_date.isoformat() if p.last_sale_date else None,
            image_url=p.image_url,
            created_at=p.created_at.isoformat() if p.created_at else None,
            updated_at=p.updated_at.isoformat() if p.updated_at else None,
        )
        for p in products
    ]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """
    Obtém um produto por ID.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    return ProductResponse(
        id=product.id,
        code=product.code,
        name=product.name,
        category=product.category,
        description=product.description,
        ncm_code=product.ncm_code,
        cost_price=product.cost_price,
        sale_price=product.sale_price,
        min_sale_price=product.min_sale_price,
        stock_quantity=product.stock_quantity,
        min_stock=product.min_stock,
        max_stock=product.max_stock,
        unit=product.unit,
        weight_kg=product.weight_kg,
        dimensions=product.dimensions,
        is_active=product.is_active,
        is_featured=product.is_featured,
        total_sales=product.total_sales,
        total_revenue=product.total_revenue,
        last_sale_date=product.last_sale_date.isoformat() if product.last_sale_date else None,
        image_url=product.image_url,
        created_at=product.created_at.isoformat() if product.created_at else None,
        updated_at=product.updated_at.isoformat() if product.updated_at else None,
    )


@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Cria um novo produto.
    """
    # Verificar se código já existe (apenas produtos ativos)
    existing = db.query(Product).filter(
        Product.code == product.code,
        Product.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Código de produto já existe")
    
    new_product = Product(
        code=product.code,
        name=product.name,
        category=product.category,
        description=product.description,
        ncm_code=product.ncm_code,
        cost_price=product.cost_price,
        sale_price=product.sale_price,
        min_sale_price=product.min_sale_price,
        stock_quantity=product.stock_quantity,
        min_stock=product.min_stock,
        max_stock=product.max_stock,
        unit=product.unit,
        weight_kg=product.weight_kg,
        dimensions=product.dimensions,
        is_active=product.is_active,
        is_featured=product.is_featured,
        image_url=product.image_url,
        gallery_urls=json.dumps(product.gallery_urls) if product.gallery_urls else None,
    )
    
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    
    return ProductResponse(
        id=new_product.id,
        code=new_product.code,
        name=new_product.name,
        category=new_product.category,
        description=new_product.description,
        ncm_code=new_product.ncm_code,
        cost_price=new_product.cost_price,
        sale_price=new_product.sale_price,
        min_sale_price=new_product.min_sale_price,
        stock_quantity=new_product.stock_quantity,
        min_stock=new_product.min_stock,
        max_stock=new_product.max_stock,
        unit=new_product.unit,
        weight_kg=new_product.weight_kg,
        dimensions=new_product.dimensions,
        is_active=new_product.is_active,
        is_featured=new_product.is_featured,
        total_sales=new_product.total_sales,
        total_revenue=new_product.total_revenue,
        last_sale_date=new_product.last_sale_date.isoformat() if new_product.last_sale_date else None,
        image_url=new_product.image_url,
        created_at=new_product.created_at.isoformat() if new_product.created_at else None,
        updated_at=new_product.updated_at.isoformat() if new_product.updated_at else None,
    )


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza um produto existente (parcial).
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    update_data = product.model_dump(exclude_unset=True)
    
    # Converter dimensions para JSON se existir
    if "dimensions" in update_data and update_data["dimensions"]:
        import json
        # Se for dict, converte diretamente para JSON
        if isinstance(update_data["dimensions"], dict):
            update_data["dimensions"] = json.dumps(update_data["dimensions"])
        # Se for objeto Pydantic, usa model_dump()
        else:
            update_data["dimensions"] = json.dumps(update_data["dimensions"].model_dump())
    if "gallery_urls" in update_data and update_data["gallery_urls"]:
        import json
        update_data["gallery_urls"] = json.dumps(update_data["gallery_urls"])
    
    for field, value in update_data.items():
        setattr(db_product, field, value)
    
    db.commit()
    db.refresh(db_product)
    
    db_product_dict = db_product.to_dict()
    db_product_dict["profit_margin"] = db_product.profit_margin
    db_product_dict["is_low_stock"] = db_product.is_low_stock
    db_product_dict["stock_status"] = db_product.stock_status
    
    return db_product_dict


@router.put("/{product_id}", response_model=ProductResponse)
def update_product_put(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    """
    Atualiza um produto existente.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Atualizar apenas campos fornecidos
    update_data = product.__dict__
    for key, value in update_data.items():
        if value is not None:
            setattr(db_product, key, value)
    
    db.commit()
    db.refresh(db_product)
    
    return ProductResponse(
        id=db_product.id,
        code=db_product.code,
        name=db_product.name,
        category=db_product.category,
        description=db_product.description,
        ncm_code=db_product.ncm_code,
        cost_price=db_product.cost_price,
        sale_price=db_product.sale_price,
        min_sale_price=db_product.min_sale_price,
        stock_quantity=db_product.stock_quantity,
        min_stock=db_product.min_stock,
        max_stock=db_product.max_stock,
        unit=db_product.unit,
        weight_kg=db_product.weight_kg,
        dimensions=db_product.dimensions,
        is_active=db_product.is_active,
        is_featured=db_product.is_featured,
        total_sales=db_product.total_sales,
        total_revenue=db_product.total_revenue,
        last_sale_date=db_product.last_sale_date.isoformat() if db_product.last_sale_date else None,
        image_url=db_product.image_url,
        created_at=db_product.created_at.isoformat() if db_product.created_at else None,
        updated_at=db_product.updated_at.isoformat() if db_product.updated_at else None,
    )


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Deleta um produto.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    db.delete(db_product)
    db.commit()
    
    return {"message": "Produto deletado com sucesso"}
