"""
Machine Learning and Anomaly Model Tests for SIH MPLADS AI.
"""

from pathlib import Path
import pytest
import numpy as np
import pandas as pd

from ml.models.isolation_forest import (
    load_model,
    load_config,
    predict_ml_anomaly_score,
    DEFAULT_MODEL_PATH,
    DEFAULT_CONFIG_PATH,
)
from ml.models.hybrid_risk_model import (
    calculate_parameter_anomaly_scores,
    calculate_statistical_anomaly_score,
    calculate_hybrid_risk_score,
    classify_risk_level,
    RISK_LEVEL_LOW,
    RISK_LEVEL_MEDIUM,
    RISK_LEVEL_HIGH,
    RISK_LEVEL_CRITICAL,
)
from ml.explainability.explanation import (
    identify_primary_reason,
    format_detailed_reason,
    generate_explanation,
    REASON_LOW_UTILIZATION,
    REASON_HIGH_PENDING,
    REASON_HIGH_CANCELLATION,
    REASON_HIGH_COST,
    REASON_HIGH_DELAY,
)
from ml.preprocessing.preprocessing import (
    prepare_feature_vector,
    validate_feature_dict,
    ML_FEATURES,
    RAW_PARAMETERS,
)


def test_model_and_config_files_exist():
    """Verify that the trained model and config files exist."""
    assert DEFAULT_MODEL_PATH.exists(), f"Model file not found at {DEFAULT_MODEL_PATH}"
    assert DEFAULT_CONFIG_PATH.exists(), f"Config file not found at {DEFAULT_CONFIG_PATH}"


def test_load_config():
    """Verify loading model_config.json."""
    config = load_config()
    assert isinstance(config, dict)
    assert "features" in config
    assert "contamination" in config
    assert "statistical_weight" in config
    assert "ml_weight" in config
    assert config["statistical_weight"] == 0.6
    assert config["ml_weight"] == 0.4
    assert config["contamination"] == 0.1


def test_load_model():
    """Verify loading trained Isolation Forest model without retraining."""
    model = load_model()
    assert hasattr(model, "decision_function")
    assert hasattr(model, "feature_names_in_")
    expected_features = [
        "utilization_mock",
        "pending_ratio_pct",
        "cancelled_ratio_pct",
        "average_delay_days_mock",
        "average_project_cost_log",
    ]
    for feat in expected_features:
        assert feat in model.feature_names_in_


def test_predict_ml_anomaly_score():
    """Test ML anomaly score output is within [0, 100]."""
    test_features = pd.DataFrame([{
        "utilization_mock": 77.18,
        "pending_ratio_pct": 50.0,
        "cancelled_ratio_pct": 50.0,
        "average_delay_days_mock": 168.0,
        "average_project_cost_log": np.log1p(15206600),
    }])[ML_FEATURES]

    scores, raw = predict_ml_anomaly_score(test_features)
    assert len(scores) == 1
    assert 0.0 <= scores[0] <= 100.0
    # For the top risk candidate Sanjay Uttamrao Deshmukh, ML score should be high (>90)
    assert scores[0] >= 90.0


def test_risk_level_classification():
    """Test risk tier boundaries."""
    assert classify_risk_level(15.0) == RISK_LEVEL_LOW
    assert classify_risk_level(29.99) == RISK_LEVEL_LOW
    assert classify_risk_level(30.0) == RISK_LEVEL_MEDIUM
    assert classify_risk_level(59.99) == RISK_LEVEL_MEDIUM
    assert classify_risk_level(60.0) == RISK_LEVEL_HIGH
    assert classify_risk_level(74.99) == RISK_LEVEL_HIGH
    assert classify_risk_level(75.0) == RISK_LEVEL_CRITICAL
    assert classify_risk_level(88.10) == RISK_LEVEL_CRITICAL


def test_hybrid_risk_formula():
    """Test the 60/40 weighted formula calculation."""
    stat_score = 83.38
    ml_score = 95.17
    final_score, level = calculate_hybrid_risk_score(stat_score, ml_score)
    expected = round((0.60 * stat_score) + (0.40 * ml_score), 2)
    assert final_score == expected
    assert level == RISK_LEVEL_CRITICAL


def test_explainability_generation():
    """Test explainable AI reason identification."""
    param_scores = {
        "utilization_anomaly_score": 35.5,
        "pending_anomaly_score": 88.2,
        "cancelled_anomaly_score": 99.9,
        "avg_cost_anomaly_score": 99.6,
        "avg_delay_anomaly_score": 93.7,
    }
    raw_data = {
        "utilization_mock": 77.18,
        "pending_ratio_pct": 50.0,
        "cancelled_ratio_pct": 50.0,
        "average_project_cost_mock": 15206600,
        "average_delay_days_mock": 168,
    }
    primary, detailed = generate_explanation(raw_data, param_scores)
    assert primary == REASON_HIGH_CANCELLATION
    assert "Pending work ratio is 50.0%" in detailed
    assert "Cancellation ratio is 50.0%" in detailed
    assert "Average project cost is ₹15,206,600" in detailed
    assert "Average delay is 168 days" in detailed


def test_feature_validation_and_preparation():
    """Test feature validation rules."""
    valid_data = {
        "utilization_mock": 65.5,
        "pending_ratio_pct": 20.0,
        "cancelled_ratio_pct": 10.0,
        "average_project_cost_mock": 5000000,
        "average_delay_days_mock": 90,
    }
    df = prepare_feature_vector(valid_data)
    assert list(df.columns) == ML_FEATURES
    assert np.isclose(df["average_project_cost_log"].values[0], np.log1p(5000000))

    # Test invalid values raise ValueError
    with pytest.raises(ValueError):
        validate_feature_dict({"utilization_mock": -10.0})

    with pytest.raises(ValueError):
        validate_feature_dict({"pending_ratio_pct": 150.0})
