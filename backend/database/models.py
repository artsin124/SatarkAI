"""
Database Models and Data Representations for SIH MPLADS AI.
"""

from dataclasses import dataclass
from typing import Optional, Dict, Any
import sqlite3


@dataclass
class AnomalyRecordDB:
    """
    Representation of a single anomaly_results database record.
    """
    id: int
    hon_ble_members_of_parliaments: str
    constituency: str
    utilization_mock: float
    pending_ratio_pct: float
    cancelled_ratio_pct: float
    average_project_cost_mock: int
    average_delay_days_mock: int
    statistical_anomaly_score: float
    ml_anomaly_score: float
    final_risk_score: float
    final_risk_level: str
    primary_anomaly_reason: str
    detailed_reason: str
    previously_selected_10: int

    @classmethod
    def from_row(cls, row: sqlite3.Row) -> "AnomalyRecordDB":
        """
        Instantiates an AnomalyRecordDB from an sqlite3.Row instance.
        """
        row_dict = dict(row)
        return cls(
            id=row_dict.get("id") or row_dict.get("rowid", 0),
            hon_ble_members_of_parliaments=row_dict.get("hon_ble_members_of_parliaments", ""),
            constituency=row_dict.get("constituency", ""),
            utilization_mock=float(row_dict.get("utilization_mock", 0.0)),
            pending_ratio_pct=float(row_dict.get("pending_ratio_pct", 0.0)),
            cancelled_ratio_pct=float(row_dict.get("cancelled_ratio_pct", 0.0)),
            average_project_cost_mock=int(row_dict.get("average_project_cost_mock", 0)),
            average_delay_days_mock=int(row_dict.get("average_delay_days_mock", 0)),
            statistical_anomaly_score=float(row_dict.get("statistical_anomaly_score", 0.0)),
            ml_anomaly_score=float(row_dict.get("ml_anomaly_score", 0.0)),
            final_risk_score=float(row_dict.get("final_risk_score", 0.0)),
            final_risk_level=row_dict.get("final_risk_level", "LOW"),
            primary_anomaly_reason=row_dict.get("primary_anomaly_reason", ""),
            detailed_reason=row_dict.get("detailed_reason", ""),
            previously_selected_10=int(row_dict.get("previously_selected_10", 0)),
        )

    def to_dict(self) -> Dict[str, Any]:
        """
        Converts the dataclass instance to a standard Python dictionary.
        """
        return {
            "id": self.id,
            "hon_ble_members_of_parliaments": self.hon_ble_members_of_parliaments,
            "constituency": self.constituency,
            "utilization_mock": self.utilization_mock,
            "pending_ratio_pct": self.pending_ratio_pct,
            "cancelled_ratio_pct": self.cancelled_ratio_pct,
            "average_project_cost_mock": self.average_project_cost_mock,
            "average_delay_days_mock": self.average_delay_days_mock,
            "statistical_anomaly_score": self.statistical_anomaly_score,
            "ml_anomaly_score": self.ml_anomaly_score,
            "final_risk_score": self.final_risk_score,
            "final_risk_level": self.final_risk_level,
            "primary_anomaly_reason": self.primary_anomaly_reason,
            "detailed_reason": self.detailed_reason,
            "previously_selected_10": bool(self.previously_selected_10),
        }
