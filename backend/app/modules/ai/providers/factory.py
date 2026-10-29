"""
LLM Provider Factory.
Instantiates the configured LLM provider according to environment settings.
"""

from app.core.config import settings
from app.modules.ai.providers.base import LLMProvider
from app.modules.ai.providers.gemini_provider import GeminiLLMProvider
from app.modules.ai.providers.mock_provider import MockLLMProvider


def get_llm_provider() -> LLMProvider:
    provider_name = settings.LLM_PROVIDER.lower().strip()
    if provider_name == "gemini":
        return GeminiLLMProvider()
    # Default to Mock provider for testing and zero-cost local execution
    return MockLLMProvider()

