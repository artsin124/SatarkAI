"""
Statistics and Risk Aggregation Service for SIH MPLADS AI.
"""

import sqlite3
from backend.schemas.anomaly_schema import RiskStatisticsResponse, RiskDistributionResponse


def get_statistics(conn: sqlite3.Connection) -> RiskStatisticsResponse:
    """
    Dynamically computes overall counts and risk score statistics from the database.
    """
    cursor = conn.cursor()

    # Aggregate counts by risk level
    cursor.execute("""
        SELECT
            COUNT(*) AS total_records,
            SUM(CASE WHEN final_risk_level = 'LOW' THEN 1 ELSE 0 END) AS low_count,
            SUM(CASE WHEN final_risk_level = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_count,
            SUM(CASE WHEN final_risk_level = 'HIGH' THEN 1 ELSE 0 END) AS high_count,
            SUM(CASE WHEN final_risk_level = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_count,
            AVG(final_risk_score) AS avg_score,
            MAX(final_risk_score) AS max_score,
            MIN(final_risk_score) AS min_score
        FROM anomaly_results
    """)
    row = cursor.fetchone()

    return RiskStatisticsResponse(
        total_records=int(row["total_records"] or 0),
        low_count=int(row["low_count"] or 0),
        medium_count=int(row["medium_count"] or 0),
        high_count=int(row["high_count"] or 0),
        critical_count=int(row["critical_count"] or 0),
        average_risk_score=round(float(row["avg_score"] or 0.0), 2),
        maximum_risk_score=round(float(row["max_score"] or 0.0), 2),
        minimum_risk_score=round(float(row["min_score"] or 0.0), 2),
    )


def get_risk_distribution(conn: sqlite3.Connection) -> RiskDistributionResponse:
    """
    Dynamically computes risk distribution counts across LOW, MEDIUM, HIGH, and CRITICAL.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            SUM(CASE WHEN final_risk_level = 'LOW' THEN 1 ELSE 0 END) AS low_count,
            SUM(CASE WHEN final_risk_level = 'MEDIUM' THEN 1 ELSE 0 END) AS medium_count,
            SUM(CASE WHEN final_risk_level = 'HIGH' THEN 1 ELSE 0 END) AS high_count,
            SUM(CASE WHEN final_risk_level = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_count,
            COUNT(*) AS total_records
        FROM anomaly_results
    """)
    row = cursor.fetchone()

    return RiskDistributionResponse(
        LOW=int(row["low_count"] or 0),
        MEDIUM=int(row["medium_count"] or 0),
        HIGH=int(row["high_count"] or 0),
        CRITICAL=int(row["critical_count"] or 0),
        total=int(row["total_records"] or 0),
    )
