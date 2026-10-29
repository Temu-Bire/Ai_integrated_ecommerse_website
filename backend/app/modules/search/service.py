"""
Search Service.
Orchestrates hybrid keyword + semantic search and autocomplete with Redis caching.
"""

import json
import time
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.redis import redis_service
from app.modules.search.repository import SearchRepository
from app.modules.search.schemas import (
    AutocompleteItem,
    AutocompleteResponse,
    SearchResponse,
    SearchResultItem,
)

CACHE_TTL_SEARCH = 180  # 3 minutes


class SearchService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SearchRepository(db)

    async def search(
        self,
        query: str,
        category_slug: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        mode: str = "hybrid",  # "hybrid", "keyword", "semantic"
        limit: int = 20,
    ) -> SearchResponse:
        start_time = time.time()
        q = query.strip()
        if not q:
            return SearchResponse(items=[], total=0, query="", mode=mode, elapsed_ms=0.0)

        # 1. Keyword search
        keyword_results = []
        if mode in ("hybrid", "keyword"):
            keyword_results = await self.repo.keyword_search(
                query=q,
                category_slug=category_slug,
                min_price=min_price,
                max_price=max_price,
                limit=limit * 2,
            )

        # 2. Semantic vector search (mock query embedding for zero-cost search or LLM provider)
        vector_results = []
        if mode in ("hybrid", "semantic"):
            # Compute a synthetic deterministic query embedding from query string
            # In Phase 5 this plugs into the real embedding provider
            query_vector = self._generate_query_vector(q)
            vector_results = await self.repo.vector_search(
                query_vector=query_vector,
                category_slug=category_slug,
                min_price=min_price,
                max_price=max_price,
                limit=limit * 2,
            )

        # 3. Fusion
        if mode == "hybrid":
            fused_list = self.repo.reciprocal_rank_fusion(keyword_results, vector_results)
        elif mode == "keyword":
            fused_list = [(p, score, "keyword") for p, score in keyword_results]
        else:
            fused_list = [(p, score, "semantic") for p, score in vector_results]

        # Map to DTOs
        items: List[SearchResultItem] = []
        for prod, score, match_type in fused_list[:limit]:
            primary_img = None
            if prod.images:
                for img in prod.images:
                    if img.is_primary:
                        primary_img = img.url
                        break
                if not primary_img:
                    primary_img = prod.images[0].url

            items.append(
                SearchResultItem(
                    id=prod.id,
                    title=prod.title,
                    slug=prod.slug,
                    brand=prod.brand,
                    category_name=prod.category.name if prod.category else None,
                    category_slug=prod.category.slug if prod.category else None,
                    base_price_cents=prod.base_price_cents,
                    currency=prod.currency,
                    rating_avg=prod.rating_avg,
                    review_count=prod.review_count,
                    primary_image_url=primary_img,
                    score=round(score, 4),
                    match_type=match_type,
                )
            )

        elapsed = (time.time() - start_time) * 1000.0
        return SearchResponse(
            items=items,
            total=len(items),
            query=q,
            mode=mode,
            elapsed_ms=round(elapsed, 2),
        )

    async def autocomplete(self, query: str) -> AutocompleteResponse:
        q = query.strip()
        if len(q) < 2:
            return AutocompleteResponse(query=q, suggestions=[])

        cache_key = f"cache:autocomplete:{q.lower()}"
        cached = await redis_service.get(cache_key)
        if cached:
            try:
                data = json.loads(cached)
                return AutocompleteResponse(**data)
            except Exception:
                pass

        results = await self.repo.get_autocomplete(q, limit=8)
        suggestions = [
            AutocompleteItem(text=text, type=item_type, slug=slug)
            for text, item_type, slug in results
        ]
        res = AutocompleteResponse(query=q, suggestions=suggestions)
        await redis_service.set(cache_key, json.dumps(res.model_dump(mode="json")), ex=CACHE_TTL_SEARCH)
        return res

    def _generate_query_vector(self, query: str, dim: int = 8) -> List[float]:
        """Generates a deterministic vector representation for text."""
        import hashlib
        v = []
        for i in range(dim):
            h = hashlib.md5(f"{query}:{i}".encode()).hexdigest()
            val = (int(h[:4], 16) / 32768.0) - 1.0  # normalize between -1.0 and 1.0
            v.append(val)
        return v

