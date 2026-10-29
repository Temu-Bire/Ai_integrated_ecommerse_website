"""
Swappable LLM Provider Abstraction Protocol.
Provides consistent interface for OpenAI, Anthropic, Gemini, and Mock test providers.
"""

from abc import ABC, abstractmethod
from typing import Any, AsyncGenerator, Dict, List, Optional
from pydantic import BaseModel


class ToolCall(BaseModel):
    id: str
    name: str
    arguments: Dict[str, Any]


class LLMMessage(BaseModel):
    role: str  # "system", "user", "assistant", "tool"
    content: str
    tool_calls: Optional[List[ToolCall]] = None
    tool_call_id: Optional[str] = None


class LLMStreamChunk(BaseModel):
    token: Optional[str] = None
    tool_calls: Optional[List[ToolCall]] = None
    finish_reason: Optional[str] = None


class LLMProvider(ABC):
    @abstractmethod
    async def stream_chat(
        self,
        messages: List[LLMMessage],
        tools: Optional[List[Dict[str, Any]]] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> AsyncGenerator[LLMStreamChunk, None]:
        """Streams text chunks and function calls via async generator."""
        pass

    @abstractmethod
    async def generate_embedding(self, text: str) -> List[float]:
        """Generates semantic embedding vector for text."""
        pass

