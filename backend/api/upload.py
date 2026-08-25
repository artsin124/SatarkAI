import sqlite3
from typing import Optional
from fastapi import APIRouter, Depends, File, HTTPException, Path, Query, Response, UploadFile
from fastapi.responses import Response

from backend.database.connection import get_db
from backend.schemas.upload_schema import (
    ColumnMappingRequest,
    ColumnMappingResponse,
    DatasetPreviewResponse,
)
from backend.schemas.analysis_schema import (
    AnalysisExecutionResponse,
    AnalysisResultsResponse,
    AnalysisRunListResponse,
    AnalysisStatusResponse,
)
from backend.services.batch_analysis_service import run_batch_analysis
from backend.services.upload_service import (
    export_analysis_csv,
    get_analysis_results,
    get_analysis_status,
    get_preview_data,
    list_analysis_runs,
    process_uploaded_csv,
    update_column_mapping,
)

router = APIRouter(tags=["Smart CSV Analysis"])


@router.post(
    "/api/upload",
    response_model=DatasetPreviewResponse,
    summary="Upload MPLADS CSV for Smart Analysis",
    description=(
        "Ingests an MPLADS CSV file (max 25MB), validates headers and delimiters, "
        "detects column semantics, classifies dataset type, and calculates available analysis modules."
    ),
)
async def upload_csv_file(
    file: UploadFile = File(..., description="MPLADS CSV dataset file"),
    conn: sqlite3.Connection = Depends(get_db),
):
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Invalid file format. Only CSV (.csv) files are supported for smart analysis."
        )

    try:
        file_bytes = await file.read()
        result = process_uploaded_csv(
            file_bytes=file_bytes,
            original_filename=file.filename,
            conn=conn,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Internal error processing CSV upload: {str(e)}"
        )


@router.get(
    "/api/upload/{analysis_id}/preview",
    response_model=DatasetPreviewResponse,
    summary="Get CSV Preview & Detected Schema",
    description="Retrieves sample rows, column definitions, and detected mappings for a specific uploaded analysis run.",
)
def read_upload_preview(
    analysis_id: str = Path(..., description="Unique analysis run identifier"),
    conn: sqlite3.Connection = Depends(get_db),
):
    try:
        return get_preview_data(conn, analysis_id)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except FileNotFoundError as fe:
        raise HTTPException(status_code=404, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading preview: {str(e)}")


@router.post(
    "/api/upload/{analysis_id}/mapping",
    response_model=ColumnMappingResponse,
    summary="Confirm or Update Column Mapping",
    description="Submits user-confirmed or modified column mappings and recalculates analytical module eligibility.",
)
def save_column_mapping(
    payload: ColumnMappingRequest,
    analysis_id: str = Path(..., description="Unique analysis run identifier"),
    conn: sqlite3.Connection = Depends(get_db),
):
    try:
        return update_column_mapping(
            conn=conn,
            analysis_id=analysis_id,
            user_mappings=payload.mappings,
        )
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating mapping: {str(e)}")


@router.post(
    "/api/upload/{analysis_id}/analyze",
    response_model=AnalysisExecutionResponse,
    summary="Execute Batch Anomaly Analysis",
    description="Runs the unified batch analysis pipeline (Isolation Forest V2, Percentile scoring, or Project Outliers) for the mapped dataset.",
)
def execute_analysis(
    analysis_id: str = Path(..., description="Unique analysis run identifier"),
    conn: sqlite3.Connection = Depends(get_db),
):
    try:
        summary = run_batch_analysis(conn, analysis_id)
        return summary
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis processing failed: {str(e)}"
        )


@router.get(
    "/api/upload/{analysis_id}/status",
    response_model=AnalysisStatusResponse,
    summary="Get Analysis Run Status",
    description="Checks the current status of an uploaded dataset and its configured analysis modules.",
)
def read_analysis_status(
    analysis_id: str = Path(..., description="Unique analysis run identifier"),
    conn: sqlite3.Connection = Depends(get_db),
):
    try:
        return get_analysis_status(conn, analysis_id)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading status: {str(e)}")


@router.get(
    "/api/upload/{analysis_id}/results",
    response_model=AnalysisResultsResponse,
    summary="Get Paginated Analysis Results",
    description="Retrieves analyzed anomaly records, risk tiers, and XAI justifications with pagination and filtering.",
)
def read_analysis_results(
    analysis_id: str = Path(..., description="Unique analysis run identifier"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Records per page"),
    risk_level: Optional[str] = Query(None, description="Filter by risk tier: CRITICAL, HIGH, MEDIUM, LOW"),
    search: Optional[str] = Query(None, description="Search term for MP, constituency, project title, or contractor"),
    sort_by: Optional[str] = Query(None, description="Column to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort order: asc or desc"),
    conn: sqlite3.Connection = Depends(get_db),
):
    try:
        return get_analysis_results(
            conn=conn,
            analysis_id=analysis_id,
            page=page,
            page_size=page_size,
            risk_level=risk_level,
            search=search,
            sort_by=sort_by,
            sort_order=sort_order,
        )
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading analysis results: {str(e)}")


@router.get(
    "/api/upload/{analysis_id}/export",
    summary="Export Enriched Analysis Results CSV",
    description="Downloads the uploaded dataset enriched with Satark AI governance scores and justifications with formula injection protections.",
)
def export_dataset_results(
    analysis_id: str = Path(..., description="Unique analysis run identifier"),
    conn: sqlite3.Connection = Depends(get_db),
):
    try:
        csv_content = export_analysis_csv(conn, analysis_id)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f'attachment; filename="satark_analysis_{analysis_id}.csv"'
            },
        )
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except FileNotFoundError as fe:
        raise HTTPException(status_code=404, detail=str(fe))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting CSV results: {str(e)}")


@router.get(
    "/api/analyses",
    response_model=AnalysisRunListResponse,
    summary="List All Analysis Runs",
    description="Returns a list of all historical smart analysis runs registered in the SATARK AI system.",
)
def read_all_analyses(conn: sqlite3.Connection = Depends(get_db)):
    try:
        return list_analysis_runs(conn)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing analyses: {str(e)}")

