"""
Product, Variant, and Inventory Pydantic Schemas.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.modules.categories.schemas import CategoryResponse


class ProductImageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    url: str
    alt_text: Optional[str] = None
    sort_order: int
    is_primary: bool


class InventoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    quantity: int
    reserved_quantity: int
    available_quantity: int
    low_stock_threshold: int


class ProductVariantResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    sku: str
    title: str
    price_cents: int
    currency: str
    attributes: Dict[str, Any]
    is_active: bool
    inventory: Optional[InventoryResponse] = None


class ProductSummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    slug: str
    brand: str
    category_id: str
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    base_price_cents: int
    currency: str
    rating_avg: float
    review_count: int
    is_featured: bool
    primary_image_url: Optional[str] = None


class ProductDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    slug: str
    description: str
    brand: str
    base_price_cents: int
    currency: str
    rating_avg: float
    review_count: int
    is_active: bool
    is_featured: bool
    category: Optional[CategoryResponse] = None
    variants: List[ProductVariantResponse] = []
    images: List[ProductImageResponse] = []
    created_at: datetime


class ProductCursorPage(BaseModel):
    items: List[ProductSummaryResponse]
    next_cursor: Optional[str] = None
    has_next: bool
    limit: int


# Admin Schemas
class VariantCreateRequest(BaseModel):
    sku: str = Field(..., min_length=3, max_length=100)
    title: str = Field(..., min_length=2, max_length=150)
    price_cents: int = Field(..., ge=0)
    currency: str = "USD"
    attributes: Dict[str, Any] = {}
    initial_stock: int = Field(0, ge=0)


class ProductCreateRequest(BaseModel):
    category_id: str
    title: str = Field(..., min_length=2, max_length=255)
    slug: str = Field(..., min_length=2, max_length=280)
    description: str = Field(..., min_length=10)
    brand: str = Field(..., min_length=1, max_length=100)
    base_price_cents: int = Field(..., ge=0)
    currency: str = "USD"
    is_featured: bool = False
    variants: List[VariantCreateRequest] = []
    image_urls: List[str] = []


class ProductUpdateRequest(BaseModel):
    category_id: Optional[str] = None
    title: Optional[str] = Field(None, min_length=2, max_length=255)
    slug: Optional[str] = Field(None, min_length=2, max_length=280)
    description: Optional[str] = None
    brand: Optional[str] = None
    base_price_cents: Optional[int] = Field(None, ge=0)
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class InventoryUpdateRequest(BaseModel):
    quantity: int = Field(..., ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
