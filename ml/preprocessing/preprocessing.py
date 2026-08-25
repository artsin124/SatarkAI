"""
Preprocessing Utilities for SIH MPLADS AI Anomaly Detection System.

Handles data loading, validation, missing value imputation,
feature engineering, and preparation of features for Isolation Forest.
"""

from pathlib import Path
from typing import Dict, List, Optional, Union
import numpy as np
import pandas as pd

# The 5 raw parameters specified for MPLADS anomaly analysis
RAW_PARAMETERS = [
    "utilization_mock",
    "pending_ratio_pct",
    "cancelled_ratio_pct",
    "average_project_cost_mock",
    "average_delay_days_mock",
]

# The 5 features expected by Isolation Forest V2 (log-transformed cost)
ML_FEATURES = [
    "utilization_mock",
    "pending_ratio_pct",
    "cancelled_ratio_pct",
    "average_delay_days_mock",
    "average_project_cost_log",
]


def load_csv_data(file_path: Union[str, Path]) -> pd.DataFrame:
    """
    Safely loads a CSV file into a pandas DataFrame.
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {file_path}")
    return pd.read_csv(path)


def validate_feature_dict(data: Dict[str, Union[int, float]]) -> Dict[str, float]:
    """
    Validates and cleans a dictionary of raw input parameters for anomaly analysis.
    Ensures non-negative values and proper percentage bounds where applicable.
    """
    cleaned: Dict[str, float] = {}

    for param in RAW_PARAMETERS:
        if param not in data:
            raise ValueError(f"Missing required parameter: '{param}'")
        val = data[param]
        if val is None or not isinstance(val, (int, float, np.number)) or np.isnan(val):
            raise ValueError(f"Parameter '{param}' must be a valid numeric value.")
        cleaned[param] = float(val)

    # Validate bounds
    if not (0.0 <= cleaned["utilization_mock"] <= 200.0):
        raise ValueError("utilization_mock should be between 0.0 and 200.0 percent.")
    if not (0.0 <= cleaned["pending_ratio_pct"] <= 100.0):
        raise ValueError("pending_ratio_pct must be between 0.0 and 100.0 percent.")
    if not (0.0 <= cleaned["cancelled_ratio_pct"] <= 100.0):
        raise ValueError("cancelled_ratio_pct must be between 0.0 and 100.0 percent.")
    if cleaned["average_project_cost_mock"] < 0:
        raise ValueError("average_project_cost_mock must be non-negative.")
    if cleaned["average_delay_days_mock"] < 0:
        raise ValueError("average_delay_days_mock must be non-negative.")

    return cleaned


def prepare_feature_vector(data: Dict[str, Union[int, float]]) -> pd.DataFrame:
    """
    Prepares a single-row DataFrame formatted with the exact feature names
    and transformations expected by Isolation Forest V2.
    """
    validated = validate_feature_dict(data)
    
    # Calculate log1p of cost to match V2 model feature engineering
    cost_log = float(np.log1p(validated["average_project_cost_mock"]))

    df = pd.DataFrame([{
        "utilization_mock": validated["utilization_mock"],
        "pending_ratio_pct": validated["pending_ratio_pct"],
        "cancelled_ratio_pct": validated["cancelled_ratio_pct"],
        "average_delay_days_mock": validated["average_delay_days_mock"],
        "average_project_cost_log": cost_log,
    }])
    
    return df[ML_FEATURES]


def preprocess_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """
    Preprocesses a batch DataFrame containing the raw MPLADS parameters.
    Handles missing values and creates the required log-transformed cost feature.
    """
    processed = df.copy()

    # Check for required parameters
    for param in RAW_PARAMETERS:
        if param not in processed.columns:
            raise ValueError(f"Required column '{param}' missing from DataFrame.")
        # Fill missing with median or 0
        if processed[param].isnull().any():
            median_val = processed[param].median()
            processed[param] = processed[param].fillna(median_val if not np.isnan(median_val) else 0.0)

    # Add log transformed cost
    processed["average_project_cost_log"] = np.log1p(processed["average_project_cost_mock"])

    return processed
