"""
Product Model - Sistema de Gerenciamento de Produtos
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, Index
from sqlalchemy.sql import func
from app.db.database import Base
import json


class Product(Base):
    """
    Modelo de Produto para o sistema de estoque e vendas.
    """
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    ncm_code = Column(String(20), nullable=True)  # Código NCM para notas fiscais
    
    # Categorização
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), nullable=True)
    material = Column(String(100), nullable=True)  # Matéria prima do produto
    
    # Preços
    cost_price = Column(Float, nullable=False, default=0.0)
    sale_price = Column(Float, nullable=False, default=0.0)
    min_sale_price = Column(Float, nullable=True)  # Preço mínimo para margem
    
    # Estoque
    stock_quantity = Column(Float, nullable=False, default=0.0)
    min_stock = Column(Float, nullable=False, default=0.0)  # Estoque mínimo
    max_stock = Column(Float, nullable=True)  # Estoque máximo
    unit = Column(String(20), nullable=False, default="UN")  # UN, KG, MT, etc.
    
    # Dados físicos
    weight_kg = Column(Float, nullable=True)
    dimensions = Column(Text, nullable=True)  # JSON: {"length": 10, "width": 5, "height": 3}
    
    # Fornecedor
    supplier_id = Column(Integer, nullable=True)
    supplier_code = Column(String(50), nullable=True)
    
    # Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_featured = Column(Boolean, default=False)  # Produto em destaque
    
    # Vendas
    total_sales = Column(Integer, default=0)  # Quantidade total vendida
    total_revenue = Column(Float, default=0.0)  # Receita total
    last_sale_date = Column(DateTime, nullable=True)
    
    # Imagens
    image_url = Column(String(500), nullable=True)
    gallery_urls = Column(Text, nullable=True)  # JSON array de URLs
    
    # Metadados
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Índices para otimização
    __table_args__ = (
        Index('idx_product_category', 'category'),
        Index('idx_product_active', 'is_active'),
        Index('idx_product_stock', 'stock_quantity', 'min_stock'),
    )

    def __repr__(self):
        return f"<Product(code='{self.code}', name='{self.name}', stock={self.stock_quantity})>"

    def to_dict(self):
        """Converte o produto para dicionário."""
        return {
            "id": self.id,
            "code": self.code,
            "name": self.name,
            "description": self.description,
            "ncm_code": self.ncm_code,
            "category": self.category,
            "subcategory": self.subcategory,
            "material": self.material,
            "cost_price": self.cost_price,
            "sale_price": self.sale_price,
            "min_sale_price": self.min_sale_price,
            "stock_quantity": self.stock_quantity,
            "min_stock": self.min_stock,
            "max_stock": self.max_stock,
            "unit": self.unit,
            "weight_kg": self.weight_kg,
            "dimensions": json.loads(self.dimensions) if self.dimensions else None,
            "supplier_id": self.supplier_id,
            "supplier_code": self.supplier_code,
            "is_active": self.is_active,
            "is_featured": self.is_featured,
            "total_sales": self.total_sales,
            "total_revenue": self.total_revenue,
            "last_sale_date": self.last_sale_date.isoformat() if self.last_sale_date else None,
            "image_url": self.image_url,
            "gallery_urls": json.loads(self.gallery_urls) if self.gallery_urls else [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

    @property
    def profit_margin(self):
        """Calcula a margem de lucro do produto."""
        if self.cost_price > 0:
            return ((self.sale_price - self.cost_price) / self.cost_price) * 100
        return 0.0

    @property
    def is_low_stock(self):
        """Verifica se o produto está com estoque baixo."""
        return self.stock_quantity <= self.min_stock

    @property
    def stock_status(self):
        """Retorna o status do estoque."""
        if self.stock_quantity <= 0:
            return "out_of_stock"
        elif self.stock_quantity <= self.min_stock:
            return "low_stock"
        elif self.max_stock and self.stock_quantity >= self.max_stock:
            return "full_stock"
        return "normal"


class ProductMovement(Base):
    """
    Registra movimentações de estoque (entradas e saídas).
    """
    __tablename__ = "product_movements"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, nullable=False, index=True)
    movement_type = Column(String(20), nullable=False)  # 'in', 'out', 'adjustment'
    quantity = Column(Float, nullable=False)
    
    # Referência
    order_id = Column(String(50), nullable=True)  # Pedido relacionado
    notes = Column(Text, nullable=True)
    
    # Dados do momento da movimentação
    previous_stock = Column(Float, nullable=False)
    new_stock = Column(Float, nullable=False)
    
    # Usuário que fez a movimentação
    user_id = Column(Integer, nullable=True)
    user_name = Column(String(100), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ProductMovement(product_id={self.product_id}, type='{self.movement_type}', qty={self.quantity})>"


class ProductCategory(Base):
    """
    Categorias de produtos.
    """
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    parent_id = Column(Integer, nullable=True)  # Para subcategorias
    
    # Dados de vendas agregados
    total_products = Column(Integer, default=0)
    total_sales = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    def __repr__(self):
        return f"<ProductCategory(name='{self.name}')>"
