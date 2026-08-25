"""
Project Analysis Schemas for SIH MPLADS AI.
"""

from pydantic import BaseModel, Field


class ProjectPlaceholderResponse(BaseModel):
    """
    Response schema for the planned project-level anomaly analysis endpoint.
    """
    status: str = Field(..., description="Feature status")
    message: str = Field(..., description="Descriptive status message")
