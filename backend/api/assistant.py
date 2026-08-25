"""
AI Assistant Router for SIH MPLADS AI.
Provides grounded natural language question answering on MPLADS risk and anomaly records.
"""

import sqlite3
from fastapi import APIRouter, Depends, HTTPException

from backend.database.connection import get_db
from backend.schemas.assistant_schema import ChatRequest, ChatResponse
from backend.services.assistant_service import process_chat_query

router = APIRouter(tags=["AI Governance Assistant"])


@router.post(
    "/api/assistant",
    response_model=ChatResponse,
    summary="Query the MPLADS AI Governance Assistant",
    description="Processes natural language governance inquiries and returns factual, data-grounded responses from the MPLADS constituency anomaly database.",
)
def chat_with_assistant(
    request: ChatRequest,
    conn: sqlite3.Connection = Depends(get_db),
):
    try:
        response = process_chat_query(request, conn=conn)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing assistant query: {str(e)}"
        )
