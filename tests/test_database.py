"""
Database Layer Tests for SIH MPLADS AI.
"""

import sqlite3
from pathlib import Path
import pytest

from backend.database.connection import get_connection, get_db_path, check_database_health
from backend.database.models import AnomalyRecordDB


def test_db_path_exists():
    """Test that the database file exists at the expected path."""
    db_path = get_db_path()
    assert db_path.exists(), f"Database file not found at {db_path}"


def test_db_connection():
    """Test establishing a connection and verifying row_factory."""
    conn = get_connection()
    assert isinstance(conn, sqlite3.Connection)
    assert conn.row_factory == sqlite3.Row
    conn.close()


def test_database_health():
    """Test the database health check function."""
    assert check_database_health() is True


def test_anomaly_results_table_exists():
    """Test that anomaly_results table exists with expected schema."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='anomaly_results'")
    table = cursor.fetchone()
    assert table is not None, "Table 'anomaly_results' does not exist."

    # Check columns
    cursor.execute("PRAGMA table_info(anomaly_results)")
    columns = [col[1] for col in cursor.fetchall()]
    expected_cols = [
        "hon_ble_members_of_parliaments",
        "constituency",
        "utilization_mock",
        "pending_ratio_pct",
        "cancelled_ratio_pct",
        "average_project_cost_mock",
        "average_delay_days_mock",
        "statistical_anomaly_score",
        "ml_anomaly_score",
        "final_risk_score",
        "final_risk_level",
        "primary_anomaly_reason",
        "detailed_reason",
        "previously_selected_10",
    ]
    for col in expected_cols:
        assert col in columns, f"Expected column '{col}' missing from anomaly_results"
    
    conn.close()


def test_anomaly_results_record_count():
    """Test that anomaly_results contains all 544 constituency records."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM anomaly_results")
    count = cursor.fetchone()[0]
    assert count == 544, f"Expected 544 records, found {count}"
    conn.close()


def test_row_to_model_conversion():
    """Test AnomalyRecordDB mapping from sqlite3.Row."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT rowid AS id, * FROM anomaly_results LIMIT 1")
    row = cursor.fetchone()
    assert row is not None

    record = AnomalyRecordDB.from_row(row)
    assert record.id >= 1
    assert len(record.hon_ble_members_of_parliaments) > 0
    assert len(record.constituency) > 0
    assert record.final_risk_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert isinstance(record.final_risk_score, float)
    
    d = record.to_dict()
    assert isinstance(d, dict)
    assert "final_risk_score" in d

    conn.close()
