"""
Orders and Checkout Router.
Customer-facing checkout flow, order placement, history tracking, and cancellation.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.modules.auth.models import User
from app.modules.orders.schemas import (
    CheckoutCalculateRequest,
    CheckoutCalculateResponse,
    OrderCreateRequest,
    OrderCursorPage,
    OrderResponse,
    PaymentIntentRequest,
    PaymentIntentResponse,
)
from app.modules.orders.service import OrderService

checkout_router = APIRouter(prefix="/checkout", tags=["Checkout"])
orders_router = APIRouter(prefix="/orders", tags=["Orders"])


# Checkout Endpoints
@checkout_router.post(
    "/calculate",
    response_model=CheckoutCalculateResponse,
    summary="Calculate checkout totals (subtotal, taxes, shipping, discounts)",
)
async def calculate_checkout(
    req: CheckoutCalculateRequest,
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.calculate_totals(req)


@checkout_router.post(
    "/create-intent",
    response_model=PaymentIntentResponse,
    summary="Generate Stripe PaymentIntent with idempotency guarantee",
)
async def create_payment_intent(
    req: PaymentIntentRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.create_payment_intent(current_user, req)


# Orders Endpoints
@orders_router.post(
    "",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit order with atomic inventory reservation",
)
async def submit_order(
    req: OrderCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.submit_order(current_user, req)


@orders_router.get(
    "",
    response_model=OrderCursorPage,
    summary="List authenticated customer order history (cursor-paginated)",
)
async def get_my_orders(
    cursor: Optional[str] = Query(None, description="Cursor for next page"),
    limit: int = Query(10, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.get_user_orders(user_id=current_user.id, cursor=cursor, limit=limit)


@orders_router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get single order details (IDOR protected)",
)
async def get_order_details(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.get_order_by_id(order_id, current_user)


@orders_router.post(
    "/{order_id}/cancel",
    response_model=OrderResponse,
    summary="Cancel order and restore stock",
)
async def cancel_order(
    order_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = OrderService(db)
    return await service.cancel_order(order_id, current_user)
