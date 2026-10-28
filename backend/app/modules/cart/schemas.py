"""
Cart Pydantic Schemas.
"""

from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field
from app.modules.products.schemas import ProductVariantResponse


class CartItemBase(BaseModel):
    variant_id: str
    quantity: int = Field(..., gt=0, le=50)


class AddToCartRequest(CartItemBase):
    pass


class UpdateCartItemRequest(BaseModel):
    quantity: int = Field(..., gt=0, le=50)


class CartItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    variant_id: str
    quantity: int
    unit_price_cents: int
    total_price_cents: int
    variant: Optional[ProductVariantResponse] = None


class CartResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: Optional[str] = None
    session_token: Optional[str] = None
    items: List[CartItemResponse] = []
    total_quantity: int = 0
    subtotal_cents: int = 0
    currency: str = "USD"


class MergeCartRequest(BaseModel):
    session_token: str = Field(..., description="Guest session token to merge into user account")
