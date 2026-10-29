"""
Product Repository.
Handles indexed catalog filtering, cursor-based pagination, and relational joins.
"""

from typing import List, Optional, Tuple
from sqlalchemy import desc, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.modules.categories.models import Category
from app.modules.products.models import (
    Inventory,
    Product,
    ProductEmbedding,
    ProductImage,
    ProductVariant,
)


class ProductRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_paginated(
        self,
        category_id: Optional[str] = None,
        category_slug: Optional[str] = None,
        brand: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        min_rating: Optional[float] = None,
        is_featured: Optional[bool] = None,
        sort: str = "newest",
        cursor_id: Optional[str] = None,
        limit: int = 20,
    ) -> Tuple[List[Product], Optional[str], bool]:
        """
        Executes cursor-paginated catalog query with multi-column filtering.
        Returns: (items, next_cursor, has_next)
        """
        stmt = (
            select(Product)
            .where(Product.deleted_at.is_(None), Product.is_active.is_(True))
            .options(selectinload(Product.images), selectinload(Product.category))
        )

        if category_id:
            stmt = stmt.where(Product.category_id == category_id)
        elif category_slug:
            stmt = stmt.join(Product.category).where(Category.slug == category_slug)

        if brand:
            stmt = stmt.where(Product.brand.ilike(brand))
        if min_price is not None:
            stmt = stmt.where(Product.base_price_cents >= min_price)
        if max_price is not None:
            stmt = stmt.where(Product.base_price_cents <= max_price)
        if min_rating is not None:
            stmt = stmt.where(Product.rating_avg >= min_rating)
        if is_featured is not None:
            stmt = stmt.where(Product.is_featured == is_featured)

        # Ordering
        if sort == "price_asc":
            stmt = stmt.order_by(Product.base_price_cents.asc(), Product.id.asc())
        elif sort == "price_desc":
            stmt = stmt.order_by(Product.base_price_cents.desc(), Product.id.asc())
        elif sort == "rating_desc":
            stmt = stmt.order_by(Product.rating_avg.desc(), Product.id.asc())
        else:  # newest
            stmt = stmt.order_by(Product.created_at.desc(), Product.id.desc())

        # Cursor pagination
        if cursor_id:
            cursor_stmt = select(Product).where(Product.id == cursor_id)
            cursor_res = await self.db.execute(cursor_stmt)
            cursor_prod = cursor_res.scalar_one_or_none()
            if cursor_prod:
                if sort == "newest":
                    stmt = stmt.where(
                        or_(
                            Product.created_at < cursor_prod.created_at,
                            (Product.created_at == cursor_prod.created_at) & (Product.id < cursor_prod.id),
                        )
                    )
                elif sort == "price_asc":
                    stmt = stmt.where(
                        or_(
                            Product.base_price_cents > cursor_prod.base_price_cents,
                            (Product.base_price_cents == cursor_prod.base_price_cents) & (Product.id > cursor_prod.id),
                        )
                    )

        # Fetch limit + 1 to know if there's a next page
        stmt = stmt.limit(limit + 1)
        result = await self.db.execute(stmt)
        products = list(result.scalars().all())

        has_next = len(products) > limit
        if has_next:
            products = products[:limit]
            next_cursor = products[-1].id
        else:
            next_cursor = None

        return products, next_cursor, has_next

    async def get_by_id_or_slug(self, identifier: str) -> Optional[Product]:
        stmt = (
            select(Product)
            .where(
                or_(Product.id == identifier, Product.slug == identifier),
                Product.deleted_at.is_(None),
            )
            .options(
                selectinload(Product.category),
                selectinload(Product.images),
                selectinload(Product.variants).selectinload(ProductVariant.inventory),
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_variant_by_id(self, variant_id: str) -> Optional[ProductVariant]:
        stmt = (
            select(ProductVariant)
            .where(ProductVariant.id == variant_id)
            .options(selectinload(ProductVariant.inventory))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_product(self, product: Product) -> Product:
        self.db.add(product)
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def update_product(self, product: Product) -> Product:
        await self.db.commit()
        await self.db.refresh(product)
        return product

    async def update_inventory(
        self, variant_id: str, quantity: int, low_stock_threshold: Optional[int] = None
    ) -> Inventory:
        stmt = select(Inventory).where(Inventory.variant_id == variant_id)
        result = await self.db.execute(stmt)
        inv = result.scalar_one_or_none()
        if not inv:
            inv = Inventory(
                variant_id=variant_id,
                quantity=quantity,
                low_stock_threshold=low_stock_threshold or 5,
            )
            self.db.add(inv)
        else:
            inv.quantity = quantity
            if low_stock_threshold is not None:
                inv.low_stock_threshold = low_stock_threshold
        await self.db.commit()
        await self.db.refresh(inv)
        return inv

