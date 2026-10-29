"""
Chapa Payment Gateway Provider Implementation.
Demonstrates multi-gateway abstraction for alternative processors.
"""

import uuid
from typing import Dict, Optional
from app.modules.payments.providers.base import (
    PaymentIntentResult,
    PaymentProvider,
    WebhookEvent,
)


class ChapaPaymentProvider(PaymentProvider):
    def __init__(self, secret_key: Optional[str] = None):
        self.secret_key = secret_key or "CHASECK_TEST_mock"

    async def create_payment_intent(
        self,
        amount_cents: int,
        currency: str,
        idempotency_key: str,
        metadata: Optional[Dict[str, str]] = None,
    ) -> PaymentIntentResult:
        chapa_tx_ref = f"chapa_{uuid.uuid4().hex[:16]}"
        return PaymentIntentResult(
            client_secret=f"chapa_checkout_{chapa_tx_ref}",
            payment_intent_id=chapa_tx_ref,
            amount_cents=amount_cents,
            currency=currency.upper(),
            status="pending",
        )

    async def verify_webhook_signature(
        self, payload: bytes, signature_header: str
    ) -> WebhookEvent:
        import json
        data = json.loads(payload.decode("utf-8"))
        return WebhookEvent(
            event_type="charge.complete",
            payment_intent_id=data.get("tx_ref", ""),
            amount_cents=int(data.get("amount", 0) * 100),
            currency=data.get("currency", "ETB"),
            status="succeeded",
            raw_data=data,
        )

    async def refund(
        self, payment_intent_id: str, amount_cents: Optional[int] = None
    ) -> bool:
        return True

