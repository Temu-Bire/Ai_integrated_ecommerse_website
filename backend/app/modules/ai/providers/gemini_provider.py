"""
Google Gemini LLM Provider Implementation.
Integrates with Google Gemini API via async httpx or falls back gracefully to MockLLMProvider.
"""

from typing import Any, AsyncGenerator, Dict, List, Optional
import httpx
from app.core.config import settings
from app.core.logging import logger
from app.modules.ai.providers.base import (
    LLMMessage,
    LLMProvider,
    LLMStreamChunk,
    ToolCall,
)
from app.modules.ai.providers.mock_provider import MockLLMProvider


class GeminiLLMProvider(LLMProvider):
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.mock_fallback = MockLLMProvider()

    async def stream_chat(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[LLMStreamChunk, None]:
        if not self.api_key:
            # Fallback to local intelligent mock engine
            async for chunk in self.mock_fallback.stream_chat(messages, tools, temperature, max_tokens):
                yield chunk
            return

        # When API key is provided:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL_NAME}:streamGenerateContent?key={self.api_key}&alt=sse"
        
        contents = []
        for msg in messages:
            role = "user" if msg.role in ("user", "system") else "model"
            contents.append({"role": role, "parts": [{"text": msg.content}]})

        payload = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        logger.warning(f"Gemini API returned {response.status_code}. Using local mock fallback.")
                        async for chunk in self.mock_fallback.stream_chat(messages, tools, temperature, max_tokens):
                            yield chunk
                        return

                    async for line in response.aiter_lines():
                        if line.startswith("data: "):
                            import json
                            raw = line[6:].strip()
                            if raw:
                                data = json.loads(raw)
                                candidates = data.get("candidates", [])
                                if candidates:
                                    parts = candidates[0].get("content", {}).get("parts", [])
                                    for p in parts:
                                        if "text" in p:
                                            yield LLMStreamChunk(token=p["text"])
            yield LLMStreamChunk(finish_reason="stop")
        except Exception as e:
            logger.error(f"Gemini streaming exception: {e}. Falling back to mock engine.")
            async for chunk in self.mock_fallback.stream_chat(messages, tools, temperature, max_tokens):
                yield chunk

    async def generate_embedding(self, text: str) -> List[float]:
        return await self.mock_fallback.generate_embedding(text)

