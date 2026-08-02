"""
Products API Routes - Rotas para gerenciamento de produtos
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from decimal import Decimal

from app.db.database import get_db
from app.models.product import Product, ProductMovement, ProductCategory
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    ProductFilter, ProductMovementCreate, ProductMovementResponse,
    ProductCategoryCreate, ProductCategoryResponse, ProductStats
)

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    sort_by: str = Query("created_at", pattern="^(code|name|category|sale_price|stock_quantity|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db)
):
    """
    Lista produtos com paginação e filtros.
    """
    query = db.query(Product)
    
    # Filtros
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_filter)) |
            (Product.code.ilike(search_filter)) |
            (Product.description.ilike(search_filter))
        )
    
    if category:
        query = query.filter(Product.category == category)
    
    if status:
        if status == "active":
            query = query.filter(Product.is_active == True)
        elif status == "inactive":
            query = query.filter(Product.is_active == False)
        elif status == "low_stock":
            query = query.filter(Product.stock_quantity <= Product.min_stock)
        elif status == "out_of_stock":
            query = query.filter(Product.stock_quantity <= 0)
    
    # Ordenação
    sort_column = getattr(Product, sort_by, Product.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Paginação
    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    
    # Adicionar campos calculados
    response_items = []
    for item in items:
        item_dict = item.to_dict()
        item_dict["profit_margin"] = item.profit_margin
        item_dict["is_low_stock"] = item.is_low_stock
        item_dict["stock_status"] = item.stock_status
        response_items.append(item_dict)
    
    return {
        "items": response_items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Obtém detalhes de um produto específico.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    product_dict = product.to_dict()
    product_dict["profit_margin"] = product.profit_margin
    product_dict["is_low_stock"] = product.is_low_stock
    product_dict["stock_status"] = product.stock_status
    
    return product_dict


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    """
    Cria um novo produto.
    """
    print(f"=== DEBUG CREATE PRODUCT ===")
    print(f"Product received: {product}")
    print(f"Product material: {product.material}")
    print(f"Product dimensions: {product.dimensions}")
    
    # Verificar código único
    existing = db.query(Product).filter(Product.code == product.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Código de produto já existe")
    
    # Converter dimensions para JSON se existir
    import json
    product_data = product.model_dump()
    if product_data.get("dimensions"):
        # Se for dict, converte diretamente para JSON
        if isinstance(product_data["dimensions"], dict):
            product_data["dimensions"] = json.dumps(product_data["dimensions"])
        # Se for objeto Pydantic, usa model_dump()
        else:
            product_data["dimensions"] = json.dumps(product_data["dimensions"].model_dump())
    # Converter gallery_urls para JSON (mesmo se for lista vazia)
    if "gallery_urls" in product_data:
        product_data["gallery_urls"] = json.dumps(product_data["gallery_urls"])
    
    db_product = Product(**product_data)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    
    print(f"=== PRODUCT SAVED TO DB ===")
    print(f"DB Product material: {db_product.material}")
    print(f"DB Product dimensions: {db_product.dimensions}")
    print(f"DB Product to_dict: {db_product.to_dict()}")
    
    db_product_dict = db_product.to_dict()
    db_product_dict["profit_margin"] = db_product.profit_margin
    db_product_dict["is_low_stock"] = db_product.is_low_stock
    db_product_dict["stock_status"] = db_product.stock_status
    
    return db_product_dict


@router.patch("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db)
):
    """
    Atualiza um produto existente (parcial).
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    update_data = product_update.model_dump(exclude_unset=True)
    
    print(f"=== DEBUG UPDATE PRODUCT ===")
    print(f"Product ID: {product_id}")
    print(f"Update data: {update_data}")
    print(f"Code in update_data: {update_data.get('code')}")
    
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


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """
    Remove um produto (soft delete - desativa).
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    db_product.is_active = False
    db.commit()
    
    return None


@router.post("/{product_id}/movement", response_model=ProductMovementResponse)
async def create_stock_movement(
    product_id: int,
    movement: ProductMovementCreate,
    db: Session = Depends(get_db)
):
    """
    Registra uma movimentação de estoque.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    
    # Calcular novo estoque
    previous_stock = product.stock_quantity
    
    if movement.movement_type == "in":
        new_stock = previous_stock + movement.quantity
    elif movement.movement_type == "out":
        new_stock = previous_stock - movement.quantity
        if new_stock < 0:
            raise HTTPException(status_code=400, detail="Estoque insuficiente")
    else:  # adjustment
        new_stock = movement.quantity
    
    # Criar movimentação
    db_movement = ProductMovement(
        product_id=product_id,
        movement_type=movement.movement_type,
        quantity=movement.quantity,
        notes=movement.notes,
        order_id=movement.order_id,
        previous_stock=previous_stock,
        new_stock=new_stock,
        user_id=movement.user_id,
        user_name=movement.user_name
    )
    db.add(db_movement)
    
    # Atualizar estoque do produto
    product.stock_quantity = new_stock
    
    db.commit()
    db.refresh(db_movement)
    
    return db_movement


@router.get("/{product_id}/movements", response_model=List[ProductMovementResponse])
async def list_product_movements(
    product_id: int,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Lista movimentações de estoque de um produto.
    """
    movements = db.query(ProductMovement).filter(
        ProductMovement.product_id == product_id
    ).order_by(ProductMovement.created_at.desc()).limit(limit).all()
    
    return movements


@router.get("/categories/list", response_model=List[ProductCategoryResponse])
async def list_categories(
    db: Session = Depends(get_db)
):
    """
    Lista todas as categorias de produtos.
    """
    categories = db.query(ProductCategory).filter(
        ProductCategory.is_active == True
    ).order_by(ProductCategory.name).all()
    
    return categories


@router.post("/categories", response_model=ProductCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    category: ProductCategoryCreate,
    db: Session = Depends(get_db)
):
    """
    Cria uma nova categoria.
    """
    existing = db.query(ProductCategory).filter(ProductCategory.name == category.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Categoria já existe")
    
    db_category = ProductCategory(**category.model_dump())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    
    return db_category


@router.get("/stats/overview", response_model=ProductStats)
async def get_product_stats(
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas gerais de produtos.
    """
    from sqlalchemy import func
    
    total_products = db.query(Product).count()
    active_products = db.query(Product).filter(Product.is_active == True).count()
    low_stock = db.query(Product).filter(Product.stock_quantity <= Product.min_stock).count()
    out_of_stock = db.query(Product).filter(Product.stock_quantity <= 0).count()
    
    inventory_value = db.query(func.sum(Product.stock_quantity * Product.cost_price)).scalar() or 0
    total_revenue = db.query(func.sum(Product.total_revenue)).scalar() or 0
    
    # Top produtos mais vendidos
    top_products = db.query(Product).order_by(Product.total_sales.desc()).limit(5).all()
    top_selling = [
        {"id": p.id, "name": p.name, "total_sales": p.total_sales, "total_revenue": float(p.total_revenue)}
        for p in top_products
    ]
    
    # Distribuição por categoria
    categories = db.query(
        Product.category,
        func.count(Product.id).label("count"),
        func.sum(Product.total_revenue).label("revenue")
    ).group_by(Product.category).all()
    
    categories_dist = [
        {"name": c.category, "count": c.count, "revenue": float(c.revenue or 0)}
        for c in categories
    ]
    
    return {
        "total_products": total_products,
        "active_products": active_products,
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "total_inventory_value": Decimal(str(inventory_value)),
        "total_revenue": Decimal(str(total_revenue)),
        "top_selling_products": top_selling,
        "categories_distribution": categories_dist
    }
