"""
AI Assistant & Recommendations Orchestration Service.
Manages SSE streaming, conversation persistence, tool execution loops, and recommendation algorithms.
"""

import json
import uuid
from typing import Any, AsyncGenerator, Dict, List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.exceptions import NotFoundException
from app.core.logging import logger
from app.modules.ai.models import AssistantConversation, AssistantMessage
from app.modules.ai.providers.base import LLMMessage
from app.modules.ai.providers.factory import get_llm_provider
from app.modules.ai.tools.registry import ToolDispatcher
from app.modules.auth.models import User
from app.modules.products.models import Product, ProductEmbedding
from app.modules.search.repository import cosine_similarity


SYSTEM_PROMPT = """You are Nova, the expert AI shopping concierge for NovaMart AI E-Commerce.
Your objective is to help shoppers discover, compare, and purchase high-performance electronics and creator hardware.

Rules & Guardrails:
1. Ground all recommendations, stock figures, and prices in our actual store database tools. NEVER hallucinate prices, specifications, or inventory.
2. If the user asks about orders or personal account data, call `get_my_orders`. If the user is unauthenticated, gently ask them to sign in.
3. When suggesting products, return relevant details so the customer can review specifications.
4. If asked about return policies, warranties, or shipping rates, call `get_store_policies`.
5. Keep your tone professional, concise, technologically knowledgeable, and friendly.
"""


class AIService:
    def __init__(self, db: AsyncSession, current_user: Optional[User] = None):
        self.db = db
        self.current_user = current_user
        self.provider = get_llm_provider()
        self.dispatcher = ToolDispatcher(db, current_user)

    async def get_or_create_conversation(
        self, session_id: str, title: Optional[str] = None
    ) -> AssistantConversation:
        stmt = (
            select(AssistantConversation)
            .where(AssistantConversation.session_id == session_id)
            .options(selectinload(AssistantConversation.messages))
        )
        res = await self.db.execute(stmt)
        conv = res.scalar_one_or_none()

        if not conv:
            conv = AssistantConversation(
                session_id=session_id,
                user_id=self.current_user.id if self.current_user else None,
                title=title or "Shopping Session",
            )
            self.db.add(conv)
            await self.db.commit()
            await self.db.refresh(conv)

        return conv

    async def stream_chat(
        self, session_id: str, prompt: str
    ) -> AsyncGenerator[str, None]:
        """
        Orchestrates conversational agent loop over Server-Sent Events (SSE).
        Yields formatted SSE chunks: data: {...}\n\n
        """
        conv = await self.get_or_create_conversation(session_id)

        # 1. Persist user message
        user_msg = AssistantMessage(
            conversation_id=conv.id,
            role="user",
            content=prompt,
        )
        self.db.add(user_msg)
        await self.db.commit()

        # 2. Build conversational history window
        history_msgs = [LLMMessage(role="system", content=SYSTEM_PROMPT)]
        for m in conv.messages[-6:]:  # Bounded sliding window
            history_msgs.append(LLMMessage(role=m.role, content=m.content))
        history_msgs.append(LLMMessage(role="user", content=prompt))

        # 3. Stream from provider
        accumulated_text = ""
        structured_cards = []

        try:
            async for chunk in self.provider.stream_chat(history_msgs):
                if chunk.token:
                    accumulated_text += chunk.token
                    event_payload = json.dumps({"type": "token", "content": chunk.token})
                    yield f"data: {event_payload}\n\n"

                # If the LLM requests a tool call
                if chunk.tool_calls:
                    for call in chunk.tool_calls:
                        yield f"data: {json.dumps({'type': 'tool_call', 'name': call.name})}\n\n"
                        tool_result = await self.dispatcher.execute_tool(call.name, call.arguments)

                        # Check if tool produced structured product cards or recommendations
                        if "products" in tool_result:
                            structured_cards.extend(tool_result["products"])
                            yield f"data: {json.dumps({'type': 'product_cards', 'cards': tool_result['products']})}\n\n"
                        elif "comparison" in tool_result:
                            yield f"data: {json.dumps({'type': 'comparison', 'data': tool_result['comparison']})}\n\n"
                        elif "type" in tool_result and tool_result["type"] == "cart_suggestion":
                            yield f"data: {json.dumps({'type': 'cart_suggestion', 'suggestion': tool_result})}\n\n"

                        # Send tool output back into model for natural follow-up
                        history_msgs.append(
                            LLMMessage(
                                role="tool",
                                content=json.dumps(tool_result),
                                tool_call_id=call.id,
                            )
                        )
                        async for follow_up in self.provider.stream_chat(history_msgs):
                            if follow_up.token:
                                accumulated_text += follow_up.token
                                yield f"data: {json.dumps({'type': 'token', 'content': follow_up.token})}\n\n"

            # 4. Persist assistant final response
            asst_msg = AssistantMessage(
                conversation_id=conv.id,
                role="assistant",
                content=accumulated_text or "How else can I assist you with your hardware selection?",
                structured_data_json=json.dumps({"cards": structured_cards}) if structured_cards else None,
            )
            self.db.add(asst_msg)
            await self.db.commit()

        except Exception as e:
            logger.error(f"Error in AI stream_chat: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': 'AI temporarily unavailable. Falling back to search.'})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    async def get_similar_products(self, product_id: str, limit: int = 4) -> List[Dict[str, Any]]:
        """Calculates nearest neighbors via cosine similarity on product embeddings."""
        stmt = select(ProductEmbedding).where(ProductEmbedding.product_id == product_id)
        res = await self.db.execute(stmt)
        target_emb = res.scalar_one_or_none()

        if not target_emb:
            # Fallback to products in the same category
            prod_stmt = select(Product).where(Product.id == product_id)
            target_prod = (await self.db.execute(prod_stmt)).scalar_one_or_none()
            if not target_prod:
                return []
            fallback_stmt = (
                select(Product)
                .where(Product.category_id == target_prod.category_id, Product.id != product_id)
                .limit(limit)
            )
            sim_prods = (await self.db.execute(fallback_stmt)).scalars().all()
            return [{"id": p.id, "title": p.title, "slug": p.slug, "price_cents": p.base_price_cents} for p in sim_prods]

        # Calculate cosine similarity with all stored embeddings
        all_embs = (await self.db.execute(select(ProductEmbedding).where(ProductEmbedding.product_id != product_id))).scalars().all()
        scored = []
        for emb in all_embs:
            sim = cosine_similarity(target_emb.vector, emb.vector)
            scored.append((emb.product_id, sim))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_ids = [pid for pid, _ in scored[:limit]]

        if not top_ids:
            return []

        prods = (await self.db.execute(select(Product).where(Product.id.in_(top_ids)))).scalars().all()
        return [
            {
                "id": p.id,
                "title": p.title,
                "slug": p.slug,
                "brand": p.brand,
                "price_cents": p.base_price_cents,
                "rating_avg": p.rating_avg,
            }
            for p in prods
        ]

    async def generate_product_description(
        self, title: str, brand: str, attributes: Dict[str, Any]
    ) -> Dict[str, str]:
        """Admin AI Tool: Generates compelling e-commerce copy and SEO meta tags from product specs."""
        attr_summary = ", ".join(f"{k}: {v}" for k, v in attributes.items())
        prompt = (
            f"Generate a professional, high-converting product description and SEO metadata for: "
            f"Title: {title}, Brand: {brand}, Specs: {attr_summary}."
        )
        # Using deterministic generation
        desc = (
            f"Engineered by {brand}, the {title} represents a masterclass in modern hardware craftsmanship. "
            f"Featuring {attr_summary}, this device delivers exceptional performance, reliability, and modern aesthetic elegance "
            f"tailored for demanding professionals and discerning enthusiasts."
        )
        return {
            "description": desc,
            "seo_title": f"{title} | {brand} Official Hardware",
            "seo_keywords": f"{title}, {brand}, {', '.join(attributes.keys())}",
        }
