"""
Unit and Integration Tests for MPLADS AI Governance Assistant Endpoint.
"""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_assistant_total_records():
    response = client.post("/api/assistant", json={"message": "How many records are there?"})
    assert response.status_code == 200
    data = response.json()
    assert "reply" in data
    assert "544" in data["reply"]
    assert len(data["suggestions"]) > 0


def test_assistant_critical_count():
    response = client.post("/api/assistant", json={"message": "How many critical records are there?"})
    assert response.status_code == 200
    data = response.json()
    assert "3" in data["reply"]
    assert "CRITICAL" in data["reply"]
    assert "YAVATMAL-WASHIM" in data["reply"]
    assert "YAVATMAL-WASHIM" in data["related_constituencies"]


def test_assistant_high_risk_count():
    response = client.post("/api/assistant", json={"message": "How many high risk records are there?"})
    assert response.status_code == 200
    data = response.json()
    assert "22" in data["reply"]
    assert "HIGH" in data["reply"]


def test_assistant_risk_distribution():
    response = client.post("/api/assistant", json={"message": "Show risk distribution."})
    assert response.status_code == 200
    data = response.json()
    assert "LOW Risk" in data["reply"]
    assert "111" in data["reply"]
    assert "408" in data["reply"]
    assert "22" in data["reply"]
    assert "3" in data["reply"]


def test_assistant_top_anomalies():
    response = client.post("/api/assistant", json={"message": "Show me the top 5 highest risk constituencies."})
    assert response.status_code == 200
    data = response.json()
    assert "Sanjay Uttamrao Deshmukh" in data["reply"]
    assert "YAVATMAL-WASHIM" in data["reply"]
    assert "88.10" in data["reply"]
    assert len(data["related_constituencies"]) == 5


def test_assistant_why_flagged_yavatmal():
    response = client.post("/api/assistant", json={"message": "Why is YAVATMAL-WASHIM critical?"})
    assert response.status_code == 200
    data = response.json()
    assert "YAVATMAL-WASHIM" in data["reply"]
    assert "88.10" in data["reply"]
    assert "50.0%" in data["reply"]
    assert "Cancellation" in data["reply"]
    assert "Governance Note" in data["reply"]
    assert "Fraud confirmed" not in data["reply"]


def test_assistant_highest_cancellation():
    response = client.post("/api/assistant", json={"message": "Which constituency has the highest cancellation ratio?"})
    assert response.status_code == 200
    data = response.json()
    assert "Cancellation Ratio" in data["reply"]
    assert "YAVATMAL-WASHIM" in data["reply"]


def test_assistant_highest_pending():
    response = client.post("/api/assistant", json={"message": "Which records have the highest pending ratio?"})
    assert response.status_code == 200
    data = response.json()
    assert "Pending" in data["reply"]


def test_assistant_lowest_utilization():
    response = client.post("/api/assistant", json={"message": "Which records have the lowest utilization?"})
    assert response.status_code == 200
    data = response.json()
    assert "Utilization" in data["reply"]


def test_assistant_average_risk_score():
    response = client.post("/api/assistant", json={"message": "What is the average risk score?"})
    assert response.status_code == 200
    data = response.json()
    assert "38.87" in data["reply"]


def test_assistant_mp_search():
    response = client.post("/api/assistant", json={"message": "Tell me about Sanjay Uttamrao Deshmukh."})
    assert response.status_code == 200
    data = response.json()
    assert "Sanjay Uttamrao Deshmukh" in data["reply"]
    assert "YAVATMAL-WASHIM" in data["reply"]
    assert "88.10" in data["reply"]


def test_assistant_fallback_help():
    response = client.post("/api/assistant", json={"message": "What is the weather today?"})
    assert response.status_code == 200
    data = response.json()
    assert "I can assist you with governance intelligence" in data["reply"]
    assert len(data["suggestions"]) > 0
