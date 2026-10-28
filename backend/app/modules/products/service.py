"""
Product Service.
Implements business logic, Redis response caching, and inventory adjustments.
"""

import hashlib
import json
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictException, NotFoundException
from app.core.logging import logger
from app.core.redis import redis_service
from app.modules.products.models import Inventory, Product, ProductImage, ProductVariant
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import (
    InventoryResponse,
    InventoryUpdateRequest,
    ProductCreateRequest,
    ProductCursorPage,
    ProductDetailResponse,
    ProductImageResponse,
    ProductSummaryResponse,
    ProductUpdateRequest,
    ProductVariantResponse,
)

CACHE_TTL_PRODUCTS = 300  # 5 minutes


class ProductService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ProductRepository(db)

    def _map_to_summary(self, product: Product) -> ProductSummaryResponse:
        primary_img = None
        for img in product.images:
            if img.is_primary:
                primary_img = img.url
                break
        if not primary_img and product.images:
            primary_img = product.images[0].url

        return ProductSummaryResponse(
            id=product.id,
            title=product.title,
            slug=product.slug,
            brand=product.brand,
            category_id=product.category_id,
            category_name=product.category.name if product.category else None,
            category_slug=product.category.slug if product.category else None,
            base_price_cents=product.base_price_cents,
            currency=product.currency,
            rating_avg=product.rating_avg,
            review_count=product.review_count,
            is_featured=product.is_featured,
            primary_image_url=primary_img,
        )

    def _map_to_detail(self, product: Product) -> ProductDetailResponse:
        variants = []
        for v in product.variants:
            inv_dto = None
            if v.inventory:
                inv_dto = InventoryResponse(
                    quantity=v.inventory.quantity,
                    reserved_quantity=v.inventory.reserved_quantity,
                    available_quantity=v.inventory.available_quantity,
                    low_stock_threshold=v.inventory.low_stock_threshold,
                )
            variants.append(
                ProductVariantResponse(
                    id=v.id,
                    sku=v.sku,
                    title=v.title,
                    price_cents=v.price_cents,
                    currency=v.currency,
                    attributes=v.attributes,
                    is_active=v.is_active,
                    inventory=inv_dto,
                )
            )

        images = [
            ProductImageResponse(
                id=img.id,
                url=img.url,
                alt_text=img.alt_text,
                sort_order=img.sort_order,
                is_primary=img.is_primary,
            )
            for img in product.images
        ]

        from app.modules.categories.schemas import CategoryResponse
        cat_dto = CategoryResponse.model_validate(product.category) if product.category else None

        return ProductDetailResponse(
            id=product.id,
            title=product.title,
            slug=product.slug,
            description=product.description,
            brand=product.brand,
            base_price_cents=product.base_price_cents,
            currency=product.currency,
            rating_avg=product.rating_avg,
            review_count=product.review_count,
            is_active=product.is_active,
            is_featured=product.is_featured,
            category=cat_dto,
            variants=variants,
            images=images,
            created_at=product.created_at,
        )

    async def list_products(
        self,
        category_id: Optional[str] = None,
        category_slug: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        min_rating: Optional[float] = None,
        is_featured: Optional[bool] = None,
        sort: str = "newest",
        cursor: Optional[str] = None,
        limit: int = 20,
    ) -> ProductCursorPage:
        # Cache key based on hash of parameters
        cache_params = f"{category_id}:{category_slug}:{brand}:{min_price}:{max_price}:{min_rating}:{is_featured}:{sort}:{cursor}:{limit}"
        cache_hash = hashlib.md5(cache_params.encode()).hexdigest()
        cache_key = f"cache:products:page:{cache_hash}"

        cached = await redis_service.get(cache_key)
        if cached:
            try:
                return ProductCursorPage(**json.loads(cached))
            except Exception:
                pass

        products, next_cursor, has_next = await self.repo.get_paginated(
            category_id=category_id,
            category_slug=category_slug,
            brand=brand,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            is_featured=is_featured,
            sort=sort,
            cursor_id=cursor,
            limit=limit,
        )

        items = [self._map_to_summary(p) for p in products]
        page = ProductCursorPage(
            items=items,
            next_cursor=next_cursor,
            has_next=has_next,
            limit=limit,
        )

        await redis_service.set(cache_key, json.dumps(page.model_dump(mode="json")), ex=CACHE_TTL_PRODUCTS)
        return page

    async def get_product(self, identifier: str) -> ProductDetailResponse:
        cache_key = f"cache:product:{identifier}"
        cached = await redis_service.get(cache_key)
        if cached:
            try:
                return ProductDetailResponse(**json.loads(cached))
            except Exception:
                pass

        product = await self.repo.get_by_id_or_slug(identifier)
        if not product or product.deleted_at is not None:
            raise NotFoundException("Product not found")

        detail = self._map_to_detail(product)
        await redis_service.set(cache_key, json.dumps(detail.model_dump(mode="json")), ex=CACHE_TTL_PRODUCTS)
        return detail

    async def create_product(self, req: ProductCreateRequest) -> ProductDetailResponse:
        existing = await self.repo.get_by_id_or_slug(req.slug)
        if existing:
            raise ConflictException(f"Product slug '{req.slug}' already exists")

        search_text = f"{req.title} {req.brand} {req.description}"
        product = Product(
            category_id=req.category_id,
            title=req.title,
            slug=req.slug,
            description=req.description,
            brand=req.brand,
            base_price_cents=req.base_price_cents,
            currency=req.currency,
            is_featured=req.is_featured,
            search_text=search_text,
        )
        self.db.add(product)
        await self.db.flush()

        # Add variants
        for v_req in req.variants:
            variant = ProductVariant(
                product_id=product.id,
                sku=v_req.sku,
                title=v_req.title,
                price_cents=v_req.price_cents,
                currency=v_req.currency,
                attributes_json=json.dumps(v_req.attributes),
            )
            self.db.add(variant)
            await self.db.flush()

            inv = Inventory(
                variant_id=variant.id,
                quantity=v_req.initial_stock,
                low_stock_threshold=5,
            )
            self.db.add(inv)

        # Add images
        for idx, url in enumerate(req.image_urls):
            img = ProductImage(
                product_id=product.id,
                url=url,
                sort_order=idx,
                is_primary=(idx == 0),
            )
            self.db.add(img)

        await self.db.commit()
        await self.invalidate_cache(product.slug)
        return await self.get_product(product.id)

    async def update_product(self, product_id: str, req: ProductUpdateRequest) -> ProductDetailResponse:
        product = await self.repo.get_by_id_or_slug(product_id)
        if not product:
            raise NotFoundException("Product not found")

        update_dict = req.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(product, key, val)

        if "title" in update_dict or "description" in update_dict or "brand" in update_dict:
            product.search_text = f"{product.title} {product.brand} {product.description}"

        await self.repo.update_product(product)
        await self.invalidate_cache(product.slug)
        return await self.get_product(product.id)

    async def delete_product(self, product_id: str) -> None:
        product = await self.repo.get_by_id_or_slug(product_id)
        if not product:
            raise NotFoundException("Product not found")
        product.deleted_at = datetime.now(timezone.utc)
        await self.repo.update_product(product)
        await self.invalidate_cache(product.slug)

    async def update_inventory(self, variant_id: str, req: InventoryUpdateRequest) -> InventoryResponse:
        inv = await self.repo.update_inventory(variant_id, req.quantity, req.low_stock_threshold)
        variant = await self.repo.get_variant_by_id(variant_id)
        if variant:
            await self.invalidate_cache(variant.product_id)
        return InventoryResponse(
            quantity=inv.quantity,
            reserved_quantity=inv.reserved_quantity,
            available_quantity=inv.available_quantity,
            low_stock_threshold=inv.low_stock_threshold,
        )

    async def invalidate_cache(self, identifier: Optional[str] = None) -> None:
        if identifier:
            await redis_service.delete(f"cache:product:{identifier}")
        logger.info("Product cache invalidated.")
