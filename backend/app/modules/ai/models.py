"""
AI Assistant Conversations, Messages, and Structured Payloads Models.
"""

import json
import uuid
from typing import List, Optional
from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base, TimestampMixin


class AssistantConversation(Base, TimestampMixin):
    __tablename__ = "assistant_conversations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), default="New Shopping Chat", nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    metadata_json: Mapped[str] = mapped_column(Text, default="{}", nullable=False)

    messages: Mapped[List["AssistantMessage"]] = relationship(
        "AssistantMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AssistantMessage.created_at",
        lazy="selectin",
    )


class AssistantMessage(Base, TimestampMixin):
    __tablename__ = "assistant_messages"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id: Mapped[str] = mapped_column(String(36), ForeignKey("assistant_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, index=True)  # user, assistant, system, tool
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_calls_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tool_call_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    structured_data_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    feedback_rating: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 1 for up, -1 for down

    conversation: Mapped["AssistantConversation"] = relationship("AssistantConversation", back_populates="messages")

    @property
    def tool_calls(self) -> Optional[list]:
        if not self.tool_calls_json:
            return None
        try:
            return json.loads(self.tool_calls_json)
        except Exception:
            return None

    @tool_calls.setter
    def tool_calls(self, val: Optional[list]) -> None:
        self.tool_calls_json = json.dumps(val) if val is not None else None

    @property
    def structured_data(self) -> Optional[dict]:
        if not self.structured_data_json:
            return None
        try:
            return json.loads(self.structured_data_json)
        except Exception:
            return None

    @structured_data.setter
    def structured_data(self, val: Optional[dict]) -> None:
        self.structured_data_json = json.dumps(val) if val is not None else None

