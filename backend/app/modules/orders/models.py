"""
Orders and Order Items Database Models.
Implements financial accuracy using integer minor units (cents) and address snapshot preservation.
"""

import json
import uuid
from typing import List, Optional
from sqlalchemy import BigInteger, CheckConstraint, ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class Order(Base, TimestampMixin):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False, index=True)
    
    # Financial fields in minor units (cents)
    total_amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    tax_amount_cents: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    shipping_amount_cents: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    discount_amount_cents: Mapped[int] = mapped_column(BigInteger, default=0, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)

    # Address snapshots (immutable copy of customer address at order time)
    shipping_address_snapshot_json: Mapped[str] = mapped_column(Text, nullable=False)
    billing_address_snapshot_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    tracking_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    idempotency_key: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True, index=True)

    user: Mapped["User"] = relationship("User")  # type: ignore
    items: Mapped[List["OrderItem"]] = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan", lazy="selectin")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="order", cascade="all, delete-orphan")  # type: ignore

    @property
    def shipping_address(self) -> dict:
        try:
            return json.loads(self.shipping_address_snapshot_json)
        except Exception:
            return {}

    @shipping_address.setter
    def shipping_address(self, val: dict) -> None:
        self.shipping_address_snapshot_json = json.dumps(val)


class OrderItem(Base, TimestampMixin):
    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_order_item_quantity_positive"),
        CheckConstraint("unit_price_cents >= 0", name="check_order_item_price_non_negative"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    variant_id: Mapped[str] = mapped_column(String(36), ForeignKey("product_variants.id", ondelete="RESTRICT"), nullable=False, index=True)
    product_title: Mapped[str] = mapped_column(String(255), nullable=False)
    variant_sku: Mapped[str] = mapped_column(String(100), nullable=False)
    variant_attributes_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    unit_price_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total_price_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)

    order: Mapped["Order"] = relationship("Order", back_populates="items")
    variant: Mapped["ProductVariant"] = relationship("ProductVariant")  # type: ignore

