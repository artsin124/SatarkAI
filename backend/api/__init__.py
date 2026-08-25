"""
FastAPI API Routers Package for SIH MPLADS AI
"""

from .anomalies import router as anomalies_router
from .statistics import router as statistics_router
from .search import router as search_router
from .projects import router as projects_router
from .assistant import router as assistant_router
from .alerts import router as alerts_router
from .upload import router as upload_router

__all__ = [
    "anomalies_router",
    "statistics_router",
    "search_router",
    "projects_router",
    "assistant_router",
    "alerts_router",
    "upload_router",
]
