"""
Orders, Checkout, and Payment Pydantic Schemas.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AddressSnapshot(BaseModel):
    full_name: str = Field(..., min_length=2)
    phone: Optional[str] = None
    address_line1: str = Field(..., min_length=5)
    address_line2: Optional[str] = None
    city: str = Field(..., min_length=2)
    state: str = Field(..., min_length=2)
    postal_code: str = Field(..., min_length=3)
    country: str = "US"


class CheckoutCalculateItem(BaseModel):
    variant_id: str
    quantity: int = Field(..., gt=0)


class CheckoutCalculateRequest(BaseModel):
    items: List[CheckoutCalculateItem]
    state: Optional[str] = "CA"
    country: Optional[str] = "US"


class CheckoutCalculateResponse(BaseModel):
    subtotal_cents: int
    shipping_cents: int
    tax_cents: int
    discount_cents: int
    total_cents: int
    currency: str = "USD"


class PaymentIntentRequest(BaseModel):
    idempotency_key: str = Field(..., min_length=8)
    currency: str = "USD"


class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount_cents: int
    currency: str


class OrderCreateRequest(BaseModel):
    shipping_address: AddressSnapshot
    payment_intent_id: str = Field(..., min_length=5)
    idempotency_key: str = Field(..., min_length=8)
    notes: Optional[str] = None


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    variant_id: str
    product_title: str
    variant_sku: str
    unit_price_cents: int
    quantity: int
    total_price_cents: int


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    order_number: str
    user_id: str
    status: str
    total_amount_cents: int
    tax_amount_cents: int
    shipping_amount_cents: int
    discount_amount_cents: int
    currency: str
    shipping_address: Dict[str, Any]
    tracking_number: Optional[str] = None
    notes: Optional[str] = None
    items: List[OrderItemResponse] = []
    created_at: datetime


class OrderCursorPage(BaseModel):
    items: List[OrderResponse]
    next_cursor: Optional[str] = None
    has_next: bool
    limit: int


class OrderStatusUpdateRequest(BaseModel):
    status: str = Field(..., pattern="^(pending|paid|processing|shipped|delivered|cancelled|refunded)$")
    tracking_number: Optional[str] = None
