"""
Orders Repository.
Enforces transactional inventory reservation with row-level locks (with_for_update).
"""

import json
from typing import List, Optional, Tuple
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.exceptions import ConflictException
from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment
from app.modules.products.models import Inventory, ProductVariant


class OrderRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_idempotency_key(self, key: str) -> Optional[Order]:
        stmt = (
            select(Order)
            .where(Order.idempotency_key == key)
            .options(selectinload(Order.items))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, order_id: str) -> Optional[Order]:
        stmt = (
            select(Order)
            .where(Order.id == order_id)
            .options(selectinload(Order.items), selectinload(Order.payments))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_user_orders(
        self, user_id: str, cursor_id: Optional[str] = None, limit: int = 10
    ) -> Tuple[List[Order], Optional[str], bool]:
        stmt = (
            select(Order)
            .where(Order.user_id == user_id)
            .options(selectinload(Order.items))
            .order_by(Order.created_at.desc(), Order.id.desc())
        )

        if cursor_id:
            cursor_stmt = select(Order).where(Order.id == cursor_id)
            cursor_res = await self.db.execute(cursor_stmt)
            cursor_order = cursor_res.scalar_one_or_none()
            if cursor_order:
                stmt = stmt.where(
                    or_(
                        Order.created_at < cursor_order.created_at,
                        (Order.created_at == cursor_order.created_at) & (Order.id < cursor_order.id),
                    )
                )

        stmt = stmt.limit(limit + 1)
        result = await self.db.execute(stmt)
        orders = list(result.scalars().all())

        has_next = len(orders) > limit
        if has_next:
            orders = orders[:limit]
            next_cursor = orders[-1].id
        else:
            next_cursor = None

        return orders, next_cursor, has_next

    async def create_order_transactional(
        self,
        order: Order,
        items_data: List[dict],
        payment_intent_id: str,
    ) -> Order:
        """
        Executes atomic order creation with row-level locks on inventory to guarantee zero overselling.
        """
        # 1. Lock and decrement inventory for each variant
        for item in items_data:
            variant_id = item["variant_id"]
            qty = item["quantity"]

            # Pessimistic Row Lock: SELECT ... FOR UPDATE
            inv_stmt = (
                select(Inventory)
                .where(Inventory.variant_id == variant_id)
                .with_for_update()
            )
            inv_res = await self.db.execute(inv_stmt)
            inv = inv_res.scalar_one_or_none()

            if not inv:
                raise ConflictException(f"Inventory record missing for variant {variant_id}")

            if inv.available_quantity < qty:
                raise ConflictException(
                    f"Insufficient stock for '{item['product_title']}'. "
                    f"Requested: {qty}, Available: {inv.available_quantity}."
                )

            # Decrement available quantity
            inv.quantity -= qty

            # Create OrderItem
            order_item = OrderItem(
                order_id=order.id,
                variant_id=variant_id,
                product_title=item["product_title"],
                variant_sku=item["variant_sku"],
                variant_attributes_json=json.dumps(item.get("attributes", {})),
                unit_price_cents=item["unit_price_cents"],
                quantity=qty,
                total_price_cents=item["unit_price_cents"] * qty,
            )
            order.items.append(order_item)

        # 2. Add payment record
        payment = Payment(
            order_id=order.id,
            provider="stripe",
            provider_payment_intent_id=payment_intent_id,
            status="succeeded",
            amount_cents=order.total_amount_cents,
            currency=order.currency,
        )
        self.db.add(payment)

        # 3. Save order and commit
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order

    async def update_status(self, order: Order, new_status: str, tracking_number: Optional[str] = None) -> Order:
        order.status = new_status
        if tracking_number:
            order.tracking_number = tracking_number
        await self.db.commit()
        await self.db.refresh(order)
        return order
