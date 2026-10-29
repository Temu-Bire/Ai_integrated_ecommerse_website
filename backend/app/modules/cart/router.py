"""
Cart Router.
Provides endpoints for guest and authenticated customer carts.
"""

from typing import Optional
from fastapi import APIRouter, Cookie, Depends, Header, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.dependencies import get_current_user, get_optional_current_user
from app.modules.auth.models import User
from app.modules.cart.schemas import (
    AddToCartRequest,
    CartResponse,
    MergeCartRequest,
    UpdateCartItemRequest,
)
from app.modules.cart.service import CartService

router = APIRouter(prefix="/cart", tags=["Cart"])


def resolve_cart_identity(
    current_user: Optional[User],
    session_header: Optional[str],
    session_cookie: Optional[str],
) -> tuple[Optional[str], Optional[str]]:
    if current_user:
        return current_user.id, None
    token = session_header or session_cookie or "anonymous_session"
    return None, token


@router.get("", response_model=CartResponse, summary="Retrieve active shopping cart")
async def get_cart(
    current_user: Optional[User] = Depends(get_optional_current_user),
    x_session_token: Optional[str] = Header(None),
    cart_session: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_token = resolve_cart_identity(current_user, x_session_token, cart_session)
    service = CartService(db)
    return await service.get_cart(user_id=user_id, session_token=session_token)


@router.post("/items", response_model=CartResponse, summary="Add product variant to cart")
async def add_item(
    req: AddToCartRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    x_session_token: Optional[str] = Header(None),
    cart_session: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_token = resolve_cart_identity(current_user, x_session_token, cart_session)
    service = CartService(db)
    return await service.add_item(req, user_id=user_id, session_token=session_token)


@router.patch("/items/{item_id}", response_model=CartResponse, summary="Update cart item quantity")
async def update_item(
    item_id: str,
    req: UpdateCartItemRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    x_session_token: Optional[str] = Header(None),
    cart_session: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_token = resolve_cart_identity(current_user, x_session_token, cart_session)
    service = CartService(db)
    return await service.update_item(item_id, req, user_id=user_id, session_token=session_token)


@router.delete("/items/{item_id}", response_model=CartResponse, summary="Remove item from cart")
async def remove_item(
    item_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    x_session_token: Optional[str] = Header(None),
    cart_session: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_token = resolve_cart_identity(current_user, x_session_token, cart_session)
    service = CartService(db)
    return await service.remove_item(item_id, user_id=user_id, session_token=session_token)


@router.post("/merge", response_model=CartResponse, summary="Merge guest session cart into user account upon login")
async def merge_cart(
    req: MergeCartRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = CartService(db)
    return await service.merge_carts(user_id=current_user.id, guest_session_token=req.session_token)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT, summary="Clear active cart")
async def clear_cart(
    current_user: Optional[User] = Depends(get_optional_current_user),
    x_session_token: Optional[str] = Header(None),
    cart_session: Optional[str] = Cookie(None),
    db: AsyncSession = Depends(get_db),
):
    user_id, session_token = resolve_cart_identity(current_user, x_session_token, cart_session)
    service = CartService(db)
    await service.clear_cart(user_id=user_id, session_token=session_token)
    return None

