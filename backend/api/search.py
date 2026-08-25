"""
Search API Endpoints for SIH MPLADS AI.
"""

import sqlite3
from fastapi import APIRouter, Depends, Query

from backend.database.connection import get_db
from backend.schemas.anomaly_schema import SearchResponse
from backend.services.anomaly_service import search_anomalies

router = APIRouter(tags=["Search"])


@router.get(
    "/api/search",
    response_model=SearchResponse,
    summary="Search anomalies by MP Name or Constituency",
    description="Performs case-insensitive parameterized search on Member of Parliament name and Parliamentary Constituency.",
)
def search_records(
    q: str = Query(..., min_length=1, description="Search term (MP Name or Constituency)"),
    conn: sqlite3.Connection = Depends(get_db),
):
    results = search_anomalies(conn, query=q)
    return SearchResponse(
        total=len(results),
        query=q,
        data=results,
    )
