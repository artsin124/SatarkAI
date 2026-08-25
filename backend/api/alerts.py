"""
Alerts and Early Warnings API Endpoints for SIH MPLADS AI.
"""

import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, Query

from backend.database.connection import get_db
from backend.schemas.anomaly_schema import AlertListResponse
from backend.services.anomaly_service import get_alerts

router = APIRouter(tags=["Alerts & Early Warnings"])


@router.get(
    "/api/alerts",
    response_model=AlertListResponse,
    summary="Get operational risk alerts and warnings",
    description="Returns dynamically generated alerts derived directly from HIGH (>=60) and CRITICAL (>=75) constituency anomaly records.",
)
def read_alerts(
    severity: Optional[str] = Query(None, description="Optional severity filter: 'CRITICAL' or 'HIGH'"),
    conn: sqlite3.Connection = Depends(get_db),
):
    return get_alerts(conn, severity=severity)
