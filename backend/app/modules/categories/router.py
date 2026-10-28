"""
Categories Public Router.
Provides public category listings and hierarchical tree retrieval.
"""

from typing import List
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.categories.schemas import CategoryResponse, CategoryTreeResponse
from app.modules.categories.service import CategoryService

router = APIRouter(prefix="/categories", tags=["Categories"])


@router.get("", summary="Get category hierarchy or flat list")
async def get_categories(
    response: Response,
    tree: bool = Query(True, description="Return hierarchical tree or flat list"),
    db: AsyncSession = Depends(get_db),
):
    # Enable browser/CDN caching
    response.headers["Cache-Control"] = "public, max-age=300"
    service = CategoryService(db)
    if tree:
        return await service.get_tree()
    return await service.get_all_categories()


@router.get("/{slug}", response_model=CategoryResponse, summary="Get category details by slug")
async def get_category_by_slug(
    slug: str,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "public, max-age=300"
    service = CategoryService(db)
    return await service.get_by_slug(slug)
