"""
FastAPI Endpoints Integration Tests for SIH MPLADS AI.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_root_health_check():
    """Test GET / health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "MPLADS AI API is running"
    assert data["status"] == "success"


def test_get_all_anomalies():
    """Test GET /api/anomalies returns 544 sorted records."""
    response = client.get("/api/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "data" in data
    assert data["total"] == 544
    assert len(data["data"]) == 544

    # Verify descending sort order
    scores = [r["final_risk_score"] for r in data["data"]]
    assert scores == sorted(scores, reverse=True)


def test_get_critical_anomalies():
    """Test GET /api/anomalies/critical returns records with final_risk_level='CRITICAL'."""
    response = client.get("/api/anomalies/critical")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 3
    for r in data["data"]:
        assert r["final_risk_level"] == "CRITICAL"
        assert r["final_risk_score"] >= 75.0


def test_get_high_anomalies():
    """Test GET /api/anomalies/high returns HIGH and CRITICAL records."""
    response = client.get("/api/anomalies/high")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 25  # 22 HIGH + 3 CRITICAL
    for r in data["data"]:
        assert r["final_risk_level"] in ["HIGH", "CRITICAL"]
        assert r["final_risk_score"] >= 60.0


def test_get_anomaly_by_id():
    """Test GET /api/anomalies/{record_id} for existing and non-existing records."""
    # Existing record
    response = client.get("/api/anomalies/1")
    assert response.status_code == 200
    record = response.json()
    assert record["id"] == 1
    assert "hon_ble_members_of_parliaments" in record
    assert "final_risk_score" in record

    # Non-existent record
    response_404 = client.get("/api/anomalies/999999")
    assert response_404.status_code == 404
    assert "not found" in response_404.json()["detail"].lower()


def test_get_top_anomalies():
    """Test GET /api/top-anomalies with limit parameter."""
    response = client.get("/api/top-anomalies?limit=5")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 5
    assert len(data["data"]) == 5

    # Top record should have the highest risk score
    first = data["data"][0]
    second = data["data"][1]
    assert first["final_risk_score"] >= second["final_risk_score"]


def test_get_statistics():
    """Test GET /api/statistics computes correct aggregations."""
    response = client.get("/api/statistics")
    assert response.status_code == 200
    stats = response.json()
    assert stats["total_records"] == 544
    assert stats["low_count"] == 111
    assert stats["medium_count"] == 408
    assert stats["high_count"] == 22
    assert stats["critical_count"] == 3
    assert stats["maximum_risk_score"] == 88.1
    assert stats["minimum_risk_score"] > 0
    assert stats["average_risk_score"] == 38.87


def test_get_risk_distribution():
    """Test GET /api/risk-distribution."""
    response = client.get("/api/risk-distribution")
    assert response.status_code == 200
    dist = response.json()
    assert dist["LOW"] == 111
    assert dist["MEDIUM"] == 408
    assert dist["HIGH"] == 22
    assert dist["CRITICAL"] == 3
    assert dist["total"] == 544


def test_search_endpoint():
    """Test GET /api/search with query."""
    # Search for known MP
    response = client.get("/api/search?q=Sanjay")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 1
    assert any("Sanjay" in r["hon_ble_members_of_parliaments"] for r in data["data"])

    # Search for known constituency
    response_const = client.get("/api/search?q=YAVATMAL")
    assert response_const.status_code == 200
    data_const = response_const.json()
    assert data_const["total"] >= 1
    assert data_const["data"][0]["constituency"] == "YAVATMAL-WASHIM"


def test_projects_endpoint():
    """Test GET /api/projects placeholder."""
    response = client.get("/api/projects")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "planned"
    assert "Project-level anomaly analysis" in data["message"]


def test_analyze_endpoint():
    """Test POST /api/analyze with sample payload."""
    payload = {
        "hon_ble_members_of_parliaments": "Test Representative",
        "constituency": "Test Constituency",
        "utilization_mock": 45.0,
        "pending_ratio_pct": 55.0,
        "cancelled_ratio_pct": 35.0,
        "average_project_cost_mock": 12000000.0,
        "average_delay_days_mock": 150.0,
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 200
    res = response.json()
    assert "statistical_anomaly_score" in res
    assert "ml_anomaly_score" in res
    assert "final_risk_score" in res
    assert res["final_risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert "primary_anomaly_reason" in res
    assert "detailed_reason" in res
    assert "parameter_breakdown" in res
    assert res["final_risk_score"] > 60.0  # Elevated test metrics should yield elevated risk


def test_alerts_endpoint():
    """Test GET /api/alerts dynamic risk warnings endpoint."""
    response = client.get("/api/alerts")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 25
    assert data["critical_count"] == 3
    assert data["high_count"] == 22
    assert len(data["data"]) == 25
    for alert in data["data"]:
        assert alert["severity"] in ["CRITICAL", "HIGH"]
        assert alert["final_risk_score"] >= 60.0
        assert "recommendation" in alert
