"""
Search and Discovery Pydantic Schemas.
"""

from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class SearchResultItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    title: str
    slug: str
    brand: str
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
    base_price_cents: int
    currency: str
    rating_avg: float
    review_count: int
    primary_image_url: Optional[str] = None
    score: float
    match_type: str  # "keyword", "semantic", "hybrid"


class SearchResponse(BaseModel):
    items: List[SearchResultItem]
    total: int
    query: str
    mode: str
    elapsed_ms: float


class AutocompleteItem(BaseModel):
    text: str
    type: str  # "product", "brand", "category"
    slug: Optional[str] = None


class AutocompleteResponse(BaseModel):
    query: str
    suggestions: List[AutocompleteItem]
