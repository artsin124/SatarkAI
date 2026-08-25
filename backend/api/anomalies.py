"""
Anomalies and Risk Analysis API Endpoints.
"""

import sqlite3
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Path

from backend.database.connection import get_db
from backend.schemas.anomaly_schema import (
    AnomalyRecord,
    AnomalyListResponse,
    NewAnalysisRequest,
    NewAnalysisResponse,
)
from backend.services.anomaly_service import (
    get_all_anomalies,
    get_critical_anomalies,
    get_high_anomalies,
    get_anomaly_by_id,
    get_top_anomalies,
    analyze_record,
)

router = APIRouter(tags=["Anomalies & Risk Analysis"])


@router.get(
    "/api/anomalies",
    response_model=AnomalyListResponse,
    summary="Get all anomaly records",
    description="Returns all 544 constituency anomaly records sorted by final_risk_score in descending order.",
)
def read_all_anomalies(conn: sqlite3.Connection = Depends(get_db)):
    records = get_all_anomalies(conn)
    return AnomalyListResponse(total=len(records), data=records)


@router.get(
    "/api/anomalies/critical",
    response_model=AnomalyListResponse,
    summary="Get CRITICAL risk records",
    description="Returns all records categorized under the CRITICAL risk tier (score >= 75.0), sorted by risk score DESC.",
)
def read_critical_anomalies(conn: sqlite3.Connection = Depends(get_db)):
    records = get_critical_anomalies(conn)
    return AnomalyListResponse(total=len(records), data=records)


@router.get(
    "/api/anomalies/high",
    response_model=AnomalyListResponse,
    summary="Get HIGH and CRITICAL risk records",
    description="Returns all records categorized under HIGH and CRITICAL risk tiers (score >= 60.0), sorted by risk score DESC.",
)
def read_high_anomalies(conn: sqlite3.Connection = Depends(get_db)):
    records = get_high_anomalies(conn)
    return AnomalyListResponse(total=len(records), data=records)


@router.get(
    "/api/top-anomalies",
    response_model=AnomalyListResponse,
    summary="Get top highest-risk records",
    description="Returns the top N highest-risk constituency records with validated limit (1 to 100).",
)
def read_top_anomalies(
    limit: int = Query(10, ge=1, le=100, description="Number of top records to retrieve (1-100)"),
    conn: sqlite3.Connection = Depends(get_db),
):
    records = get_top_anomalies(conn, limit=limit)
    return AnomalyListResponse(total=len(records), data=records)


@router.get(
    "/api/anomalies/{record_id}",
    response_model=AnomalyRecord,
    summary="Get single anomaly record by ID",
    description="Retrieves an anomaly record by its database rowid. Returns HTTP 404 if not found.",
)
def read_anomaly_by_id(
    record_id: int = Path(..., ge=1, description="Database unique record identifier (rowid)"),
    conn: sqlite3.Connection = Depends(get_db),
):
    record = get_anomaly_by_id(conn, record_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Anomaly record with ID {record_id} not found."
        )
    return record


@router.post(
    "/api/analyze",
    response_model=NewAnalysisResponse,
    summary="Analyze new MPLADS record on-demand",
    description="Evaluates a new MPLADS constituency parameter vector using the trained Isolation Forest and statistical models, generating full explainability.",
)
def evaluate_new_record(payload: NewAnalysisRequest):
    try:
        result = analyze_record(payload)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error evaluating record: {str(e)}"
        )
