"""
Project Service Placeholder for SIH MPLADS AI.

Serves as the foundation for the upcoming Project-Level Anomaly Detection module.
"""

from backend.schemas.project_schema import ProjectPlaceholderResponse


def get_projects_status() -> ProjectPlaceholderResponse:
    """
    Returns the planning status for project-level anomaly analysis.
    """
    return ProjectPlaceholderResponse(
        status="planned",
        message="Project-level anomaly analysis will be integrated in the next phase.",
    )
