"""
Search Repository.
Implements Keyword Full-Text Search, Vector Cosine Distance, and Reciprocal Rank Fusion (RRF).
"""

import math
from typing import Dict, List, Optional, Tuple
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.modules.categories.models import Category
from app.modules.products.models import Product, ProductEmbedding


def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    """Calculates cosine similarity between two float vectors."""
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = math.sqrt(sum(a * a for a in v1))
    norm_b = math.sqrt(sum(b * b for b in v2))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


class SearchRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def keyword_search(
        self,
        query: str,
        category_slug: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        limit: int = 30,
    ) -> List[Tuple[Product, float]]:
        """
        Executes multi-term keyword search on title, brand, description, and search_text.
        Returns: [(Product, keyword_rank_score)]
        """
        terms = [t.strip().lower() for t in query.split() if t.strip()]
        if not terms:
            return []

        stmt = (
            select(Product)
            .where(Product.deleted_at.is_(None), Product.is_active.is_(True))
            .options(selectinload(Product.images), selectinload(Product.category))
        )

        if category_slug:
            stmt = stmt.join(Product.category).where(Category.slug == category_slug)
        if min_price is not None:
            stmt = stmt.where(Product.base_price_cents >= min_price)
        if max_price is not None:
            stmt = stmt.where(Product.base_price_cents <= max_price)

        # Match any or all terms
        conditions = []
        for term in terms:
            like_term = f"%{term}%"
            conditions.append(
                or_(
                    Product.title.ilike(like_term),
                    Product.brand.ilike(like_term),
                    Product.description.ilike(like_term),
                    Product.search_text.ilike(like_term),
                )
            )
        stmt = stmt.where(or_(*conditions)).limit(limit)

        result = await self.db.execute(stmt)
        products = list(result.scalars().all())

        # Score by term frequency in title/brand/description
        scored: List[Tuple[Product, float]] = []
        for p in products:
            score = 0.0
            full_text = f"{p.title} {p.brand} {p.description}".lower()
            for term in terms:
                if term in p.title.lower():
                    score += 3.0
                if term in p.brand.lower():
                    score += 2.0
                if term in full_text:
                    score += 1.0
            scored.append((p, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored

    async def vector_search(
        self,
        query_vector: List[float],
        category_slug: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        limit: int = 30,
    ) -> List[Tuple[Product, float]]:
        """
        Semantic vector search computing cosine distance against stored product embeddings.
        """
        stmt = (
            select(Product, ProductEmbedding)
            .join(ProductEmbedding, Product.id == ProductEmbedding.product_id)
            .where(Product.deleted_at.is_(None), Product.is_active.is_(True))
            .options(selectinload(Product.images), selectinload(Product.category))
        )

        if category_slug:
            stmt = stmt.join(Product.category).where(Category.slug == category_slug)
        if min_price is not None:
            stmt = stmt.where(Product.base_price_cents >= min_price)
        if max_price is not None:
            stmt = stmt.where(Product.base_price_cents <= max_price)

        result = await self.db.execute(stmt)
        rows = result.all()

        scored: List[Tuple[Product, float]] = []
        for prod, emb in rows:
            sim = cosine_similarity(query_vector, emb.vector)
            scored.append((prod, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:limit]

    def reciprocal_rank_fusion(
        self,
        keyword_results: List[Tuple[Product, float]],
        vector_results: List[Tuple[Product, float]],
        k: int = 60,
    ) -> List[Tuple[Product, float, str]]:
        """
        RRF algorithm blends keyword and semantic rankings deterministically:
        RRF(d) = sum(1 / (k + rank_i))
        """
        scores: Dict[str, float] = {}
        products_map: Dict[str, Product] = {}
        sources: Dict[str, set] = {}

        for rank, (prod, _) in enumerate(keyword_results):
            pid = prod.id
            products_map[pid] = prod
            scores[pid] = scores.get(pid, 0.0) + (1.0 / (k + rank + 1))
            sources.setdefault(pid, set()).add("keyword")

        for rank, (prod, _) in enumerate(vector_results):
            pid = prod.id
            products_map[pid] = prod
            scores[pid] = scores.get(pid, 0.0) + (1.0 / (k + rank + 1))
            sources.setdefault(pid, set()).add("semantic")

        fused = []
        for pid, score in scores.items():
            prod = products_map[pid]
            srcs = sources[pid]
            match_type = "hybrid" if len(srcs) > 1 else list(srcs)[0]
            fused.append((prod, score, match_type))

        fused.sort(key=lambda x: x[1], reverse=True)
        return fused

    async def get_autocomplete(self, prefix: str, limit: int = 8) -> List[Tuple[str, str, Optional[str]]]:
        """
        Returns prefix suggestions for products, brands, and categories.
        Tuple: (text, type, slug)
        """
        suggestions = []
        clean = f"%{prefix.strip()}%"

        # Match products
        prod_stmt = select(Product.title, Product.slug).where(Product.title.ilike(clean), Product.is_active.is_(True)).limit(limit)
        prod_res = await self.db.execute(prod_stmt)
        for title, slug in prod_res.all():
            suggestions.append((title, "product", slug))

        # Match categories
        cat_stmt = select(Category.name, Category.slug).where(Category.name.ilike(clean), Category.is_active.is_(True)).limit(limit)
        cat_res = await self.db.execute(cat_stmt)
        for name, slug in cat_res.all():
            suggestions.append((name, "category", slug))

        # Match distinct brands
        brand_stmt = select(Product.brand).where(Product.brand.ilike(clean), Product.is_active.is_(True)).distinct().limit(limit)
        brand_res = await self.db.execute(brand_stmt)
        for (brand,) in brand_res.all():
            suggestions.append((brand, "brand", None))

        return suggestions[:limit]
