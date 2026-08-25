"""
Pydantic Schemas for MPLADS AI Assistant.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    """
    Representation of a historical conversation message.
    """
    role: str = Field(..., description="Role of the speaker: 'user' or 'assistant'")
    content: str = Field(..., description="Text content of the message")
    suggestions: Optional[List[str]] = Field(default=None, description="Optional suggestions associated with message")


class ChatRequest(BaseModel):
    """
    Request schema for POST /api/assistant.
    """
    message: str = Field(..., min_length=1, description="The user query or prompt")
    history: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional conversation history list"
    )


class ChatResponse(BaseModel):
    """
    Response schema for POST /api/assistant.
    """
    reply: str = Field(..., description="Data-grounded markdown response from the assistant")
    suggestions: List[str] = Field(
        default_factory=list,
        description="Suggested follow-up questions for the user"
    )
    related_constituencies: List[str] = Field(
        default_factory=list,
        description="List of constituency names referenced in the response"
    )
