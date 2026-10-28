"""
Intelligent Mock / Offline LLM Provider.
Provides deterministic function-calling, streaming tokens, and vector generation without requiring paid API keys.
"""

import asyncio
import hashlib
import json
import uuid
from typing import Any, AsyncGenerator, Dict, List, Optional
from app.modules.ai.providers.base import (
    LLMMessage,
    LLMProvider,
    LLMStreamChunk,
    ToolCall,
)


class MockLLMProvider(LLMProvider):
    async def stream_chat(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[LLMStreamChunk, None]:
        last_msg = messages[-1] if messages else None
        user_text = last_msg.content.lower() if last_msg else ""

        # 1. If previous message is a tool response, synthesize answer
        if last_msg and last_msg.role == "tool":
            tool_data = last_msg.content
            intro = "Based on our live store inventory:\n\n"
            for word in intro.split(" "):
                yield LLMStreamChunk(token=word + " ")
                await asyncio.sleep(0.01)

            yield LLMStreamChunk(token=f"Here is what I found for you: {tool_data}\n\nCan I help you with anything else?")
            yield LLMStreamChunk(finish_reason="stop")
            return

        # 2. Policy inquiry tool trigger
        if any(w in user_text for w in ["return", "policy", "warranty", "shipping", "refund"]):
            topic = "returns" if "return" in user_text or "refund" in user_text else "shipping"
            call_id = f"call_{uuid.uuid4().hex[:8]}"
            yield LLMStreamChunk(
                tool_calls=[
                    ToolCall(
                        id=call_id,
                        name="get_store_policies",
                        arguments={"topic": topic},
                    )
                ],
                finish_reason="tool_calls",
            )
            return

        # 3. Orders inquiry tool trigger
        if any(w in user_text for w in ["order", "tracking", "status", "purchase history", "shipment"]):
            call_id = f"call_{uuid.uuid4().hex[:8]}"
            yield LLMStreamChunk(
                tool_calls=[
                    ToolCall(
                        id=call_id,
                        name="get_my_orders",
                        arguments={},
                    )
                ],
                finish_reason="tool_calls",
            )
            return

        # 4. Comparison tool trigger
        if "compare" in user_text:
            call_id = f"call_{uuid.uuid4().hex[:8]}"
            yield LLMStreamChunk(
                tool_calls=[
                    ToolCall(
                        id=call_id,
                        name="compare_products",
                        arguments={"query": user_text},
                    )
                ],
                finish_reason="tool_calls",
            )
            return

        # 5. Product Search or general catalog inquiry
        if any(w in user_text for w in ["headphone", "audio", "laptop", "watch", "recommend", "find", "search", "buy", "price"]):
            call_id = f"call_{uuid.uuid4().hex[:8]}"
            yield LLMStreamChunk(
                tool_calls=[
                    ToolCall(
                        id=call_id,
                        name="search_products",
                        arguments={"query": user_text},
                    )
                ],
                finish_reason="tool_calls",
            )
            return

        # 6. Default natural streaming reply
        response_text = (
            "Hello! I am your NovaMart AI shopping assistant. "
            "I can search our electronics catalog, verify real-time stock levels, "
            "compare device specs, answer questions regarding return policies, or check your order tracking status. "
            "What would you like to explore today?"
        )
        for word in response_text.split(" "):
            yield LLMStreamChunk(token=word + " ")
            await asyncio.sleep(0.015)

        yield LLMStreamChunk(finish_reason="stop")

    async def generate_embedding(self, text: str) -> List[float]:
        """Generates deterministic 8-dimensional normalized unit vector."""
        v = []
        for i in range(8):
            h = hashlib.sha256(f"{text}:{i}".encode()).hexdigest()
            val = (int(h[:4], 16) / 32768.0) - 1.0
            v.append(round(val, 4))
        return v
