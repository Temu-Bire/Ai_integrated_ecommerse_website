"""
AI Assistant, Streaming Chat, Recommendations & Admin AI Router.
Provides SSE streaming chat, vector similarity recommendations, and admin AI generation tools.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, Header, Query, Request, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user, require_role
from app.modules.ai.service import AIService
from app.modules.auth.models import User

router = APIRouter(prefix="/assistant", tags=["AI Shopping Assistant"])
rec_router = APIRouter(prefix="/recommendations", tags=["Recommendations"])
admin_ai_router = APIRouter(
    prefix="/admin/ai",
    tags=["Admin AI Tools"],
    dependencies=[Depends(require_role("admin"))],
)


class ChatRequest(BaseModel):
    session_id: str = Field(..., min_length=4)
    message: str = Field(..., min_length=1, max_length=2000)


class FeedbackRequest(BaseModel):
    rating: int = Field(..., ge=-1, le=1)  # 1 for up, -1 for down


class GenerateDescriptionRequest(BaseModel):
    title: str = Field(..., min_length=2)
    brand: str = Field(..., min_length=1)
    attributes: Dict[str, Any] = {}


# --- Assistant Chat Endpoints ---
@router.post("/chat", summary="Stream conversational AI responses via Server-Sent Events (SSE)")
async def chat_endpoint(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db, current_user)
    generator = service.stream_chat(session_id=req.session_id, prompt=req.message)

    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# --- Recommendations Endpoints ---
@rec_router.get("/similar/{product_id}", summary="Get similar products via vector cosine similarity")
async def get_similar_products(
    product_id: str,
    limit: int = Query(4, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db)
    return await service.get_similar_products(product_id=product_id, limit=limit)


@rec_router.get("/for-you", summary="Get personalized recommendations feed")
async def get_recommended_for_you(
    limit: int = Query(4, ge=1, le=12),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    from app.modules.products.repository import ProductRepository
    repo = ProductRepository(db)
    products, _, _ = await repo.get_paginated(is_featured=True, limit=limit)
    return [
        {
            "id": p.id,
            "title": p.title,
            "slug": p.slug,
            "brand": p.brand,
            "price_cents": p.base_price_cents,
            "rating_avg": p.rating_avg,
            "primary_image_url": p.images[0].url if p.images else None,
        }
        for p in products
    ]


# --- Admin AI Tools Endpoints ---
@admin_ai_router.post("/generate-description", summary="Generate product description & SEO copy with AI")
async def generate_description(
    req: GenerateDescriptionRequest,
    db: AsyncSession = Depends(get_db),
):
    service = AIService(db)
    return await service.generate_product_description(
        title=req.title, brand=req.brand, attributes=req.attributes
    )

