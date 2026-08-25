"""
Unified Batch Analysis Service for SATARK AI (Phase 3).

Orchestrates batch anomaly detection across MP / Constituency datasets and
Project-Level Implementation datasets without mutating baseline records.
"""

import csv
import io
import json
import logging
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
import numpy as np
import pandas as pd

from backend.services.upload_service import (
    UPLOAD_DIR,
    clean_numeric_str,
    detect_delimiter,
    detect_encoding,
)
from backend.services.project_anomaly_service import (
    calculate_project_risk_scores,
    detect_cost_outliers,
    detect_semantic_duplicates,
    detect_tender_splitting,
    evaluate_contractor_concentration,
)
from ml.explainability.explanation import generate_explanation
from ml.models.hybrid_risk_model import (
    calculate_hybrid_risk_score,
    calculate_parameter_anomaly_scores,
    calculate_statistical_anomaly_score,
    classify_risk_level,
)
from ml.models.isolation_forest import load_config, load_model, predict_ml_anomaly_score

logger = logging.getLogger(__name__)

MP_5_CORE_FEATURES = [
    "utilization",
    "pending_ratio",
    "cancelled_ratio",
    "average_project_cost",
    "average_delay_days",
]


def load_dataset_rows(analysis_id: str, mapping_dict: Dict[str, str]) -> List[Dict[str, Any]]:
    """
    Reads the stored CSV file for an analysis run and maps headers to canonical fields.
    Returns a list of dictionaries with canonical keys and raw values.
    """
    csv_path = UPLOAD_DIR / f"{analysis_id}.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Underlying CSV dataset for '{analysis_id}' was not found.")

    with open(csv_path, "rb") as f:
        file_bytes = f.read()

    encoding = detect_encoding(file_bytes)
    text = file_bytes.decode(encoding)
    delimiter = detect_delimiter(text)

    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    headers = next(reader)

    # Invert mapping: canonical_field -> list of uploaded headers
    header_to_canonical = mapping_dict

    rows: List[Dict[str, Any]] = []
    for row_idx, row_data in enumerate(reader):
        if not row_data or all(c.strip() == "" for c in row_data):
            continue

        raw_row: Dict[str, Any] = {}
        canonical_row: Dict[str, Any] = {"__row_index__": row_idx + 1}

        for h_idx, h in enumerate(headers):
            val = row_data[h_idx].strip() if h_idx < len(row_data) else ""
            raw_row[h] = val
            canon = header_to_canonical.get(h)
            if canon:
                canonical_row[canon] = val

        canonical_row["__raw__"] = raw_row
        rows.append(canonical_row)

    return rows


def execute_mp_analysis(
    conn: sqlite3.Connection,
    analysis_id: str,
    rows: List[Dict[str, Any]],
    mapped_canonicals: set,
) -> Tuple[int, Dict[str, Any], List[str]]:
    """
    Executes the MP / Constituency Anomaly Analysis pipeline.
    Uses Isolation Forest V2, Percentile Statistical Ranking, and Hybrid 60/40 scoring.
    """
    all_5_available = all(f in mapped_canonicals for f in MP_5_CORE_FEATURES)
    applied_modules: List[str] = []

    if all_5_available:
        applied_modules.extend([
            "stat_anomaly",
            "isolation_forest",
            "hybrid_risk",
            "risk_tiering",
            "xai_explainability",
            "percentile_ranking",
        ])
    else:
        applied_modules.extend(["stat_anomaly", "percentile_ranking", "xai_explainability"])

    valid_rows_count = 0
    parsed_mp_data: List[Dict[str, Any]] = []

    for r in rows:
        mp_name = str(r.get("mp_name") or r.get("__raw__", {}).get("MP_Name", f"MP #{r['__row_index__']}"))
        constituency = str(r.get("constituency") or r.get("__raw__", {}).get("Constituency", f"Constituency #{r['__row_index__']}"))

        u_val = clean_numeric_str(r.get("utilization"))
        p_val = clean_numeric_str(r.get("pending_ratio"))
        c_val = clean_numeric_str(r.get("cancelled_ratio"))
        cost_val = clean_numeric_str(r.get("average_project_cost"))
        delay_val = clean_numeric_str(r.get("average_delay_days"))

        parsed_mp_data.append({
            "row_index": r["__row_index__"],
            "mp_name": mp_name,
            "constituency": constituency,
            "utilization": u_val,
            "pending_ratio": p_val,
            "cancelled_ratio": c_val,
            "avg_project_cost": cost_val,
            "avg_delay_days": delay_val,
            "is_valid": 1 if (u_val is not None and p_val is not None) else 0,
        })

    # Prepare DataFrame for batch ML inference if 5 features available
    if all_5_available:
        ml_features_list = []
        for item in parsed_mp_data:
            u = item["utilization"] if item["utilization"] is not None else 50.0
            p = item["pending_ratio"] if item["pending_ratio"] is not None else 20.0
            c = item["cancelled_ratio"] if item["cancelled_ratio"] is not None else 10.0
            cost = item["avg_project_cost"] if item["avg_project_cost"] is not None else 1000000.0
            delay = item["avg_delay_days"] if item["avg_delay_days"] is not None else 30.0

            ml_features_list.append({
                "utilization_mock": float(u),
                "pending_ratio_pct": float(p),
                "cancelled_ratio_pct": float(c),
                "average_delay_days_mock": float(delay),
                "average_project_cost_log": float(np.log1p(max(0.0, cost))),
            })

        features_df = pd.DataFrame(ml_features_list)[
            ["utilization_mock", "pending_ratio_pct", "cancelled_ratio_pct", "average_delay_days_mock", "average_project_cost_log"]
        ]
        ml_scores, _ = predict_ml_anomaly_score(features_df)
    else:
        ml_scores = [None] * len(parsed_mp_data)

    cursor = conn.cursor()
    risk_level_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    scores_accum: List[float] = []

    for i, item in enumerate(parsed_mp_data):
        u = item["utilization"] if item["utilization"] is not None else 50.0
        p = item["pending_ratio"] if item["pending_ratio"] is not None else 20.0
        c = item["cancelled_ratio"] if item["cancelled_ratio"] is not None else 10.0
        cost = item["avg_project_cost"] if item["avg_project_cost"] is not None else 1000000.0
        delay = item["avg_delay_days"] if item["avg_delay_days"] is not None else 30.0

        raw_dict = {
            "utilization_mock": u,
            "pending_ratio_pct": p,
            "cancelled_ratio_pct": c,
            "average_project_cost_mock": cost,
            "average_delay_days_mock": delay,
        }

        param_scores = calculate_parameter_anomaly_scores(
            utilization_mock=u,
            pending_ratio_pct=p,
            cancelled_ratio_pct=c,
            average_project_cost_mock=cost,
            average_delay_days_mock=delay,
        )
        stat_score = calculate_statistical_anomaly_score(param_scores)

        ml_score = ml_scores[i]
        if ml_score is not None:
            final_risk, final_tier = calculate_hybrid_risk_score(stat_score, float(ml_score))
        else:
            final_risk = stat_score
            final_tier = classify_risk_level(final_risk)

        primary_reason, detailed_reason = generate_explanation(raw_dict, param_scores)

        risk_level_counts[final_tier] = risk_level_counts.get(final_tier, 0) + 1
        scores_accum.append(final_risk)
        valid_rows_count += 1

        cursor.execute("""
            INSERT INTO analysis_mp_results (
                analysis_id, row_index, mp_name, constituency,
                utilization, pending_ratio, cancelled_ratio, avg_project_cost, avg_delay_days,
                statistical_anomaly_score, ml_anomaly_score, final_risk_score, final_risk_level,
                primary_anomaly_reason, detailed_reason, is_valid
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            analysis_id,
            item["row_index"],
            item["mp_name"],
            item["constituency"],
            item["utilization"],
            item["pending_ratio"],
            item["cancelled_ratio"],
            item["avg_project_cost"],
            item["avg_delay_days"],
            stat_score,
            float(ml_score) if ml_score is not None else None,
            final_risk,
            final_tier,
            primary_reason,
            detailed_reason,
            1,
        ))

    summary = {
        "analysis_type": "MP_CONSTITUENCY",
        "total_analyzed": len(parsed_mp_data),
        "valid_rows": valid_rows_count,
        "critical_count": risk_level_counts["CRITICAL"],
        "high_count": risk_level_counts["HIGH"],
        "medium_count": risk_level_counts["MEDIUM"],
        "low_count": risk_level_counts["LOW"],
        "avg_risk_score": round(float(np.mean(scores_accum)), 2) if scores_accum else 0.0,
        "ml_model_applied": all_5_available,
    }

    return valid_rows_count, summary, applied_modules


def execute_project_analysis(
    conn: sqlite3.Connection,
    analysis_id: str,
    rows: List[Dict[str, Any]],
) -> Tuple[int, Dict[str, Any], List[str]]:
    """
    Executes the Project-Level Anomaly Detection pipeline.
    Computes cost outliers, tender splitting, duplicate works, and contractor concentration.
    """
    parsed_projects: List[Dict[str, Any]] = []

    for r in rows:
        raw = r.get("__raw__", {})
        pid = str(r.get("project_id") or raw.get("Work_Code") or raw.get("Project_ID") or f"PRJ-{r['__row_index__']:03d}")
        title = str(r.get("project_title") or raw.get("Project_Title") or raw.get("Work_Title") or "Untitled Project")
        cat = str(r.get("category") or raw.get("Category") or "General")
        dist = str(r.get("district") or raw.get("District") or "Default District")
        cost = clean_numeric_str(r.get("sanctioned_cost") or raw.get("Sanctioned_Amount") or raw.get("Cost")) or 0.0
        exp = clean_numeric_str(r.get("expenditure") or raw.get("Expenditure")) or 0.0
        contractor = str(r.get("contractor_id") or raw.get("Contractor") or raw.get("Agency") or "")
        s_date = str(r.get("sanction_date") or raw.get("Sanction_Date") or "")

        parsed_projects.append({
            "row_index": r["__row_index__"],
            "project_id": pid,
            "project_title": title,
            "category": cat,
            "district": dist,
            "sanctioned_cost": cost,
            "expenditure": exp,
            "contractor_name": contractor,
            "sanction_date": s_date,
        })

    # Run Project Anomaly Algorithms
    cost_outliers = detect_cost_outliers(parsed_projects, "sanctioned_cost", "category")
    tender_splits = detect_tender_splitting(parsed_projects, "contractor_name", "sanctioned_cost", "sanction_date")
    duplicates, dup_matched = detect_semantic_duplicates(parsed_projects, "project_title", "project_id", "district")
    contractor_flags = evaluate_contractor_concentration(parsed_projects, "contractor_name", "sanctioned_cost")

    scores, levels, flags_list = calculate_project_risk_scores(
        cost_outliers, tender_splits, duplicates, contractor_flags
    )

    applied_modules = [
        "cost_outlier",
        "tender_splitting",
        "semantic_duplicate",
        "contractor_analysis",
        "project_risk",
    ]

    cursor = conn.cursor()
    risk_level_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}

    for i, p in enumerate(parsed_projects):
        risk_level_counts[levels[i]] = risk_level_counts.get(levels[i], 0) + 1

        cursor.execute("""
            INSERT INTO analysis_project_results (
                analysis_id, row_index, project_id, project_title, category, district,
                sanctioned_cost, expenditure, contractor_name, is_cost_outlier,
                is_tender_split_candidate, is_duplicate_candidate, duplicate_matched_id,
                risk_score, risk_level, anomaly_flags_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            analysis_id,
            p["row_index"],
            p["project_id"],
            p["project_title"],
            p["category"],
            p["district"],
            p["sanctioned_cost"],
            p["expenditure"],
            p["contractor_name"],
            cost_outliers[i],
            tender_splits[i],
            duplicates[i],
            dup_matched[i],
            scores[i],
            levels[i],
            json.dumps(flags_list[i]),
        ))

    summary = {
        "analysis_type": "PROJECT",
        "total_analyzed": len(parsed_projects),
        "valid_rows": len(parsed_projects),
        "critical_count": risk_level_counts["CRITICAL"],
        "high_count": risk_level_counts["HIGH"],
        "medium_count": risk_level_counts["MEDIUM"],
        "low_count": risk_level_counts["LOW"],
        "cost_outlier_count": sum(cost_outliers),
        "tender_splitting_count": sum(tender_splits),
        "duplicate_candidate_count": sum(duplicates),
        "contractor_concentration_count": sum(contractor_flags),
        "avg_risk_score": round(float(np.mean(scores)), 2) if scores else 0.0,
    }

    return len(parsed_projects), summary, applied_modules


def run_batch_analysis(conn: sqlite3.Connection, analysis_id: str) -> Dict[str, Any]:
    """
    Executes unified batch anomaly analysis for an uploaded dataset.
    Updates SQLite database within an isolated transaction.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_runs WHERE analysis_id = ?", (analysis_id,))
    row = cursor.fetchone()
    if not row:
        raise KeyError(f"Analysis run '{analysis_id}' was not found in the database.")

    r = dict(row)
    mapping_dict = json.loads(r.get("column_mapping_json") or "{}")
    dataset_type = r["dataset_type"]

    # 1. Update status to PROCESSING
    cursor.execute("""
        UPDATE analysis_runs SET status = 'PROCESSING' WHERE analysis_id = ?
    """, (analysis_id,))
    conn.commit()

    try:
        # 2. Load and parse CSV rows
        mapped_rows = load_dataset_rows(analysis_id, mapping_dict)
        if not mapped_rows:
            raise ValueError(f"Analysis '{analysis_id}' contains zero valid data rows.")

        mapped_canonicals = set(mapping_dict.values())
        applied_modules_all: List[str] = []
        overall_summary: Dict[str, Any] = {}
        total_valid = 0

        # Clean existing results for idempotency in rerun
        cursor.execute("DELETE FROM analysis_mp_results WHERE analysis_id = ?", (analysis_id,))
        cursor.execute("DELETE FROM analysis_project_results WHERE analysis_id = ?", (analysis_id,))

        # 3. Dispatch to appropriate analysis engine
        if dataset_type == "MP_CONSTITUENCY":
            valid_count, summary, mods = execute_mp_analysis(conn, analysis_id, mapped_rows, mapped_canonicals)
            total_valid = valid_count
            overall_summary = summary
            applied_modules_all = mods

        elif dataset_type == "PROJECT":
            valid_count, summary, mods = execute_project_analysis(conn, analysis_id, mapped_rows)
            total_valid = valid_count
            overall_summary = summary
            applied_modules_all = mods

        elif dataset_type == "COMBINED":
            mp_valid, mp_sum, mp_mods = execute_mp_analysis(conn, analysis_id, mapped_rows, mapped_canonicals)
            proj_valid, proj_sum, proj_mods = execute_project_analysis(conn, analysis_id, mapped_rows)
            total_valid = max(mp_valid, proj_valid)
            applied_modules_all = list(set(mp_mods + proj_mods))
            overall_summary = {
                "analysis_type": "COMBINED",
                "total_analyzed": len(mapped_rows),
                "valid_rows": total_valid,
                "mp_summary": mp_sum,
                "project_summary": proj_sum,
                "critical_count": mp_sum["critical_count"] + proj_sum["critical_count"],
                "high_count": mp_sum["high_count"] + proj_sum["high_count"],
                "medium_count": mp_sum["medium_count"] + proj_sum["medium_count"],
                "low_count": mp_sum["low_count"] + proj_sum["low_count"],
            }

        else:
            # Fallback for generic/unclassified datasets with some numeric columns
            total_valid = len(mapped_rows)
            overall_summary = {
                "analysis_type": "UNKNOWN",
                "total_analyzed": len(mapped_rows),
                "valid_rows": total_valid,
                "message": "Dataset lacked standard MP or Project schema fields. Diagnostic metadata recorded.",
            }

        # 4. Update analysis run record as COMPLETED
        cursor.execute("""
            UPDATE analysis_runs
            SET status = 'COMPLETED',
                valid_rows = ?,
                modules_applied_json = ?,
                summary_metrics_json = ?
            WHERE analysis_id = ?
        """, (
            total_valid,
            json.dumps(applied_modules_all),
            json.dumps(overall_summary),
            analysis_id,
        ))
        conn.commit()

        return {
            "analysis_id": analysis_id,
            "status": "COMPLETED",
            "dataset_type": dataset_type,
            "total_rows": len(mapped_rows),
            "valid_rows": total_valid,
            "modules_applied": applied_modules_all,
            "summary_metrics": overall_summary,
            "message": f"Successfully analyzed {total_valid} records using {len(applied_modules_all)} module(s).",
        }

    except Exception as e:
        conn.rollback()
        error_msg = str(e)
        logger.exception(f"Batch analysis failed for '{analysis_id}': {error_msg}")
        cursor.execute("""
            UPDATE analysis_runs
            SET status = 'FAILED',
                summary_metrics_json = ?
            WHERE analysis_id = ?
        """, (json.dumps({"error": error_msg}), analysis_id))
        conn.commit()
        raise RuntimeError(f"Batch analysis failed: {error_msg}") from e
