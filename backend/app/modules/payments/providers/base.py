"""
Payment Provider Abstract Protocol.
Enables pluggable payment gateways (Stripe, Chapa, etc.) without coupling business logic to vendor SDKs.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional
from pydantic import BaseModel


class PaymentIntentResult(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount_cents: int
    currency: str
    status: str


class WebhookEvent(BaseModel):
    event_type: str  # e.g., "payment_intent.succeeded", "payment_intent.payment_failed"
    payment_intent_id: str
    amount_cents: int
    currency: str
    status: str
    raw_data: Dict[str, Any] = {}


class PaymentProvider(ABC):
    @abstractmethod
    async def create_payment_intent(
        self,
        amount_cents: int,
        currency: str,
        idempotency_key: str,
        metadata: Optional[Dict[str, str]] = None,
    ) -> PaymentIntentResult:
        """Creates a payment intent on the external gateway with idempotency guarantee."""
        pass

    @abstractmethod
    async def verify_webhook_signature(
        self, payload: bytes, signature_header: str
    ) -> WebhookEvent:
        """Verifies cryptographic signature of inbound gateway webhook."""
        pass

    @abstractmethod
    async def refund(
        self, payment_intent_id: str, amount_cents: Optional[int] = None
    ) -> bool:
        """Processes partial or full refund."""
        pass
