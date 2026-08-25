"""
Anomaly and Risk Analysis Service for SIH MPLADS AI.

Provides database retrieval for constituency anomalies, parameterized search,
and on-demand ML/Statistical risk analysis for new records.
"""

import sqlite3
from typing import Any, Dict, List, Optional
import numpy as np

from backend.database.models import AnomalyRecordDB
from backend.schemas.anomaly_schema import (
    AnomalyRecord,
    NewAnalysisRequest,
    NewAnalysisResponse,
    ParameterScoreBreakdown,
    AlertItem,
    AlertListResponse,
)
from ml.preprocessing.preprocessing import prepare_feature_vector, validate_feature_dict
from ml.models.isolation_forest import load_model, predict_ml_anomaly_score
from ml.models.hybrid_risk_model import (
    calculate_parameter_anomaly_scores,
    calculate_statistical_anomaly_score,
    calculate_hybrid_risk_score,
    get_baseline_data,
)
from ml.explainability.explanation import generate_explanation


def _row_to_anomaly_record(row: sqlite3.Row) -> AnomalyRecord:
    """
    Helper function to convert an sqlite3.Row into a Pydantic AnomalyRecord.
    """
    record_db = AnomalyRecordDB.from_row(row)
    return AnomalyRecord(**record_db.to_dict())


def get_all_anomalies(conn: sqlite3.Connection) -> List[AnomalyRecord]:
    """
    Retrieves all anomaly records ordered by final_risk_score DESC.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rowid AS id, *
        FROM anomaly_results
        ORDER BY final_risk_score DESC
    """)
    rows = cursor.fetchall()
    return [_row_to_anomaly_record(r) for r in rows]


def get_critical_anomalies(conn: sqlite3.Connection) -> List[AnomalyRecord]:
    """
    Retrieves all records categorized as CRITICAL risk (score >= 75), ordered by final_risk_score DESC.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rowid AS id, *
        FROM anomaly_results
        WHERE final_risk_level = 'CRITICAL'
        ORDER BY final_risk_score DESC
    """)
    rows = cursor.fetchall()
    return [_row_to_anomaly_record(r) for r in rows]


def get_high_anomalies(conn: sqlite3.Connection) -> List[AnomalyRecord]:
    """
    Retrieves all records categorized as HIGH or CRITICAL risk (score >= 60), ordered by final_risk_score DESC.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rowid AS id, *
        FROM anomaly_results
        WHERE final_risk_level IN ('HIGH', 'CRITICAL')
        ORDER BY final_risk_score DESC
    """)
    rows = cursor.fetchall()
    return [_row_to_anomaly_record(r) for r in rows]


def get_anomaly_by_id(conn: sqlite3.Connection, record_id: int) -> Optional[AnomalyRecord]:
    """
    Retrieves a single record by its SQLite rowid.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rowid AS id, *
        FROM anomaly_results
        WHERE rowid = ?
    """, (record_id,))
    row = cursor.fetchone()
    if not row:
        return None
    return _row_to_anomaly_record(row)


def get_top_anomalies(conn: sqlite3.Connection, limit: int = 10) -> List[AnomalyRecord]:
    """
    Retrieves top highest-risk records with a validated limit (1 to 100).
    """
    safe_limit = max(1, min(100, limit))
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rowid AS id, *
        FROM anomaly_results
        ORDER BY final_risk_score DESC
        LIMIT ?
    """, (safe_limit,))
    rows = cursor.fetchall()
    return [_row_to_anomaly_record(r) for r in rows]


def search_anomalies(conn: sqlite3.Connection, query: str) -> List[AnomalyRecord]:
    """
    Performs case-insensitive parameterized search on MP name and Constituency.
    """
    trimmed = query.strip()
    if not trimmed:
        return []

    pattern = f"%{trimmed}%"
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rowid AS id, *
        FROM anomaly_results
        WHERE hon_ble_members_of_parliaments LIKE ? OR constituency LIKE ?
        ORDER BY final_risk_score DESC
    """, (pattern, pattern))
    rows = cursor.fetchall()
    return [_row_to_anomaly_record(r) for r in rows]


def analyze_record(payload: NewAnalysisRequest) -> NewAnalysisResponse:
    """
    Evaluates a new or arbitrary MPLADS constituency record on demand:
    1. Validates and extracts the 5 features.
    2. Runs the pre-trained Isolation Forest model for ML anomaly score.
    3. Calculates empirical percentile parameter scores & composite statistical anomaly score.
    4. Computes calibrated hybrid risk score (60% Stat + 40% ML) and risk level.
    5. Generates Explainable AI primary and detailed reasons.
    """
    raw_dict = {
        "utilization_mock": payload.utilization_mock,
        "pending_ratio_pct": payload.pending_ratio_pct,
        "cancelled_ratio_pct": payload.cancelled_ratio_pct,
        "average_project_cost_mock": payload.average_project_cost_mock,
        "average_delay_days_mock": payload.average_delay_days_mock,
    }

    # 1. Feature preparation & ML prediction
    features_df = prepare_feature_vector(raw_dict)
    ml_scores, _ = predict_ml_anomaly_score(features_df)
    ml_score = float(ml_scores[0])

    # 2. Statistical percentile scoring
    param_scores = calculate_parameter_anomaly_scores(
        utilization_mock=payload.utilization_mock,
        pending_ratio_pct=payload.pending_ratio_pct,
        cancelled_ratio_pct=payload.cancelled_ratio_pct,
        average_project_cost_mock=payload.average_project_cost_mock,
        average_delay_days_mock=payload.average_delay_days_mock,
    )
    stat_score = calculate_statistical_anomaly_score(param_scores)

    # 3. Hybrid risk score and tier classification
    final_score, risk_level = calculate_hybrid_risk_score(
        statistical_anomaly_score=stat_score,
        ml_anomaly_score=ml_score,
    )

    # 4. Explainability
    primary_reason, detailed_reason = generate_explanation(raw_dict, param_scores)

    return NewAnalysisResponse(
        hon_ble_members_of_parliaments=payload.hon_ble_members_of_parliaments,
        constituency=payload.constituency,
        statistical_anomaly_score=stat_score,
        ml_anomaly_score=ml_score,
        final_risk_score=final_score,
        final_risk_level=risk_level,
        primary_anomaly_reason=primary_reason,
        detailed_reason=detailed_reason,
        parameter_breakdown=ParameterScoreBreakdown(**param_scores),
    )


def get_alerts(conn: sqlite3.Connection, severity: Optional[str] = None) -> AlertListResponse:
    """
    Generates dynamic governance risk alerts derived directly from existing HIGH (>=60.0)
    and CRITICAL (>=75.0) constituency anomaly records without synthetic data or fraud allegations.
    """
    cursor = conn.cursor()
    cursor.execute("""
        SELECT rowid AS id, *
        FROM anomaly_results
        WHERE final_risk_level IN ('CRITICAL', 'HIGH')
        ORDER BY final_risk_score DESC
    """)
    rows = cursor.fetchall()

    alerts: List[AlertItem] = []
    crit_count = 0
    high_count = 0

    for r in rows:
        is_crit = r["final_risk_level"] == "CRITICAL"
        if is_crit:
            crit_count += 1
            sev = "CRITICAL"
            title = f"Critical Risk Pattern Flagged — {r['constituency']}"
            recom = f"Priority administrative review recommended for {r['constituency']}. Cross-reference sanction orders, implementing agency milestones, and expenditure files."
        else:
            high_count += 1
            sev = "HIGH"
            title = f"Elevated Operational Warning — {r['constituency']}"
            recom = f"Targeted monitoring advised for {r['constituency']}. Verify timeline progress and fund allocation schedules with district authorities."

        if severity and sev.upper() != severity.upper():
            continue

        alerts.append(AlertItem(
            id=r["id"],
            hon_ble_members_of_parliaments=r["hon_ble_members_of_parliaments"],
            constituency=r["constituency"],
            severity=sev,
            alert_title=title,
            final_risk_score=round(r["final_risk_score"], 2),
            final_risk_level=r["final_risk_level"],
            primary_anomaly_reason=r["primary_anomaly_reason"] or "Elevated Operational Variation",
            detailed_reason=r["detailed_reason"] or "Multi-metric risk indicators observed above normal operating bounds.",
            recommendation=recom,
        ))

    return AlertListResponse(
        total=len(alerts) if severity else (crit_count + high_count),
        critical_count=crit_count,
        high_count=high_count,
        data=alerts,
    )
