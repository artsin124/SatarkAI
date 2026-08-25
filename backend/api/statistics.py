"""
Statistics and Risk Distribution API Endpoints.
"""

import sqlite3
from fastapi import APIRouter, Depends

from backend.database.connection import get_db
from backend.schemas.anomaly_schema import RiskStatisticsResponse, RiskDistributionResponse
from backend.services.statistics_service import get_statistics, get_risk_distribution

router = APIRouter(tags=["Governance Statistics"])


@router.get(
    "/api/statistics",
    response_model=RiskStatisticsResponse,
    summary="Get overall risk statistics",
    description="Returns dynamically calculated summary metrics including record counts per risk level and score bounds.",
)
def read_statistics(conn: sqlite3.Connection = Depends(get_db)):
    return get_statistics(conn)


@router.get(
    "/api/risk-distribution",
    response_model=RiskDistributionResponse,
    summary="Get risk level breakdown",
    description="Returns the breakdown of records across LOW, MEDIUM, HIGH, and CRITICAL risk tiers.",
)
def read_risk_distribution(conn: sqlite3.Connection = Depends(get_db)):
    return get_risk_distribution(conn)
