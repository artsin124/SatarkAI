"""
Pydantic Schemas for Smart CSV Ingestion, Preview, and Column Mapping.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class ColumnMappingItem(BaseModel):
    """
    Mapping status and confidence for a single uploaded CSV column.
    """
    uploaded_column: str = Field(..., description="Original header name from uploaded CSV")
    canonical_field: Optional[str] = Field(None, description="Mapped Satark AI standard field name")
    confidence: float = Field(..., description="Confidence score from 0.0 to 1.0")
    confidence_tier: str = Field(..., description="HIGH (>=0.85), MEDIUM (0.60-0.84), LOW (<0.60), or UNMAPPED")
    data_type: str = Field("unknown", description="Detected column data type: numeric, text, date")
    sample_values: List[str] = Field(default_factory=list, description="Sample values from the first few rows")
    non_empty_count: int = Field(0, description="Count of non-empty values")
    null_count: int = Field(0, description="Count of missing/null values")


class ModuleEligibilityItem(BaseModel):
    """
    Status of an analytical module for the mapped dataset.
    """
    module_id: str = Field(..., description="Unique identifier for the analytical module")
    module_name: str = Field(..., description="Human-readable module title")
    target_type: str = Field(..., description="Target dataset tier: MP_CONSTITUENCY or PROJECT")
    is_available: bool = Field(..., description="Whether all required fields are mapped and ready")
    status: str = Field(..., description="AVAILABLE, PARTIALLY_AVAILABLE, or UNAVAILABLE")
    required_fields: List[str] = Field(default_factory=list, description="Required canonical fields for this module")
    missing_fields: List[str] = Field(default_factory=list, description="Fields currently missing for this module")
    description: str = Field(..., description="Brief description of what this module computes")
    status_reason: Optional[str] = Field(None, description="Explanation if module is unavailable or partial")


class DatasetPreviewResponse(BaseModel):
    """
    Response returned upon successful CSV upload, preview extraction, and auto-mapping.
    """
    analysis_id: str = Field(..., description="Unique analysis run identifier")
    file_name: str = Field(..., description="Sanitized original file name")
    file_size_bytes: int = Field(..., description="File size in bytes")
    total_rows: int = Field(..., description="Total data rows parsed")
    headers: List[str] = Field(..., description="List of original column headers")
    preview_rows: List[Dict[str, Any]] = Field(..., description="First 10 sample rows")
    dataset_type: str = Field(..., description="Detected classification: MP_CONSTITUENCY, PROJECT, COMBINED, or UNKNOWN")
    dataset_type_label: str = Field(..., description="User-friendly dataset label")
    column_mappings: List[ColumnMappingItem] = Field(..., description="Auto-detected column mappings with confidence")
    module_eligibility: List[ModuleEligibilityItem] = Field(..., description="Analytical modules available for this schema")
    created_at: str = Field(..., description="Timestamp of upload")


class ColumnMappingRequest(BaseModel):
    """
    Payload when user confirms or adjusts column mappings.
    """
    mappings: Dict[str, Optional[str]] = Field(
        ...,
        description="Dictionary mapping uploaded column name -> canonical Satark AI field name (or null to unmap)"
    )


class ColumnMappingResponse(BaseModel):
    """
    Response returned when column mappings are updated.
    """
    analysis_id: str = Field(..., description="Analysis run identifier")
    dataset_type: str = Field(..., description="Updated dataset classification")
    dataset_type_label: str = Field(..., description="Updated dataset classification label")
    column_mappings: List[ColumnMappingItem] = Field(..., description="Current active column mappings")
    module_eligibility: List[ModuleEligibilityItem] = Field(..., description="Updated module eligibility matrix")
    ready_for_analysis: bool = Field(..., description="Whether at least one module is available for execution")
    message: str = Field(..., description="Status summary message")
