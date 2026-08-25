"""
Pydantic Schemas for MPLADS Anomaly Detection API.
"""

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AnomalyRecord(BaseModel):
    """
    Schema representing an MPLADS constituency anomaly record.
    """
    id: Optional[int] = Field(None, description="Unique record identifier (database rowid)")
    hon_ble_members_of_parliaments: str = Field(..., description="Name of the Member of Parliament")
    constituency: str = Field(..., description="Parliamentary Constituency")
    utilization_mock: float = Field(..., description="MPLADS fund utilization percentage")
    pending_ratio_pct: float = Field(..., description="Percentage of sanctioned works currently pending")
    cancelled_ratio_pct: float = Field(..., description="Percentage of sanctioned works cancelled")
    average_project_cost_mock: int = Field(..., description="Average cost per project in INR")
    average_delay_days_mock: int = Field(..., description="Average completion delay in days")
    statistical_anomaly_score: float = Field(..., description="Composite statistical anomaly score (0-100)")
    ml_anomaly_score: float = Field(..., description="Isolation Forest ML anomaly score (0-100)")
    final_risk_score: float = Field(..., description="Weighted hybrid risk score (0-100)")
    final_risk_level: str = Field(..., description="Risk tier: LOW, MEDIUM, HIGH, or CRITICAL")
    primary_anomaly_reason: str = Field(..., description="Primary identified risk factor")
    detailed_reason: str = Field(..., description="Detailed breakdown of elevated risk indicators")
    previously_selected_10: bool = Field(..., description="Whether this record was in the 10 validation candidates pool")


class AnomalyListResponse(BaseModel):
    """
    Response schema for lists of anomaly records.
    """
    total: int = Field(..., description="Total count of matching records")
    data: List[AnomalyRecord] = Field(..., description="List of anomaly records")


class RiskStatisticsResponse(BaseModel):
    """
    Response schema for dynamic aggregate risk statistics across all analyzed records.
    """
    total_records: int = Field(..., description="Total constituencies analyzed")
    low_count: int = Field(..., description="Count of LOW risk records (0-29.99)")
    medium_count: int = Field(..., description="Count of MEDIUM risk records (30-59.99)")
    high_count: int = Field(..., description="Count of HIGH risk records (60-74.99)")
    critical_count: int = Field(..., description="Count of CRITICAL risk records (75-100)")
    average_risk_score: float = Field(..., description="Mean final risk score")
    maximum_risk_score: float = Field(..., description="Highest final risk score in the dataset")
    minimum_risk_score: float = Field(..., description="Lowest final risk score in the dataset")


class RiskDistributionResponse(BaseModel):
    """
    Response schema for categorical risk tier distribution.
    """
    LOW: int = Field(..., description="Count of LOW risk records")
    MEDIUM: int = Field(..., description="Count of MEDIUM risk records")
    HIGH: int = Field(..., description="Count of HIGH risk records")
    CRITICAL: int = Field(..., description="Count of CRITICAL risk records")
    total: int = Field(..., description="Total records evaluated")


class SearchResponse(BaseModel):
    """
    Response schema for MP and constituency search queries.
    """
    total: int = Field(..., description="Total matching records found")
    query: str = Field(..., description="Search query executed")
    data: List[AnomalyRecord] = Field(..., description="Matching records sorted by final_risk_score DESC")


class NewAnalysisRequest(BaseModel):
    """
    Payload for on-demand anomaly and risk evaluation of an MPLADS record.
    """
    hon_ble_members_of_parliaments: Optional[str] = Field("Sample MP", description="MP Name (optional)")
    constituency: Optional[str] = Field("Sample Constituency", description="Constituency Name (optional)")
    utilization_mock: float = Field(..., ge=0.0, le=200.0, description="Fund utilization percentage (0-200)")
    pending_ratio_pct: float = Field(..., ge=0.0, le=100.0, description="Pending work ratio percentage (0-100)")
    cancelled_ratio_pct: float = Field(..., ge=0.0, le=100.0, description="Cancellation ratio percentage (0-100)")
    average_project_cost_mock: float = Field(..., ge=0.0, description="Average project cost in INR")
    average_delay_days_mock: float = Field(..., ge=0.0, description="Average project delay in days")


class ParameterScoreBreakdown(BaseModel):
    """
    Individual parameter anomaly score percentiles (0-100).
    """
    utilization_anomaly_score: float
    pending_anomaly_score: float
    cancelled_anomaly_score: float
    avg_cost_anomaly_score: float
    avg_delay_anomaly_score: float


class NewAnalysisResponse(BaseModel):
    """
    Response schema for on-demand anomaly analysis.
    """
    hon_ble_members_of_parliaments: Optional[str] = None
    constituency: Optional[str] = None
    statistical_anomaly_score: float = Field(..., description="Statistical percentile score (60% weight)")
    ml_anomaly_score: float = Field(..., description="Isolation Forest anomaly score (40% weight)")
    final_risk_score: float = Field(..., description="Final calibrated hybrid risk score (0-100)")
    final_risk_level: str = Field(..., description="Assigned governance risk tier: LOW, MEDIUM, HIGH, CRITICAL")
    primary_anomaly_reason: str = Field(..., description="Primary risk driver")
    detailed_reason: str = Field(..., description="Evidence-based explanation of elevated metrics")
    parameter_breakdown: ParameterScoreBreakdown = Field(..., description="Breakdown of individual parameter anomaly scores")


class AlertItem(BaseModel):
    """
    Schema for a dynamically generated operational risk alert.
    """
    id: int = Field(..., description="Unique constituency anomaly record ID")
    hon_ble_members_of_parliaments: str = Field(..., description="Member of Parliament name")
    constituency: str = Field(..., description="Parliamentary Constituency")
    severity: str = Field(..., description="Alert severity level: CRITICAL or HIGH")
    alert_title: str = Field(..., description="Descriptive alert title")
    final_risk_score: float = Field(..., description="Calibrated final risk score (0-100)")
    final_risk_level: str = Field(..., description="Risk tier: CRITICAL or HIGH")
    primary_anomaly_reason: str = Field(..., description="Primary identified risk factor")
    detailed_reason: str = Field(..., description="Detailed operational justification")
    recommendation: str = Field(..., description="Administrative review guidance")


class AlertListResponse(BaseModel):
    """
    Response schema for lists of dynamic operational risk alerts.
    """
    total: int = Field(..., description="Total active alerts (CRITICAL + HIGH)")
    critical_count: int = Field(..., description="Count of CRITICAL severity alerts")
    high_count: int = Field(..., description="Count of HIGH severity warnings")
    data: List[AlertItem] = Field(..., description="List of dynamically generated risk alerts")
