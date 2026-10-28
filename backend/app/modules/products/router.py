"""
Public Products Router.
Provides cursor-paginated product catalog browsing, filtering, and detail lookups.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.products.schemas import (
    ProductCursorPage,
    ProductDetailResponse,
    ProductVariantResponse,
)
from app.modules.products.service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("", response_model=ProductCursorPage, summary="Browse catalog with multi-column filters and cursor pagination")
async def list_products(
    response: Response,
    category_id: Optional[str] = Query(None, description="Filter by category ID"),
    category_slug: Optional[str] = Query(None, description="Filter by category slug"),
    brand: Optional[str] = Query(None, description="Filter by brand"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price in cents"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price in cents"),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0, description="Minimum star rating"),
    is_featured: Optional[bool] = Query(None, description="Featured items only"),
    sort: str = Query("newest", pattern="^(newest|price_asc|price_desc|rating_desc)$"),
    cursor: Optional[str] = Query(None, description="Cursor for next page"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "public, max-age=60"
    service = ProductService(db)
    return await service.list_products(
        category_id=category_id,
        category_slug=category_slug,
        brand=brand,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        is_featured=is_featured,
        sort=sort,
        cursor=cursor,
        limit=limit,
    )


@router.get("/{slug_or_id}", response_model=ProductDetailResponse, summary="Get comprehensive product details")
async def get_product(
    slug_or_id: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "public, max-age=120"
    service = ProductService(db)
    return await service.get_product(slug_or_id)


@router.get("/{id}/variants", response_model=List[ProductVariantResponse], summary="Get variants and real-time stock levels")
async def get_product_variants(
    id: str,
    db: AsyncSession = Depends(get_db),
):
    service = ProductService(db)
    product = await service.get_product(id)
    return product.variants
