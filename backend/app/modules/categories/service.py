"""
Category Service.
Applies cache-first strategy using Redis and manages category hierarchy.
"""

import json
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import ConflictException, NotFoundException
from app.core.logging import logger
from app.core.redis import redis_service
from app.modules.categories.models import Category
from app.modules.categories.repository import CategoryRepository
from app.modules.categories.schemas import (
    CategoryCreate,
    CategoryResponse,
    CategoryTreeResponse,
    CategoryUpdate,
)

CACHE_KEY_CATEGORIES_TREE = "cache:categories:tree"
CACHE_KEY_CATEGORIES_LIST = "cache:categories:list"
CACHE_TTL = 3600  # 1 hour


class CategoryService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CategoryRepository(db)

    async def get_all_categories(self) -> List[CategoryResponse]:
        # Check cache
        cached = await redis_service.get(CACHE_KEY_CATEGORIES_LIST)
        if cached:
            try:
                data = json.loads(cached)
                return [CategoryResponse(**item) for item in data]
            except Exception:
                pass

        categories = await self.repo.get_all_active()
        result = [CategoryResponse.model_validate(c) for c in categories]
        
        # Cache serialization
        await redis_service.set(
            CACHE_KEY_CATEGORIES_LIST,
            json.dumps([r.model_dump(mode="json") for r in result]),
            ex=CACHE_TTL,
        )
        return result

    async def get_tree(self) -> List[CategoryTreeResponse]:
        cached = await redis_service.get(CACHE_KEY_CATEGORIES_TREE)
        if cached:
            try:
                data = json.loads(cached)
                return [CategoryTreeResponse(**item) for item in data]
            except Exception:
                pass

        categories = await self.repo.get_all_active()
        
        # Build hierarchy tree
        lookup = {c.id: CategoryTreeResponse.model_validate(c) for c in categories}
        roots: List[CategoryTreeResponse] = []

        for c in categories:
            node = lookup[c.id]
            if c.parent_id and c.parent_id in lookup:
                lookup[c.parent_id].children.append(node)
            else:
                roots.append(node)

        await redis_service.set(
            CACHE_KEY_CATEGORIES_TREE,
            json.dumps([r.model_dump(mode="json") for r in roots]),
            ex=CACHE_TTL,
        )
        return roots

    async def get_by_slug(self, slug: str) -> CategoryResponse:
        cat = await self.repo.get_by_slug(slug)
        if not cat:
            raise NotFoundException(f"Category '{slug}' not found")
        return CategoryResponse.model_validate(cat)

    async def invalidate_cache(self) -> None:
        await redis_service.delete(CACHE_KEY_CATEGORIES_TREE)
        await redis_service.delete(CACHE_KEY_CATEGORIES_LIST)
        logger.info("Category cache invalidated.")

    async def create_category(self, req: CategoryCreate) -> CategoryResponse:
        existing = await self.repo.get_by_slug(req.slug)
        if existing:
            raise ConflictException(f"Category slug '{req.slug}' already exists")

        cat = Category(**req.model_dump())
        cat = await self.repo.create(cat)
        await self.invalidate_cache()
        return CategoryResponse.model_validate(cat)

    async def update_category(self, category_id: str, req: CategoryUpdate) -> CategoryResponse:
        cat = await self.repo.get_by_id(category_id)
        if not cat:
            raise NotFoundException("Category not found")

        update_data = req.model_dump(exclude_unset=True)
        for key, val in update_data.items():
            setattr(cat, key, val)

        cat = await self.repo.update(cat)
        await self.invalidate_cache()
        return CategoryResponse.model_validate(cat)

    async def delete_category(self, category_id: str) -> None:
        cat = await self.repo.get_by_id(category_id)
        if not cat:
            raise NotFoundException("Category not found")
        await self.repo.delete(cat)
        await self.invalidate_cache()
