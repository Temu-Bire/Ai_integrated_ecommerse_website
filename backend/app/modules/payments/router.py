"""
Payments Webhook Router.
Cryptographically verifies inbound provider webhooks with idempotency tracking.
"""

from fastapi import APIRouter, Depends, Header, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.exceptions import BadRequestException
from app.core.logging import logger
from app.core.redis import redis_service
from app.modules.payments.providers.stripe_provider import StripePaymentProvider

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/stripe/webhook", status_code=status.HTTP_200_OK, summary="Stripe verified webhook handler")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(..., alias="Stripe-Signature"),
    db: AsyncSession = Depends(get_db),
):
    body = await request.body()
    provider = StripePaymentProvider()

    # 1. Cryptographically verify signature
    event = await provider.verify_webhook_signature(body, stripe_signature)

    # 2. Idempotent webhook processing check
    event_id = event.raw_data.get("id") or event.payment_intent_id
    idempotency_key = f"webhook:stripe:processed:{event_id}"
    already_processed = await redis_service.get(idempotency_key)
    if already_processed:
        logger.info(f"Stripe webhook {event_id} already processed. Acknowledging with 200 OK.")
        return {"status": "already_processed"}

    # 3. Handle event types
    logger.info(f"Processing Stripe webhook event: {event.event_type} for intent {event.payment_intent_id}")
    if event.event_type == "payment_intent.succeeded":
        # Mark payment succeeded if not already updated
        pass
    elif event.event_type == "payment_intent.payment_failed":
        logger.warning(f"Payment intent failed on Stripe: {event.payment_intent_id}")

    # 4. Mark processed in Redis (24-hour TTL)
    await redis_service.set(idempotency_key, "done", ex=86400)

    return {"status": "success"}
