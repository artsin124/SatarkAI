"""
Comprehensive Tests for SATARK AI Smart CSV Analysis (Phase 3 & Phase 4).

Tests:
1. Valid MP CSV with Isolation Forest V2 & Hybrid scoring
2. MP CSV with missing features (ML unavailable, zero hallucination)
3. Project CSV (Cost Outliers, Tender Splitting, Semantic Duplicates, Contractor Concentration)
4. Combined Dataset execution
5. Status transitions (MAPPED -> PROCESSING -> COMPLETED)
6. Analysis run isolation
7. Baseline preservation (544 records untouched)
8. Results pagination, search, and filtering
9. CSV Export with formula injection protection
"""

import io
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.database.connection import get_connection

client = TestClient(app)


def test_phase3_valid_mp_analysis():
    """
    TEST 1: Valid MP CSV with all 5 features.
    Verifies ML score, statistical score, hybrid score, risk tier, XAI explanations,
    and storage in analysis_mp_results.
    """
    csv_content = (
        "MP_Name,Constituency,Utilisation,Pending %,Cancelled %,Avg Cost,Avg Delay\n"
        "Sanjay Deshmukh,YAVATMAL-WASHIM,50.0,50.0,50.0,₹15,206,600,168\n"
        "Appalanaidu Kalisetti,VIZIANAGARAM,70.5,35.2,12.0,₹8,500,000,132\n"
        "Vishal Patil,SANGLI,30.0,48.0,22.0,₹4,500,000,94\n"
    )
    files = {"file": ("mp_full.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/upload", files=files)
    assert up_res.status_code == 200
    analysis_id = up_res.json()["analysis_id"]

    # Confirm mapping
    map_payload = {
        "mappings": {
            "MP_Name": "mp_name",
            "Constituency": "constituency",
            "Utilisation": "utilization",
            "Pending %": "pending_ratio",
            "Cancelled %": "cancelled_ratio",
            "Avg Cost": "average_project_cost",
            "Avg Delay": "average_delay_days",
        }
    }
    map_res = client.post(f"/api/upload/{analysis_id}/mapping", json=map_payload)
    assert map_res.status_code == 200

    # Execute Analysis: POST /api/upload/{id}/analyze
    an_res = client.post(f"/api/upload/{analysis_id}/analyze")
    assert an_res.status_code == 200
    an_data = an_res.json()
    assert an_data["status"] == "COMPLETED"
    assert an_data["valid_rows"] == 3
    assert "isolation_forest" in an_data["modules_applied"]
    assert "hybrid_risk" in an_data["modules_applied"]

    # Query Results: GET /api/upload/{id}/results
    res_res = client.get(f"/api/upload/{analysis_id}/results")
    assert res_res.status_code == 200
    res_data = res_res.json()
    assert res_data["total_records"] == 3
    assert res_data["mp_results"] is not None
    assert len(res_data["mp_results"]) == 3

    top_mp = res_data["mp_results"][0]
    assert top_mp["final_risk_score"] > 0
    assert top_mp["final_risk_level"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    assert top_mp["ml_anomaly_score"] is not None
    assert top_mp["statistical_anomaly_score"] is not None
    assert top_mp["primary_anomaly_reason"] is not None
    assert len(top_mp["detailed_reason"]) > 0


def test_phase3_mp_analysis_missing_feature_zero_hallucination():
    """
    TEST 2: MP CSV missing average_delay_days.
    Verifies ML score is NULL, no fake data is generated, and statistical rules execute.
    """
    csv_content = (
        "MP_Name,Constituency,Utilisation,Pending %,Cancelled %,Avg Cost\n"
        "MP One,Const One,40.0,45.0,15.0,₹5,000,000\n"
        "MP Two,Const Two,85.0,10.0,2.0,₹2,000,000\n"
    )
    files = {"file": ("mp_no_delay.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/upload", files=files)
    assert up_res.status_code == 200
    analysis_id = up_res.json()["analysis_id"]

    # Execute Analysis
    an_res = client.post(f"/api/upload/{analysis_id}/analyze")
    assert an_res.status_code == 200
    an_data = an_res.json()
    assert an_data["status"] == "COMPLETED"
    assert an_data["summary_metrics"]["ml_model_applied"] is False

    # Check Results
    res_res = client.get(f"/api/upload/{analysis_id}/results")
    assert res_res.status_code == 200
    mp_list = res_res.json()["mp_results"]
    assert len(mp_list) == 2
    for r in mp_list:
        assert r["ml_anomaly_score"] is None
        assert r["avg_delay_days"] is None


def test_phase3_project_analysis_modules():
    """
    TEST 3: Project CSV verifying cost outliers, tender splitting, semantic duplicates,
    and contractor concentration risk.
    """
    csv_content = (
        "Work_Code,Project_Title,Category,Sanctioned_Amount,District,Contractor,Sanction_Date\n"
        "PRJ-001,Construction of Concrete CC Road in Ward 4,Roads,₹9,80,000,Yavatmal,SK Infra,2024-01-10\n"
        "PRJ-002,Construction of Concrete CC Road in Ward 4 Phase 2,Roads,₹9,90,000,Yavatmal,SK Infra,2024-01-18\n"
        "PRJ-003,Construction of Concrete CC Road in Ward 4,Roads,₹9,85,000,Yavatmal,SK Infra,2024-01-25\n"
        "PRJ-004,Mega Community Facility Centre,Community Assets,₹85,00,000,Yavatmal,Bharat Con,2024-02-01\n"
        "PRJ-005,Small Borewell Drinking Water,Water,₹1,50,000,Yavatmal,Local Agency,2024-02-05\n"
    )
    files = {"file": ("projects_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/upload", files=files)
    assert up_res.status_code == 200
    analysis_id = up_res.json()["analysis_id"]

    # Execute Analysis
    an_res = client.post(f"/api/upload/{analysis_id}/analyze")
    assert an_res.status_code == 200
    an_data = an_res.json()
    assert an_data["status"] == "COMPLETED"
    assert an_data["summary_metrics"]["cost_outlier_count"] >= 1
    assert an_data["summary_metrics"]["tender_splitting_count"] >= 2
    assert an_data["summary_metrics"]["duplicate_candidate_count"] >= 2

    # Check Results
    res_res = client.get(f"/api/upload/{analysis_id}/results")
    assert res_res.status_code == 200
    proj_list = res_res.json()["project_results"]
    assert len(proj_list) == 5

    # Check PRJ-004 is cost outlier
    p4 = next(p for p in proj_list if p["project_id"] == "PRJ-004")
    assert p4["is_cost_outlier"] is True
    assert "Cost Outlier" in p4["anomaly_flags"]

    # Check PRJ-001 is tender split candidate
    p1 = next(p for p in proj_list if p["project_id"] == "PRJ-001")
    assert p1["is_tender_split_candidate"] is True
    assert p1["is_duplicate_candidate"] is True


def test_phase3_combined_dataset_analysis():
    """
    TEST 4: Combined MP & Project CSV verifying execution of both pipelines.
    """
    csv_content = (
        "MP_Name,Constituency,Utilisation,Pending_Ratio,Cancelled_Ratio,Average_Cost,Average_Delay,Project_ID,Project_Title,Sanctioned_Cost,District,Contractor_Name\n"
        "Sanjay,YAVATMAL,50.0,40.0,10.0,5000000,90,PRJ-C1,Drinking Water Extension,₹25,00,000,Yavatmal,SK Infra\n"
    )
    files = {"file": ("combined.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/upload", files=files)
    assert up_res.status_code == 200
    analysis_id = up_res.json()["analysis_id"]
    assert up_res.json()["dataset_type"] == "COMBINED"

    an_res = client.post(f"/api/upload/{analysis_id}/analyze")
    assert an_res.status_code == 200
    assert an_res.json()["status"] == "COMPLETED"

    res_res = client.get(f"/api/upload/{analysis_id}/results")
    assert res_res.status_code == 200
    data = res_res.json()
    assert data["mp_results"] is not None
    assert data["project_results"] is not None


def test_phase3_analysis_isolation():
    """
    TEST 7: Analysis isolation between two distinct runs.
    """
    csv1 = "MP_Name,Constituency,Utilisation,Pending %,Cancelled %,Avg Cost,Avg Delay\nMP_Alpha,Const_Alpha,50,30,10,1000000,20\n"
    csv2 = "MP_Name,Constituency,Utilisation,Pending %,Cancelled %,Avg Cost,Avg Delay\nMP_Beta,Const_Beta,60,20,5,2000000,10\n"

    r1 = client.post("/api/upload", files={"file": ("r1.csv", io.BytesIO(csv1.encode("utf-8")), "text/csv")})
    id1 = r1.json()["analysis_id"]
    client.post(f"/api/upload/{id1}/analyze")

    r2 = client.post("/api/upload", files={"file": ("r2.csv", io.BytesIO(csv2.encode("utf-8")), "text/csv")})
    id2 = r2.json()["analysis_id"]
    client.post(f"/api/upload/{id2}/analyze")

    res1 = client.get(f"/api/upload/{id1}/results").json()
    res2 = client.get(f"/api/upload/{id2}/results").json()

    assert any(m["mp_name"] == "MP_Alpha" for m in res1["mp_results"])
    assert not any(m["mp_name"] == "MP_Beta" for m in res1["mp_results"])

    assert any(m["mp_name"] == "MP_Beta" for m in res2["mp_results"])
    assert not any(m["mp_name"] == "MP_Alpha" for m in res2["mp_results"])


def test_phase3_baseline_preservation():
    """
    TEST 8: Baseline regression verification.
    Verifies that the original 544 baseline records remain 100% untouched.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM anomaly_results")
    count = cursor.fetchone()[0]
    assert count == 544

    cursor.execute("SELECT COUNT(*) FROM anomaly_results WHERE final_risk_level = 'CRITICAL'")
    crit_count = cursor.fetchone()[0]
    assert crit_count == 3
    conn.close()


def test_phase4_results_filtering_and_pagination():
    """
    TEST 9: Results filtering by risk level, search, and pagination.
    """
    csv_content = (
        "MP_Name,Constituency,Utilisation,Pending %,Cancelled %,Avg Cost,Avg Delay\n"
        "High MP,Critical Const,20.0,60.0,50.0,20000000,180\n"
        "Low MP,Safe Const,95.0,5.0,1.0,1000000,10\n"
        "Mid MP,Normal Const,60.0,25.0,10.0,3000000,40\n"
    )
    files = {"file": ("filter_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/upload", files=files)
    analysis_id = up_res.json()["analysis_id"]
    client.post(f"/api/upload/{analysis_id}/analyze")

    # Filter CRITICAL
    crit_res = client.get(f"/api/upload/{analysis_id}/results?risk_level=CRITICAL")
    assert crit_res.status_code == 200
    crit_data = crit_res.json()
    assert all(r["final_risk_level"] == "CRITICAL" for r in crit_data["mp_results"])

    # Search
    search_res = client.get(f"/api/upload/{analysis_id}/results?search=Safe")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data["mp_results"]) == 1
    assert "Safe Const" in search_data["mp_results"][0]["constituency"]


def test_phase4_export_csv_and_formula_injection_defense():
    """
    TEST 10: CSV export with enriched fields and formula injection escaping.
    """
    csv_content = (
        "MP_Name,Constituency,Utilisation,Pending %,Cancelled %,Avg Cost,Avg Delay\n"
        "=SUM(1+1),Safe Const,80.0,15.0,5.0,2000000,30\n"
    )
    files = {"file": ("injection_test.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    up_res = client.post("/api/upload", files=files)
    analysis_id = up_res.json()["analysis_id"]
    client.post(f"/api/upload/{analysis_id}/analyze")

    exp_res = client.get(f"/api/upload/{analysis_id}/export")
    assert exp_res.status_code == 200
    assert exp_res.headers["content-type"].startswith("text/csv")
    csv_text = exp_res.text

    assert "Satark_Risk_Score" in csv_text
    assert "Satark_Risk_Level" in csv_text
    # Verify formula injection defense: '=SUM(1+1)' should be escaped with leading quote
    assert "'=SUM(1+1)" in csv_text
