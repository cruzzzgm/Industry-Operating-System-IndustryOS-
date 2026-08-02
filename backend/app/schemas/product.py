"""
Product Schemas - Schemas Pydantic para Produtos
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime
from decimal import Decimal


class ProductDimension(BaseModel):
    """Dimensões do produto."""
    diameter: Optional[str] = None
    height: Optional[str] = None
    hole: Optional[str] = None
    length: Optional[float] = None
    width: Optional[float] = None
    thickness: Optional[float] = None


class ProductBase(BaseModel):
    """Schema base para produtos."""
    code: str = Field(..., min_length=1, max_length=50, description="Código único do produto")
    name: str = Field(..., min_length=1, max_length=200, description="Nome do produto")
    description: Optional[str] = Field(None, max_length=1000)
    ncm_code: Optional[str] = Field(None, max_length=20, description="Código NCM")
    
    category: str = Field(..., min_length=1, max_length=100)
    subcategory: Optional[str] = Field(None, max_length=100)
    material: Optional[str] = Field(None, max_length=100)
    
    cost_price: Decimal = Field(default=Decimal("0.00"), ge=0, description="Preço de custo")
    sale_price: Decimal = Field(default=Decimal("0.00"), ge=0, description="Preço de venda")
    min_sale_price: Optional[Decimal] = Field(None, ge=0, description="Preço mínimo")
    
    stock_quantity: float = Field(default=0.0, ge=0, description="Quantidade em estoque")
    min_stock: float = Field(default=0.0, ge=0, description="Estoque mínimo")
    max_stock: Optional[float] = Field(None, ge=0, description="Estoque máximo")
    unit: str = Field(default="UN", max_length=20, description="Unidade de medida")
    
    weight_kg: Optional[float] = Field(None, ge=0, description="Peso em kg")
    dimensions: Optional[ProductDimension] = None
    
    supplier_id: Optional[int] = None
    supplier_code: Optional[str] = Field(None, max_length=50)
    
    is_active: bool = Field(default=True)
    is_featured: bool = Field(default=False)
    
    image_url: Optional[str] = Field(None, max_length=500)
    gallery_urls: List[str] = Field(default_factory=list)


class ProductCreate(ProductBase):
    """Schema para criação de produto."""
    pass


class ProductUpdate(BaseModel):
    """Schema para atualização parcial de produto."""
    code: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=200)
    description: Optional[str] = None
    ncm_code: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    material: Optional[str] = Field(None, max_length=100)
    cost_price: Optional[Decimal] = Field(None, ge=0)
    sale_price: Optional[Decimal] = Field(None, ge=0)
    min_sale_price: Optional[Decimal] = None
    stock_quantity: Optional[float] = Field(None, ge=0)
    min_stock: Optional[float] = None
    max_stock: Optional[float] = None
    unit: Optional[str] = None
    weight_kg: Optional[float] = None
    dimensions: Optional[ProductDimension] = None
    supplier_id: Optional[int] = None
    supplier_code: Optional[str] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    image_url: Optional[str] = None
    gallery_urls: Optional[List[str]] = None


class ProductResponse(ProductBase):
    """Schema de resposta completa para produto."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    total_sales: int = 0
    total_revenue: Decimal = Decimal("0.00")
    last_sale_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    # Campos calculados
    profit_margin: Optional[float] = None
    is_low_stock: Optional[bool] = None
    stock_status: Optional[str] = None


class ProductListResponse(BaseModel):
    """Resposta paginada de produtos."""
    items: List[ProductResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ProductFilter(BaseModel):
    """Filtros para busca de produtos."""
    search: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None  # 'active', 'inactive', 'low_stock', 'out_of_stock'
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    sort_by: str = Field(default="created_at")
    sort_order: str = Field(default="desc")


class ProductMovementBase(BaseModel):
    """Schema base para movimentação de estoque."""
    product_id: int
    movement_type: str = Field(..., pattern="^(in|out|adjustment)$")
    quantity: float
    notes: Optional[str] = None
    order_id: Optional[str] = None


class ProductMovementCreate(ProductMovementBase):
    """Schema para criar movimentação."""
    user_id: Optional[int] = None
    user_name: Optional[str] = None


class ProductMovementResponse(ProductMovementBase):
    """Resposta de movimentação."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    previous_stock: float
    new_stock: float
    user_id: Optional[int]
    user_name: Optional[str]
    created_at: datetime


class ProductCategoryBase(BaseModel):
    """Schema base para categoria."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    parent_id: Optional[int] = None


class ProductCategoryCreate(ProductCategoryBase):
    """Schema para criar categoria."""
    pass


class ProductCategoryResponse(ProductCategoryBase):
    """Resposta de categoria."""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    total_products: int
    total_sales: int
    total_revenue: Decimal
    is_active: bool
    created_at: datetime


class ProductStats(BaseModel):
    """Estatísticas de produtos."""
    total_products: int
    active_products: int
    low_stock_count: int
    out_of_stock_count: int
    total_inventory_value: Decimal
    total_revenue: Decimal
    top_selling_products: List[Dict[str, Any]]
    categories_distribution: List[Dict[str, Any]]
