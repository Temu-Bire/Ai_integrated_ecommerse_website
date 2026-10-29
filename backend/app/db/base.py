"""
Database Base Metadata Registry.
Imports all models to register them on the Declarative Base metadata.
"""

from app.core.database import Base
from app.modules.auth.models import (
    AuditLog,
    EmailVerificationToken,
    PasswordResetToken,
    RefreshToken,
    Role,
    User,
)
from app.modules.users.models import Address
from app.modules.categories.models import Category
from app.modules.products.models import (
    Inventory,
    Product,
    ProductEmbedding,
    ProductImage,
    ProductVariant,
)
from app.modules.cart.models import Cart, CartItem
from app.modules.orders.models import Order, OrderItem
from app.modules.payments.models import Payment
from app.modules.reviews.models import Review, Wishlist
from app.modules.ai.models import AssistantConversation, AssistantMessage

__all__ = [
    "Base",
    "Role",
    "User",
    "RefreshToken",
    "EmailVerificationToken",
    "PasswordResetToken",
    "AuditLog",
    "Address",
    "Category",
    "Product",
    "ProductVariant",
    "Inventory",
    "ProductImage",
    "ProductEmbedding",
    "Cart",
    "CartItem",
    "Order",
    "OrderItem",
    "Payment",
    "Review",
    "Wishlist",
    "AssistantConversation",
    "AssistantMessage",
]

