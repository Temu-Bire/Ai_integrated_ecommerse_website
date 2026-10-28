"""
Orders and Checkout Service Business Logic.
Handles financial calculations, idempotent checkout, payment verification, and IDOR validation.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.dependencies import check_resource_ownership
from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.core.logging import logger
from app.modules.auth.models import User
from app.modules.cart.repository import CartRepository
from app.modules.orders.models import Order, OrderItem
from app.modules.orders.repository import OrderRepository
from app.modules.orders.schemas import (
    CheckoutCalculateRequest,
    CheckoutCalculateResponse,
    OrderCreateRequest,
    OrderCursorPage,
    OrderItemResponse,
    OrderResponse,
    PaymentIntentRequest,
    PaymentIntentResponse,
)
from app.modules.payments.providers.stripe_provider import StripePaymentProvider
from app.modules.products.repository import ProductRepository


class OrderService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = OrderRepository(db)
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)
        self.payment_provider = StripePaymentProvider()

    def _map_to_response(self, order: Order) -> OrderResponse:
        items_dto = [
            OrderItemResponse(
                id=item.id,
                variant_id=item.variant_id,
                product_title=item.product_title,
                variant_sku=item.variant_sku,
                unit_price_cents=item.unit_price_cents,
                quantity=item.quantity,
                total_price_cents=item.total_price_cents,
            )
            for item in order.items
        ]

        return OrderResponse(
            id=order.id,
            order_number=order.order_number,
            user_id=order.user_id,
            status=order.status,
            total_amount_cents=order.total_amount_cents,
            tax_amount_cents=order.tax_amount_cents,
            shipping_amount_cents=order.shipping_amount_cents,
            discount_amount_cents=order.discount_amount_cents,
            currency=order.currency,
            shipping_address=order.shipping_address,
            tracking_number=order.tracking_number,
            notes=order.notes,
            items=items_dto,
            created_at=order.created_at,
        )

    async def calculate_totals(self, req: CheckoutCalculateRequest) -> CheckoutCalculateResponse:
        subtotal = 0
        for item in req.items:
            variant = await self.product_repo.get_variant_by_id(item.variant_id)
            if not variant:
                raise NotFoundException(f"Variant {item.variant_id} not found")
            subtotal += variant.price_cents * item.quantity

        # Free shipping over $100 (10000 cents); otherwise $10 flat
        shipping = 0 if subtotal >= 10000 else 1000
        # 8% estimated tax
        tax = int(subtotal * 0.08)
        discount = 0
        total = subtotal + shipping + tax - discount

        return CheckoutCalculateResponse(
            subtotal_cents=subtotal,
            shipping_cents=shipping,
            tax_cents=tax,
            discount_cents=discount,
            total_cents=total,
            currency="USD",
        )

    async def create_payment_intent(
        self, user: User, req: PaymentIntentRequest
    ) -> PaymentIntentResponse:
        # Fetch user cart
        cart = await self.cart_repo.get_by_user_id(user.id)
        if not cart or not cart.items:
            raise BadRequestException("Cannot create payment intent for empty cart")

        subtotal = sum(i.quantity * i.unit_price_cents for i in cart.items)
        shipping = 0 if subtotal >= 10000 else 1000
        tax = int(subtotal * 0.08)
        total_cents = subtotal + shipping + tax

        result = await self.payment_provider.create_payment_intent(
            amount_cents=total_cents,
            currency=req.currency,
            idempotency_key=req.idempotency_key,
            metadata={"user_id": user.id, "cart_id": cart.id},
        )

        return PaymentIntentResponse(
            client_secret=result.client_secret,
            payment_intent_id=result.payment_intent_id,
            amount_cents=result.amount_cents,
            currency=result.currency,
        )

    async def submit_order(self, user: User, req: OrderCreateRequest) -> OrderResponse:
        # 1. Idempotency check: Return existing order if key was already processed
        existing = await self.order_repo.get_by_idempotency_key(req.idempotency_key)
        if existing:
            logger.info(f"Duplicate checkout submission detected. Returning existing order {existing.order_number}")
            return self._map_to_response(existing)

        # 2. Fetch user cart
        cart = await self.cart_repo.get_by_user_id(user.id)
        if not cart or not cart.items:
            raise BadRequestException("Your cart is empty. Please add items before checking out.")

        # 3. Prepare items data and calculate totals
        items_data = []
        subtotal = 0
        for item in cart.items:
            variant = await self.product_repo.get_variant_by_id(item.variant_id)
            if not variant:
                raise NotFoundException(f"Variant {item.variant_id} no longer available")
            unit_price = variant.price_cents
            subtotal += unit_price * item.quantity
            items_data.append({
                "variant_id": variant.id,
                "quantity": item.quantity,
                "unit_price_cents": unit_price,
                "product_title": variant.product.title if variant.product else variant.title,
                "variant_sku": variant.sku,
                "attributes": variant.attributes,
            })

        shipping = 0 if subtotal >= 10000 else 1000
        tax = int(subtotal * 0.08)
        total_cents = subtotal + shipping + tax

        # Generate unique order number (e.g., ORD-YYYYMMDD-XXXXXX)
        order_number = f"ORD-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        order_id = str(uuid.uuid4())

        order = Order(
            id=order_id,
            order_number=order_number,
            user_id=user.id,
            status="paid",  # payment confirmed via intent
            total_amount_cents=total_cents,
            tax_amount_cents=tax,
            shipping_amount_cents=shipping,
            discount_amount_cents=0,
            currency="USD",
            shipping_address_snapshot_json=json.dumps(req.shipping_address.model_dump()),
            notes=req.notes,
            idempotency_key=req.idempotency_key,
        )

        # Execute row-locked transactional order placement
        order = await self.order_repo.create_order_transactional(
            order=order,
            items_data=items_data,
            payment_intent_id=req.payment_intent_id,
        )

        # Clear cart on successful checkout
        await self.cart_repo.clear_cart(cart)
        logger.info(f"Order created successfully: {order.order_number} for user {user.email}")

        return self._map_to_response(order)

    async def get_user_orders(
        self, user_id: str, cursor: Optional[str] = None, limit: int = 10
    ) -> OrderCursorPage:
        orders, next_cursor, has_next = await self.order_repo.get_user_orders(
            user_id=user_id, cursor_id=cursor, limit=limit
        )
        return OrderCursorPage(
            items=[self._map_to_response(o) for o in orders],
            next_cursor=next_cursor,
            has_next=has_next,
            limit=limit,
        )

    async def get_order_by_id(self, order_id: str, current_user: User) -> OrderResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")

        # Insecure Direct Object Reference (IDOR) check
        check_resource_ownership(order.user_id, current_user, admin_bypass=True)

        return self._map_to_response(order)

    async def cancel_order(self, order_id: str, current_user: User) -> OrderResponse:
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            raise NotFoundException("Order not found")

        # IDOR check
        check_resource_ownership(order.user_id, current_user, admin_bypass=True)

        if order.status not in ("pending", "paid"):
            raise BadRequestException(f"Cannot cancel order in '{order.status}' status")

        # Restore inventory
        for item in order.items:
            inv = await self.product_repo.get_variant_by_id(item.variant_id)
            if inv and inv.inventory:
                inv.inventory.quantity += item.quantity
                await self.db.commit()

        order = await self.order_repo.update_status(order, "cancelled")
        logger.info(f"Order {order.order_number} cancelled by user {current_user.email}")
        return self._map_to_response(order)
