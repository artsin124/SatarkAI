"""
Isolation Forest Service for SIH MPLADS AI Anomaly Detection.

Loads the pre-trained Isolation Forest model and configuration without retraining.
Provides normalized 0-100 ML anomaly score predictions.
"""

import json
from pathlib import Path
from typing import Any, Dict, Optional, Tuple, Union
import joblib
import numpy as np
import pandas as pd

# Default paths
DEFAULT_MODEL_PATH = Path(__file__).resolve().parent.parent / "trained" / "mplads_isolation_forest_v2.pkl"
DEFAULT_CONFIG_PATH = Path(__file__).resolve().parent.parent / "trained" / "model_config.json"

# Decision function normalization boundaries derived from the trained 544-record dataset
DECISION_MIN = -0.163371557685425
DECISION_MAX = 0.10696896516093929

_CACHED_MODEL = None
_CACHED_CONFIG = None


def load_config(config_path: Optional[Union[str, Path]] = None) -> Dict[str, Any]:
    """
    Loads model configuration from JSON.
    """
    global _CACHED_CONFIG
    path = Path(config_path) if config_path else DEFAULT_CONFIG_PATH
    if not path.exists():
        raise FileNotFoundError(f"Model configuration file not found at: {path}")
    
    with open(path, "r", encoding="utf-8") as f:
        _CACHED_CONFIG = json.load(f)
    return _CACHED_CONFIG


def load_model(model_path: Optional[Union[str, Path]] = None) -> Any:
    """
    Loads the pre-trained Isolation Forest model via joblib.
    Caches the loaded model in memory for fast inference.
    """
    global _CACHED_MODEL
    if _CACHED_MODEL is not None and model_path is None:
        return _CACHED_MODEL

    path = Path(model_path) if model_path else DEFAULT_MODEL_PATH
    if not path.exists():
        raise FileNotFoundError(f"Trained model file not found at: {path}")

    _CACHED_MODEL = joblib.load(path)
    return _CACHED_MODEL


def predict_ml_anomaly_score(
    features_df: pd.DataFrame,
    model: Optional[Any] = None,
) -> Tuple[np.ndarray, np.ndarray]:
    """
    Computes ML anomaly score on a 0-100 scale using the Isolation Forest decision function.
    Lower decision function values indicate higher anomaly degree.
    
    Returns:
        tuple (ml_anomaly_scores: np.ndarray, raw_decision_scores: np.ndarray)
    """
    if model is None:
        model = load_model()

    raw_scores = model.decision_function(features_df)
    
    # Min-max inversion so lower decision function maps to higher anomaly score (0-100)
    denominator = DECISION_MAX - DECISION_MIN
    if denominator == 0:
        scaled = np.full_like(raw_scores, 50.0)
    else:
        scaled = 100.0 * (1.0 - (raw_scores - DECISION_MIN) / denominator)
    
    # Clip to [0, 100] and round to 2 decimal places
    normalized_scores = np.clip(np.round(scaled, 2), 0.0, 100.0)
    return normalized_scores, raw_scores
