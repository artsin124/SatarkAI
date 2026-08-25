"""
Service Layer Package for SIH MPLADS AI
"""

from .anomaly_service import (
    get_all_anomalies,
    get_critical_anomalies,
    get_high_anomalies,
    get_anomaly_by_id,
    get_top_anomalies,
    search_anomalies,
    analyze_record,
)
from .statistics_service import get_statistics, get_risk_distribution
from .project_service import get_projects_status
from .assistant_service import process_chat_query

__all__ = [
    "get_all_anomalies",
    "get_critical_anomalies",
    "get_high_anomalies",
    "get_anomaly_by_id",
    "get_top_anomalies",
    "search_anomalies",
    "analyze_record",
    "get_statistics",
    "get_risk_distribution",
    "get_projects_status",
    "process_chat_query",
]
