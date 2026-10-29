"""
Cart Repository.
Handles persistent cart state for authenticated users and anonymous sessions.
"""

from typing import Optional
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.modules.cart.models import Cart, CartItem
from app.modules.products.models import ProductVariant


class CartRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_user_id(self, user_id: str) -> Optional[Cart]:
        stmt = (
            select(Cart)
            .where(Cart.user_id == user_id)
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.variant)
                .selectinload(ProductVariant.inventory)
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_session_token(self, session_token: str) -> Optional[Cart]:
        stmt = (
            select(Cart)
            .where(Cart.session_token == session_token)
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.variant)
                .selectinload(ProductVariant.inventory)
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def create_cart(self, user_id: Optional[str] = None, session_token: Optional[str] = None) -> Cart:
        cart = Cart(user_id=user_id, session_token=session_token)
        self.db.add(cart)
        await self.db.commit()
        await self.db.refresh(cart)
        return cart

    async def get_item_by_id(self, item_id: str) -> Optional[CartItem]:
        stmt = (
            select(CartItem)
            .where(CartItem.id == item_id)
            .options(selectinload(CartItem.variant).selectinload(ProductVariant.inventory))
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def save_item(self, item: CartItem) -> CartItem:
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def delete_item(self, item: CartItem) -> None:
        await self.db.delete(item)
        await self.db.commit()

    async def clear_cart(self, cart: Cart) -> None:
        for item in cart.items:
            await self.db.delete(item)
        await self.db.commit()

