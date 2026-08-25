"""
Hybrid Risk Model Service for SIH MPLADS AI.

Combines Statistical Anomaly Scoring (60%) and ML Anomaly Scoring (40%)
to produce a transparent, calibrated Final Risk Score (0-100) and Risk Level.
"""

from pathlib import Path
from typing import Dict, Optional, Tuple, Union
import numpy as np
import pandas as pd
from scipy import stats

from .isolation_forest import load_config

# Baseline dataset path for empirical percentile scoring
BASELINE_FEATURES_PATH = (
    Path(__file__).resolve().parent.parent.parent
    / "data"
    / "processed"
    / "sih_ml_features.csv"
)

# Standard Risk Levels
RISK_LEVEL_LOW = "LOW"
RISK_LEVEL_MEDIUM = "MEDIUM"
RISK_LEVEL_HIGH = "HIGH"
RISK_LEVEL_CRITICAL = "CRITICAL"

_BASELINE_DATA: Optional[pd.DataFrame] = None


def get_baseline_data() -> pd.DataFrame:
    """
    Loads and caches the 544-record baseline feature dataset.
    """
    global _BASELINE_DATA
    if _BASELINE_DATA is not None:
        return _BASELINE_DATA

    if not BASELINE_FEATURES_PATH.exists():
        # Fallback to local sibling or root if needed
        alt_path = Path(__file__).resolve().parent.parent.parent / "sih_ml_features.csv"
        if alt_path.exists():
            _BASELINE_DATA = pd.read_csv(alt_path)
            return _BASELINE_DATA
        raise FileNotFoundError(f"Baseline feature file not found at: {BASELINE_FEATURES_PATH}")

    _BASELINE_DATA = pd.read_csv(BASELINE_FEATURES_PATH)
    return _BASELINE_DATA


def calculate_parameter_anomaly_scores(
    utilization_mock: float,
    pending_ratio_pct: float,
    cancelled_ratio_pct: float,
    average_project_cost_mock: float,
    average_delay_days_mock: float,
    baseline_df: Optional[pd.DataFrame] = None,
) -> Dict[str, float]:
    """
    Calculates parameter-level statistical anomaly scores (0-100) using empirical percentile ranking.
    
    Interpretation:
    - low utilization -> higher anomaly score
    - high pending ratio -> higher anomaly score
    - high cancellation ratio -> higher anomaly score
    - high average project cost -> higher anomaly score
    - high average delay -> higher anomaly score
    """
    if baseline_df is None:
        baseline_df = get_baseline_data()

    # Percentile ranking relative to baseline distribution
    u_vals = baseline_df["utilization_mock"].values
    p_vals = baseline_df["pending_ratio_pct"].values
    c_vals = baseline_df["cancelled_ratio_pct"].values
    cost_vals = baseline_df["average_project_cost_mock"].values
    delay_vals = baseline_df["average_delay_days_mock"].values

    # Utilization: lower is higher anomaly
    util_score = 100.0 - float(stats.percentileofscore(u_vals, utilization_mock, kind="rank"))
    pend_score = float(stats.percentileofscore(p_vals, pending_ratio_pct, kind="rank"))
    canc_score = float(stats.percentileofscore(c_vals, cancelled_ratio_pct, kind="rank"))
    cost_score = float(stats.percentileofscore(cost_vals, average_project_cost_mock, kind="rank"))
    delay_score = float(stats.percentileofscore(delay_vals, average_delay_days_mock, kind="rank"))

    return {
        "utilization_anomaly_score": round(np.clip(util_score, 0.0, 100.0), 2),
        "pending_anomaly_score": round(np.clip(pend_score, 0.0, 100.0), 2),
        "cancelled_anomaly_score": round(np.clip(canc_score, 0.0, 100.0), 2),
        "avg_cost_anomaly_score": round(np.clip(cost_score, 0.0, 100.0), 2),
        "avg_delay_anomaly_score": round(np.clip(delay_score, 0.0, 100.0), 2),
    }


def calculate_statistical_anomaly_score(
    parameter_scores: Dict[str, float]
) -> float:
    """
    Combines the 5 parameter-level anomaly scores into an overall statistical anomaly score (0-100).
    """
    keys = [
        "utilization_anomaly_score",
        "pending_anomaly_score",
        "cancelled_anomaly_score",
        "avg_cost_anomaly_score",
        "avg_delay_anomaly_score",
    ]
    scores = [parameter_scores[k] for k in keys if k in parameter_scores]
    if not scores:
        raise ValueError("No valid parameter scores provided.")
    return round(float(np.mean(scores)), 2)


def classify_risk_level(final_risk_score: float) -> str:
    """
    Categorizes the final risk score into standardized governance risk tiers:
    0   - 29.99 -> LOW
    30  - 59.99 -> MEDIUM
    60  - 74.99 -> HIGH
    75  - 100   -> CRITICAL
    """
    if final_risk_score >= 75.0:
        return RISK_LEVEL_CRITICAL
    elif final_risk_score >= 60.0:
        return RISK_LEVEL_HIGH
    elif final_risk_score >= 30.0:
        return RISK_LEVEL_MEDIUM
    else:
        return RISK_LEVEL_LOW


def calculate_hybrid_risk_score(
    statistical_anomaly_score: float,
    ml_anomaly_score: float,
    statistical_weight: Optional[float] = None,
    ml_weight: Optional[float] = None,
) -> Tuple[float, str]:
    """
    Calculates the final hybrid risk score using configured weights (default 60% Statistical, 40% ML).
    
    Formula:
        FINAL RISK SCORE = (w_stat * statistical_anomaly_score) + (w_ml * ml_anomaly_score)
        
    Returns:
        tuple (final_risk_score: float, final_risk_level: str)
    """
    if statistical_weight is None or ml_weight is None:
        try:
            config = load_config()
            stat_w = float(config.get("statistical_weight", 0.6))
            ml_w = float(config.get("ml_weight", 0.4))
        except Exception:
            stat_w = 0.60
            ml_w = 0.40
    else:
        stat_w = statistical_weight
        ml_w = ml_weight

    raw_final = (stat_w * statistical_anomaly_score) + (ml_w * ml_anomaly_score)
    final_score = round(float(np.clip(raw_final, 0.0, 100.0)), 2)
    risk_level = classify_risk_level(final_score)

    return final_score, risk_level
