"""
Public Search Router.
Provides hybrid keyword/semantic search and instant autocomplete.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.modules.search.schemas import AutocompleteResponse, SearchResponse
from app.modules.search.service import SearchService

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("", response_model=SearchResponse, summary="Hybrid keyword + semantic catalog search")
async def search_catalog(
    response: Response,
    q: str = Query(..., min_length=1, description="Search term or natural language description"),
    category: Optional[str] = Query(None, description="Category slug"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price in cents"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price in cents"),
    mode: str = Query("hybrid", pattern="^(hybrid|keyword|semantic)$"),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    response.headers["Cache-Control"] = "public, max-age=30"
    service = SearchService(db)
    return await service.search(
        query=q,
        category_slug=category,
        min_price=min_price,
        max_price=max_price,
        mode=mode,
        limit=limit,
    )


@router.get("/autocomplete", response_model=AutocompleteResponse, summary="Fast prefix autocomplete suggestions")
async def autocomplete(
    q: str = Query(..., min_length=2, description="Prefix to autocomplete"),
    db: AsyncSession = Depends(get_db),
):
    service = SearchService(db)
    return await service.autocomplete(q)
