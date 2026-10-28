"""
Payments Database Model.
Supports multiple payment providers (Stripe, Chapa) via polymorphic provider fields.
"""

import json
import uuid
from typing import Optional
from sqlalchemy import BigInteger, ForeignKey, Index, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class Payment(Base, TimestampMixin):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id: Mapped[str] = mapped_column(String(36), ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    provider: Mapped[str] = mapped_column(String(50), default="stripe", nullable=False, index=True)
    provider_payment_intent_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(30), default="initiated", nullable=False, index=True)
    amount_cents: Mapped[int] = mapped_column(BigInteger, nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    payment_method_details_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    order: Mapped["Order"] = relationship("Order", back_populates="payments")  # type: ignore

    @property
    def payment_method_details(self) -> dict:
        try:
            return json.loads(self.payment_method_details_json)
        except Exception:
            return {}

    @payment_method_details.setter
    def payment_method_details(self, val: dict) -> None:
        self.payment_method_details_json = json.dumps(val)
