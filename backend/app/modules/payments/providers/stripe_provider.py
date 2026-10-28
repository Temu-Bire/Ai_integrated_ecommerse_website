"""
Stripe Payment Provider Implementation.
Handles Stripe PaymentIntents, webhook signature validation, and dev/test mocking.
"""

import uuid
from typing import Dict, Optional
import stripe
from app.core.config import settings
from app.core.exceptions import BadRequestException
from app.core.logging import logger
from app.modules.payments.providers.base import (
    PaymentIntentResult,
    PaymentProvider,
    WebhookEvent,
)


class StripePaymentProvider(PaymentProvider):
    def __init__(self):
        stripe.api_key = settings.STRIPE_SECRET_KEY

    async def create_payment_intent(
        self,
        amount_cents: int,
        currency: str,
        idempotency_key: str,
        metadata: Optional[Dict[str, str]] = None,
    ) -> PaymentIntentResult:
        # If in dev/test mode with mock key, return predictable simulated intent
        if settings.STRIPE_SECRET_KEY.startswith("sk_test_mock") or settings.ENVIRONMENT == "test":
            simulated_id = f"pi_mock_{uuid.uuid4().hex[:16]}"
            return PaymentIntentResult(
                client_secret=f"{simulated_id}_secret_{uuid.uuid4().hex[:12]}",
                payment_intent_id=simulated_id,
                amount_cents=amount_cents,
                currency=currency.lower(),
                status="requires_payment_method",
            )

        try:
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.lower(),
                idempotency_key=idempotency_key,
                metadata=metadata or {},
                automatic_payment_methods={"enabled": True},
            )
            return PaymentIntentResult(
                client_secret=intent.client_secret,
                payment_intent_id=intent.id,
                amount_cents=intent.amount,
                currency=intent.currency,
                status=intent.status,
            )
        except stripe.error.StripeError as e:
            logger.error(f"Stripe PaymentIntent creation failed: {e}")
            raise BadRequestException(f"Payment gateway error: {e.user_message or str(e)}")

    async def verify_webhook_signature(
        self, payload: bytes, signature_header: str
    ) -> WebhookEvent:
        if settings.STRIPE_WEBHOOK_SECRET.startswith("whsec_mock") or settings.ENVIRONMENT == "test":
            # Test/mock payload verification
            import json
            try:
                data = json.loads(payload.decode("utf-8"))
                pi_obj = data.get("data", {}).get("object", {})
                return WebhookEvent(
                    event_type=data.get("type", "payment_intent.succeeded"),
                    payment_intent_id=pi_obj.get("id", "pi_mock_123"),
                    amount_cents=pi_obj.get("amount", 0),
                    currency=pi_obj.get("currency", "usd"),
                    status=pi_obj.get("status", "succeeded"),
                    raw_data=data,
                )
            except Exception as e:
                raise BadRequestException(f"Invalid webhook payload: {e}")

        try:
            event = stripe.Webhook.construct_event(
                payload, signature_header, settings.STRIPE_WEBHOOK_SECRET
            )
            pi_obj = event.data.object
            return WebhookEvent(
                event_type=event.type,
                payment_intent_id=pi_obj.id,
                amount_cents=getattr(pi_obj, "amount", 0),
                currency=getattr(pi_obj, "currency", "usd"),
                status=getattr(pi_obj, "status", "unknown"),
                raw_data=dict(event),
            )
        except stripe.error.SignatureVerificationError as e:
            logger.warning(f"Invalid Stripe webhook signature: {e}")
            raise BadRequestException("Invalid webhook signature")
        except Exception as e:
            logger.error(f"Stripe webhook parsing error: {e}")
            raise BadRequestException("Failed to parse Stripe webhook")

    async def refund(
        self, payment_intent_id: str, amount_cents: Optional[int] = None
    ) -> bool:
        if settings.STRIPE_SECRET_KEY.startswith("sk_test_mock") or settings.ENVIRONMENT == "test":
            return True
        try:
            stripe.Refund.create(payment_intent=payment_intent_id, amount=amount_cents)
            return True
        except stripe.error.StripeError as e:
            logger.error(f"Stripe refund failed for {payment_intent_id}: {e}")
            return False
