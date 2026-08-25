"""
Pydantic Schemas for Analysis Runs and Status.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class AnalysisRunItem(BaseModel):
    """
    Representation of a persisted analysis run.
    """
    analysis_id: str = Field(..., description="Unique analysis run identifier")
    file_name: str = Field(..., description="Uploaded CSV filename")
    dataset_type: str = Field(..., description="Dataset classification: MP_CONSTITUENCY, PROJECT, COMBINED, UNKNOWN")
    total_rows: int = Field(..., description="Total rows in dataset")
    valid_rows: int = Field(..., description="Analyzable valid rows")
    status: str = Field(..., description="UPLOADED, MAPPED, RUNNING, COMPLETED, FAILED")
    column_mapping: Dict[str, Any] = Field(default_factory=dict, description="Mapped column configuration")
    modules_applied: List[str] = Field(default_factory=list, description="List of applied module IDs")
    summary_metrics: Optional[Dict[str, Any]] = Field(None, description="Aggregate summary metrics if completed")
    created_at: str = Field(..., description="Run timestamp")


class AnalysisRunListResponse(BaseModel):
    """
    List of historical analysis runs.
    """
    total: int = Field(..., description="Total count of analysis runs")
    data: List[AnalysisRunItem] = Field(..., description="List of analysis runs")


class AnalysisStatusResponse(BaseModel):
    """
    Status of a specific analysis run.
    """
    analysis_id: str = Field(..., description="Analysis run identifier")
    status: str = Field(..., description="Current status: UPLOADED, MAPPED, PROCESSING, COMPLETED, FAILED")
    dataset_type: str = Field(..., description="Dataset classification")
    total_rows: int = Field(..., description="Total rows")
    valid_rows: int = Field(..., description="Valid rows")
    modules_applied: List[str] = Field(default_factory=list, description="Modules configured/executed")
    summary_metrics: Optional[Dict[str, Any]] = Field(None, description="Aggregate summary metrics if completed")
    created_at: str = Field(..., description="Timestamp created")
    message: str = Field(..., description="Status summary message")


class MPResultRecord(BaseModel):
    """
    Analyzed MP / Constituency anomaly record.
    """
    id: int
    row_index: int
    mp_name: Optional[str] = None
    constituency: Optional[str] = None
    utilization: Optional[float] = None
    pending_ratio: Optional[float] = None
    cancelled_ratio: Optional[float] = None
    avg_project_cost: Optional[float] = None
    avg_delay_days: Optional[float] = None
    statistical_anomaly_score: Optional[float] = None
    ml_anomaly_score: Optional[float] = None
    final_risk_score: float
    final_risk_level: str
    primary_anomaly_reason: Optional[str] = None
    detailed_reason: Optional[str] = None


class ProjectResultRecord(BaseModel):
    """
    Analyzed Project-Level anomaly record.
    """
    id: int
    row_index: int
    project_id: Optional[str] = None
    project_title: Optional[str] = None
    category: Optional[str] = None
    district: Optional[str] = None
    sanctioned_cost: Optional[float] = None
    expenditure: Optional[float] = None
    contractor_name: Optional[str] = None
    is_cost_outlier: bool
    is_tender_split_candidate: bool
    is_duplicate_candidate: bool
    duplicate_matched_id: Optional[str] = None
    risk_score: float
    risk_level: str
    anomaly_flags: List[str] = Field(default_factory=list)


class AnalysisResultsResponse(BaseModel):
    """
    Paginated results response for a completed analysis run.
    """
    analysis_id: str
    dataset_type: str
    total_records: int
    page: int
    page_size: int
    total_pages: int
    summary_metrics: Optional[Dict[str, Any]] = None
    mp_results: Optional[List[MPResultRecord]] = None
    project_results: Optional[List[ProjectResultRecord]] = None


class AnalysisExecutionResponse(BaseModel):
    """
    Response returned when batch analysis execution is triggered.
    """
    analysis_id: str
    status: str
    dataset_type: str
    total_rows: int
    valid_rows: int
    modules_applied: List[str]
    summary_metrics: Dict[str, Any]
    message: str

