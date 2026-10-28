"""
Cart Service Business Logic.
Manages stock validation, session cart merging upon authentication, and totals calculation.
"""

from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import BadRequestException, ConflictException, NotFoundException
from app.core.logging import logger
from app.modules.cart.models import Cart, CartItem
from app.modules.cart.repository import CartRepository
from app.modules.cart.schemas import (
    AddToCartRequest,
    CartItemResponse,
    CartResponse,
    UpdateCartItemRequest,
)
from app.modules.products.repository import ProductRepository
from app.modules.products.schemas import ProductVariantResponse


class CartService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.cart_repo = CartRepository(db)
        self.product_repo = ProductRepository(db)

    def _map_to_response(self, cart: Cart) -> CartResponse:
        items_dto = []
        subtotal = 0
        total_qty = 0

        for item in cart.items:
            variant_dto = None
            if item.variant:
                variant_dto = ProductVariantResponse(
                    id=item.variant.id,
                    sku=item.variant.sku,
                    title=item.variant.title,
                    price_cents=item.variant.price_cents,
                    currency=item.variant.currency,
                    attributes=item.variant.attributes,
                    is_active=item.variant.is_active,
                )

            total_item_cents = item.quantity * item.unit_price_cents
            subtotal += total_item_cents
            total_qty += item.quantity

            items_dto.append(
                CartItemResponse(
                    id=item.id,
                    variant_id=item.variant_id,
                    quantity=item.quantity,
                    unit_price_cents=item.unit_price_cents,
                    total_price_cents=total_item_cents,
                    variant=variant_dto,
                )
            )

        return CartResponse(
            id=cart.id,
            user_id=cart.user_id,
            session_token=cart.session_token,
            items=items_dto,
            total_quantity=total_qty,
            subtotal_cents=subtotal,
            currency="USD",
        )

    async def get_or_create_cart(
        self, user_id: Optional[str] = None, session_token: Optional[str] = None
    ) -> Cart:
        if user_id:
            cart = await self.cart_repo.get_by_user_id(user_id)
            if not cart:
                cart = await self.cart_repo.create_cart(user_id=user_id)
            return cart
        elif session_token:
            cart = await self.cart_repo.get_by_session_token(session_token)
            if not cart:
                cart = await self.cart_repo.create_cart(session_token=session_token)
            return cart
        else:
            raise BadRequestException("Either user_id or session_token is required")

    async def get_cart(
        self, user_id: Optional[str] = None, session_token: Optional[str] = None
    ) -> CartResponse:
        cart = await self.get_or_create_cart(user_id=user_id, session_token=session_token)
        return self._map_to_response(cart)

    async def add_item(
        self,
        req: AddToCartRequest,
        user_id: Optional[str] = None,
        session_token: Optional[str] = None,
    ) -> CartResponse:
        # Validate variant exists and is active
        variant = await self.product_repo.get_variant_by_id(req.variant_id)
        if not variant or not variant.is_active:
            raise NotFoundException("Product variant not available")

        # Validate stock
        available = variant.inventory.available_quantity if variant.inventory else 0
        if available < req.quantity:
            raise ConflictException(f"Only {available} units available in stock")

        cart = await self.get_or_create_cart(user_id=user_id, session_token=session_token)

        # Check if item already in cart
        existing_item = next((i for i in cart.items if i.variant_id == req.variant_id), None)
        if existing_item:
            new_qty = existing_item.quantity + req.quantity
            if available < new_qty:
                raise ConflictException(f"Cannot add {req.quantity} more. Total requested exceeds available stock ({available}).")
            existing_item.quantity = new_qty
            await self.cart_repo.save_item(existing_item)
        else:
            new_item = CartItem(
                cart_id=cart.id,
                variant_id=req.variant_id,
                quantity=req.quantity,
                unit_price_cents=variant.price_cents,
            )
            cart.items.append(new_item)
            await self.cart_repo.save_item(new_item)

        await self.db.commit()
        self.db.expire(cart)
        cart = await self.get_or_create_cart(user_id=user_id, session_token=session_token)
        return self._map_to_response(cart)

    async def update_item(
        self,
        item_id: str,
        req: UpdateCartItemRequest,
        user_id: Optional[str] = None,
        session_token: Optional[str] = None,
    ) -> CartResponse:
        item = await self.cart_repo.get_item_by_id(item_id)
        if not item:
            raise NotFoundException("Cart item not found")

        # Check ownership
        cart = await self.get_or_create_cart(user_id=user_id, session_token=session_token)
        if item.cart_id != cart.id:
            raise NotFoundException("Cart item not in active cart")

        # Check stock
        available = item.variant.inventory.available_quantity if item.variant and item.variant.inventory else 0
        if available < req.quantity:
            raise ConflictException(f"Only {available} units available in stock")

        item.quantity = req.quantity
        await self.cart_repo.save_item(item)
        cart = await self.get_or_create_cart(user_id=user_id, session_token=session_token)
        return self._map_to_response(cart)

    async def remove_item(
        self,
        item_id: str,
        user_id: Optional[str] = None,
        session_token: Optional[str] = None,
    ) -> CartResponse:
        item = await self.cart_repo.get_item_by_id(item_id)
        if not item:
            raise NotFoundException("Cart item not found")

        cart = await self.get_or_create_cart(user_id=user_id, session_token=session_token)
        if item.cart_id != cart.id:
            raise NotFoundException("Cart item not in active cart")

        await self.cart_repo.delete_item(item)
        cart = await self.get_or_create_cart(user_id=user_id, session_token=session_token)
        return self._map_to_response(cart)

    async def clear_cart(
        self, user_id: Optional[str] = None, session_token: Optional[str] = None
    ) -> None:
        cart = await self.get_or_create_cart(user_id=user_id, session_token=session_token)
        await self.cart_repo.clear_cart(cart)

    async def merge_carts(self, user_id: str, guest_session_token: str) -> CartResponse:
        """
        Merges guest cart items into authenticated user cart upon login.
        """
        guest_cart = await self.cart_repo.get_by_session_token(guest_session_token)
        if not guest_cart or not guest_cart.items:
            return await self.get_cart(user_id=user_id)

        user_cart = await self.get_or_create_cart(user_id=user_id)

        for g_item in guest_cart.items:
            existing = next((i for i in user_cart.items if i.variant_id == g_item.variant_id), None)
            if existing:
                existing.quantity += g_item.quantity
                await self.cart_repo.save_item(existing)
            else:
                new_item = CartItem(
                    cart_id=user_cart.id,
                    variant_id=g_item.variant_id,
                    quantity=g_item.quantity,
                    unit_price_cents=g_item.unit_price_cents,
                )
                user_cart.items.append(new_item)
                await self.cart_repo.save_item(new_item)

        # Clear guest cart after successful merge
        await self.cart_repo.clear_cart(guest_cart)
        self.db.expire(user_cart)
        logger.info(f"Merged guest cart ({guest_session_token}) into user cart ({user_id})")

        return await self.get_cart(user_id=user_id)
