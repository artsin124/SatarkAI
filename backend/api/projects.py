"""
Project-Level Anomaly Analysis Placeholder API Endpoint.
"""

from fastapi import APIRouter
from backend.schemas.project_schema import ProjectPlaceholderResponse
from backend.services.project_service import get_projects_status

router = APIRouter(tags=["Projects Analysis (Upcoming)"])


@router.get(
    "/api/projects",
    response_model=ProjectPlaceholderResponse,
    summary="Project-level analysis module status",
    description="Returns the planning status for the upcoming project-level anomaly detection module.",
)
def read_projects():
    return get_projects_status()
