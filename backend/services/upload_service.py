"""
CSV Upload, Validation, Smart Column Mapping, and Module Discovery Service for SATARK AI.
"""

import csv
import io
import json
import os
import re
import sqlite3
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from backend.schemas.upload_schema import (
    ColumnMappingItem,
    DatasetPreviewResponse,
    ModuleEligibilityItem,
    ColumnMappingResponse,
)
from backend.schemas.analysis_schema import (
    AnalysisRunItem,
    AnalysisRunListResponse,
    AnalysisStatusResponse,
)

MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB limit
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "uploads"

# ----------------------------------------------------------------------
# Canonical Dictionary & Aliases
# ----------------------------------------------------------------------
CANONICAL_ALIASES: Dict[str, List[str]] = {
    # MP / Constituency Level
    "mp_name": [
        "mp_name", "mp name", "hon_ble_members_of_parliaments", "member of parliament",
        "mp", "honble_mp", "representative", "name of mp", "mp_nominee", "member",
        "hon'ble member of parliament", "honble mp name", "mp_representative", "hon ble members of parliaments"
    ],
    "constituency": [
        "constituency", "constituency_name", "pc_name", "parliamentary constituency",
        "parliamentary_constituency", "constituency name", "lok sabha constituency", "pc",
        "parliamentary_constituency_name", "ls_constituency", "constituency_code", "pc name"
    ],
    "utilization": [
        "utilization_mock", "utilization", "fund utilization", "utilization_pct", "utilisation",
        "utilisation_pct", "utilization_percentage", "funds_utilized_pct", "expenditure_ratio",
        "fund_utilization_ratio", "utilization_rate", "funds_spent_pct", "utilization_mock_pct",
        "fund_utilization", "fund utilisation", "utilisation_percentage", "utilisation %", "utilization %"
    ],
    "pending_ratio": [
        "pending_ratio_pct", "pending_ratio", "pending_work_pct", "pending work ratio",
        "uncompleted_ratio", "pending_pct", "works_pending_ratio", "backlog_pct",
        "pending_works_pct", "pending_percentage", "pending_ratio_mock", "pending %",
        "pending_works_ratio", "pending works ratio", "pending works %"
    ],
    "cancelled_ratio": [
        "cancelled_ratio_pct", "cancelled_ratio", "cancellation_ratio", "cancellation_pct",
        "cancelled_pct", "works_cancelled_ratio", "dropped_works_pct", "cancelled_works_pct",
        "cancellation_percentage", "cancelled_ratio_mock", "cancelled %", "cancellation %",
        "cancelled_works_ratio", "cancelled works ratio"
    ],
    "average_project_cost": [
        "average_project_cost_mock", "average_project_cost", "avg_cost", "average cost",
        "avg_project_cost", "mean_project_cost", "cost_per_work", "average_cost_inr",
        "sanctioned_cost_avg", "avg_cost_inr", "average_cost", "mean_cost", "avg project cost",
        "average project cost inr", "mean project cost inr", "average cost inr"
    ],
    "average_delay_days": [
        "average_delay_days_mock", "average_delay_days", "avg_delay", "average delay",
        "mean_delay_days", "average_delay", "delay_days", "completion_delay_days",
        "avg_delay_days", "mean_delay", "delay_days_mock", "avg delay days", "average delay days"
    ],

    # Project Level
    "project_id": [
        "project_id", "work_code", "project_code", "sanction_number", "work_id",
        "scheme_id", "project_number", "sanction_id", "work_order_no", "work code", "project id"
    ],
    "project_title": [
        "project_title", "work_title", "work_description", "project_name",
        "work_name", "project_description", "scheme_name", "work_detail",
        "project title", "work title", "work description"
    ],
    "category": [
        "category", "sector", "work_category", "scheme_category", "type_of_work",
        "head_of_development", "project_category", "sector_name", "work_type", "work category"
    ],
    "sanctioned_cost": [
        "sanctioned_cost", "sanctioned_amount", "estimated_cost", "sanction_cost",
        "allocated_amount", "sanction_amount", "estimated_amount", "amount_sanctioned",
        "sanctioned cost", "sanctioned amount", "estimated cost"
    ],
    "district": [
        "district", "district_name", "district_headquarter", "nodal_district",
        "location_district", "district_code", "district name"
    ],
    "contractor_id": [
        "contractor_id", "contractor_name", "implementing_agency", "vendor",
        "contractor", "agency_name", "executing_agency", "implementer", "contractor_code",
        "contractor name", "implementing agency"
    ],
    "sanction_date": [
        "sanction_date", "date_of_sanction", "approval_date", "start_date",
        "sanctioned_on", "sanction_order_date", "date_sanctioned", "sanction date"
    ],
}

CANONICAL_LABELS: Dict[str, str] = {
    "mp_name": "MP Name",
    "constituency": "Constituency",
    "utilization": "Fund Utilization (%)",
    "pending_ratio": "Pending Work Ratio (%)",
    "cancelled_ratio": "Cancellation Ratio (%)",
    "average_project_cost": "Average Project Cost (₹)",
    "average_delay_days": "Average Delay (Days)",
    "project_id": "Project ID / Work Code",
    "project_title": "Project Title / Description",
    "category": "Project Category / Sector",
    "sanctioned_cost": "Sanctioned Cost (₹)",
    "district": "District",
    "contractor_id": "Contractor / Implementing Agency",
    "sanction_date": "Sanction Date",
}


def sanitize_filename(filename: str) -> str:
    """Sanitizes user-provided filename to prevent path traversal and injection."""
    clean = re.sub(r"[^\w\.\-\_]", "_", Path(filename).name)
    return clean or "uploaded_dataset.csv"


def clean_numeric_str(val: Any) -> Optional[float]:
    """
    Cleans strings with Indian currency symbols, commas, and percentage signs.
    E.g. '₹1,50,000' -> 150000.0, '85.5%' -> 85.5
    """
    if val is None or val == "":
        return None
    if isinstance(val, (int, float)):
        return float(val)
    s = str(val).strip()
    s = re.sub(r"[₹\$\€\£\s,]", "", s)
    s = re.sub(r"^(?:Rs\.?|INR)\s*", "", s, flags=re.IGNORECASE)
    s = s.rstrip("%")
    try:
        return float(s)
    except ValueError:
        return None


def detect_encoding(raw_bytes: bytes) -> str:
    """Detects encoding among UTF-8-BOM, UTF-8, Latin-1, CP1252."""
    if raw_bytes.startswith(b"\xef\xbb\xbf"):
        return "utf-8-sig"
    for enc in ["utf-8", "latin-1", "cp1252"]:
        try:
            raw_bytes.decode(enc)
            return enc
        except UnicodeDecodeError:
            continue
    return "latin-1"


def detect_delimiter(sample_text: str) -> str:
    """Detects CSV delimiter (comma, semicolon, tab)."""
    try:
        sniffer = csv.Sniffer()
        dialect = sniffer.sniff(sample_text[:4096])
        if dialect.delimiter in [",", ";", "\t"]:
            return dialect.delimiter
    except Exception:
        pass

    # Frequency fallback
    first_line = sample_text.splitlines()[0] if sample_text else ""
    counts = {",": first_line.count(","), ";": first_line.count(";"), "\t": first_line.count("\t")}
    best = max(counts, key=counts.get)
    return best if counts[best] > 0 else ","


def normalize_header(header: str) -> str:
    """Normalizes header string for robust matching."""
    s = header.lower().strip()
    s = re.sub(r"[^\w\s]", " ", s)
    s = re.sub(r"\s+", "_", s).strip("_")
    return s


def infer_column_type(values: List[str]) -> str:
    """Infers whether column is numeric, date, or text."""
    non_empty = [v for v in values if v is not None and str(v).strip() != ""]
    if not non_empty:
        return "unknown"

    numeric_matches = sum(1 for v in non_empty if clean_numeric_str(v) is not None)
    if numeric_matches / len(non_empty) >= 0.7:
        return "numeric"

    date_matches = sum(
        1 for v in non_empty
        if re.search(r"^\d{4}[-/]\d{1,2}[-/]\d{1,2}$|^\d{1,2}[-/]\d{1,2}[-/]\d{2,4}$", str(v).strip())
    )
    if date_matches / len(non_empty) >= 0.7:
        return "date"

    return "text"


def match_column(header: str, values: List[str], already_mapped: Set[str]) -> Tuple[Optional[str], float, str]:
    """
    Evaluates confidence score and maps an uploaded column header to a canonical field.
    Returns: (canonical_field, confidence, confidence_tier)
    """
    norm_h = normalize_header(header)
    col_type = infer_column_type(values)

    best_field: Optional[str] = None
    best_score = 0.0

    for canonical, aliases in CANONICAL_ALIASES.items():
        if canonical in already_mapped:
            continue

        for alias in aliases:
            norm_alias = normalize_header(alias)

            # 1. Exact match
            if norm_h == norm_alias:
                score = 1.0
            # 2. Exact word token equality
            elif norm_h.replace("_", " ") == norm_alias.replace("_", " "):
                score = 0.95
            # 3. Containment match (requiring at least 4 characters to avoid generic false positives)
            elif len(norm_alias) >= 5 and (norm_alias in norm_h or norm_h in norm_alias):
                score = 0.80
            else:
                score = 0.0

            # Type compatibility check
            if score > 0:
                is_numeric_canonical = canonical in [
                    "utilization", "pending_ratio", "cancelled_ratio",
                    "average_project_cost", "average_delay_days", "sanctioned_cost"
                ]
                if is_numeric_canonical and col_type == "numeric":
                    score = min(1.0, score + 0.05)
                elif is_numeric_canonical and col_type == "text":
                    score -= 0.15

                if score > best_score:
                    best_score = score
                    best_field = canonical

    if best_score >= 0.85:
        tier = "HIGH"
    elif best_score >= 0.60:
        tier = "MEDIUM"
    elif best_score > 0.0:
        tier = "LOW"
    else:
        tier = "UNMAPPED"
        best_field = None

    return best_field, round(best_score, 2), tier


def classify_dataset_type(mapped_fields: Set[str]) -> Tuple[str, str]:
    """Classifies dataset into MP_CONSTITUENCY, PROJECT, COMBINED, or UNKNOWN."""
    mp_core = {"mp_name", "constituency"}
    mp_metrics = {"utilization", "pending_ratio", "cancelled_ratio", "average_project_cost", "average_delay_days"}
    project_core = {"project_id", "project_title"}
    project_metrics = {"sanctioned_cost", "category", "contractor_id", "district"}

    has_mp = bool(mp_core.intersection(mapped_fields)) or len(mp_metrics.intersection(mapped_fields)) >= 2
    has_proj = (bool(project_core.intersection(mapped_fields)) and len(project_metrics.intersection(mapped_fields)) >= 1) or len(project_metrics.intersection(mapped_fields)) >= 3

    if has_mp and has_proj:
        return "COMBINED", "Combined Constituency & Project Dataset"
    elif has_mp:
        return "MP_CONSTITUENCY", "MP / Parliamentary Constituency Dataset"
    elif has_proj:
        return "PROJECT", "Project-Level Implementation Dataset"
    else:
        return "UNKNOWN", "Unknown / Unclassified Dataset"


def evaluate_module_eligibility(mapped_fields: Set[str]) -> List[ModuleEligibilityItem]:
    """Determines eligibility for all Satark AI governance analysis modules."""
    mp_5_features = [
        "utilization", "pending_ratio", "cancelled_ratio", "average_project_cost", "average_delay_days"
    ]
    missing_for_ml = [f for f in mp_5_features if f not in mapped_fields]

    modules: List[ModuleEligibilityItem] = [
        # --- MP / Constituency Modules ---
        ModuleEligibilityItem(
            module_id="stat_anomaly",
            module_name="Statistical Percentile Anomaly Scoring",
            target_type="MP_CONSTITUENCY",
            is_available=len(missing_for_ml) <= 2 and len(mapped_fields.intersection(set(mp_5_features))) >= 2,
            status="AVAILABLE" if len(missing_for_ml) == 0 else ("PARTIALLY_AVAILABLE" if len(missing_for_ml) <= 2 else "UNAVAILABLE"),
            required_fields=mp_5_features,
            missing_fields=missing_for_ml,
            description="Empirical percentile anomaly ranking against the 544 national parliamentary constituency baseline.",
            status_reason=None if len(missing_for_ml) == 0 else f"Missing fields: {', '.join(missing_for_ml)}",
        ),
        ModuleEligibilityItem(
            module_id="isolation_forest",
            module_name="Isolation Forest V2 ML Anomaly Model",
            target_type="MP_CONSTITUENCY",
            is_available=len(missing_for_ml) == 0,
            status="AVAILABLE" if len(missing_for_ml) == 0 else "UNAVAILABLE",
            required_fields=mp_5_features,
            missing_fields=missing_for_ml,
            description="Multi-dimensional unsupervised anomaly detection using pre-trained Isolation Forest V2.",
            status_reason=None if len(missing_for_ml) == 0 else f"ML Risk Analysis unavailable — missing: {', '.join(missing_for_ml)}",
        ),
        ModuleEligibilityItem(
            module_id="hybrid_risk",
            module_name="Calibrated Hybrid Risk Scoring (60/40)",
            target_type="MP_CONSTITUENCY",
            is_available=len(missing_for_ml) == 0,
            status="AVAILABLE" if len(missing_for_ml) == 0 else "UNAVAILABLE",
            required_fields=mp_5_features,
            missing_fields=missing_for_ml,
            description="Weighted risk fusion combining statistical percentiles (60%) and Isolation Forest (40%).",
            status_reason=None if len(missing_for_ml) == 0 else "Requires all 5 core features for calibrated hybrid weighting.",
        ),
        ModuleEligibilityItem(
            module_id="risk_tiering",
            module_name="Governance Risk Tiering (Low/Med/High/Critical)",
            target_type="MP_CONSTITUENCY",
            is_available=len(missing_for_ml) == 0,
            status="AVAILABLE" if len(missing_for_ml) == 0 else "UNAVAILABLE",
            required_fields=mp_5_features,
            missing_fields=missing_for_ml,
            description="Categorization of constituencies into standard governance risk tiers.",
            status_reason=None if len(missing_for_ml) == 0 else "Requires final risk score calculation.",
        ),
        ModuleEligibilityItem(
            module_id="xai_explainability",
            module_name="Explainable AI (XAI) Driver Analysis",
            target_type="MP_CONSTITUENCY",
            is_available=len(mapped_fields.intersection(set(mp_5_features))) >= 2,
            status="AVAILABLE" if len(missing_for_ml) == 0 else "PARTIALLY_AVAILABLE",
            required_fields=mp_5_features,
            missing_fields=missing_for_ml,
            description="Evidence-based primary anomaly drivers and quantitative metric justifications.",
            status_reason=None if len(missing_for_ml) == 0 else "Will generate explanations for available mapped metrics only.",
        ),
        ModuleEligibilityItem(
            module_id="percentile_ranking",
            module_name="National Percentile Ranking",
            target_type="MP_CONSTITUENCY",
            is_available=len(mapped_fields.intersection(set(mp_5_features))) >= 1,
            status="AVAILABLE",
            required_fields=["utilization", "pending_ratio", "cancelled_ratio"],
            missing_fields=[f for f in ["utilization", "pending_ratio", "cancelled_ratio"] if f not in mapped_fields],
            description="Constituency percentile positioning across individual operational parameters.",
            status_reason=None,
        ),

        # --- Project Level Modules ---
        ModuleEligibilityItem(
            module_id="cost_outlier",
            module_name="Category-Wise Cost Outlier Detection",
            target_type="PROJECT",
            is_available="sanctioned_cost" in mapped_fields,
            status="AVAILABLE" if "sanctioned_cost" in mapped_fields else "UNAVAILABLE",
            required_fields=["sanctioned_cost", "category"],
            missing_fields=[f for f in ["sanctioned_cost", "category"] if f not in mapped_fields],
            description="IQR and Z-score outlier detection on sanctioned project costs within categories.",
            status_reason=None if "sanctioned_cost" in mapped_fields else "Requires 'sanctioned_cost' field.",
        ),
        ModuleEligibilityItem(
            module_id="tender_splitting",
            module_name="Tender Splitting & Threshold Clumping Detection",
            target_type="PROJECT",
            is_available="sanctioned_cost" in mapped_fields and "contractor_id" in mapped_fields,
            status="AVAILABLE" if "sanctioned_cost" in mapped_fields and "contractor_id" in mapped_fields else "UNAVAILABLE",
            required_fields=["sanctioned_cost", "contractor_id", "sanction_date"],
            missing_fields=[f for f in ["sanctioned_cost", "contractor_id", "sanction_date"] if f not in mapped_fields],
            description="Identifies repeated small work sanctions to identical contractors under statutory audit thresholds.",
            status_reason=None if ("sanctioned_cost" in mapped_fields and "contractor_id" in mapped_fields) else "Requires 'sanctioned_cost' and 'contractor_id'.",
        ),
        ModuleEligibilityItem(
            module_id="semantic_duplicate",
            module_name="Semantic Duplicate & Overlapping Work Detection",
            target_type="PROJECT",
            is_available="project_title" in mapped_fields,
            status="AVAILABLE" if "project_title" in mapped_fields else "UNAVAILABLE",
            required_fields=["project_title", "district"],
            missing_fields=[f for f in ["project_title", "district"] if f not in mapped_fields],
            description="Lexical token and character n-gram overlap detection for similar works within districts.",
            status_reason=None if "project_title" in mapped_fields else "Requires 'project_title' field.",
        ),
        ModuleEligibilityItem(
            module_id="contractor_analysis",
            module_name="Contractor Concentration & Delay Intelligence",
            target_type="PROJECT",
            is_available="contractor_id" in mapped_fields,
            status="AVAILABLE" if "contractor_id" in mapped_fields else "UNAVAILABLE",
            required_fields=["contractor_id", "sanctioned_cost"],
            missing_fields=[f for f in ["contractor_id", "sanctioned_cost"] if f not in mapped_fields],
            description="Contractor allocation volume, workload share, and delay tracking.",
            status_reason=None if "contractor_id" in mapped_fields else "Requires 'contractor_id'.",
        ),
        ModuleEligibilityItem(
            module_id="project_risk",
            module_name="Project Risk Scoring",
            target_type="PROJECT",
            is_available="sanctioned_cost" in mapped_fields and "project_title" in mapped_fields,
            status="AVAILABLE" if "sanctioned_cost" in mapped_fields and "project_title" in mapped_fields else "UNAVAILABLE",
            required_fields=["sanctioned_cost", "project_title"],
            missing_fields=[f for f in ["sanctioned_cost", "project_title"] if f not in mapped_fields],
            description="Composite project risk calculation based on cost, delay, and contractor indicators.",
            status_reason=None if ("sanctioned_cost" in mapped_fields and "project_title" in mapped_fields) else "Requires 'sanctioned_cost' and 'project_title'.",
        ),
    ]

    return modules


# ----------------------------------------------------------------------
# Core Ingestion & Analysis Management
# ----------------------------------------------------------------------

def process_uploaded_csv(
    file_bytes: bytes,
    original_filename: str,
    conn: sqlite3.Connection,
) -> DatasetPreviewResponse:
    """
    Validates, saves, parses, detects schema, and records a new analysis run in the database.
    """
    # 1. File size validation
    file_size = len(file_bytes)
    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File size ({file_size / (1024*1024):.2f} MB) exceeds maximum allowed limit of 25 MB.")

    if file_size == 0:
        raise ValueError("Uploaded file is empty.")

    # 2. Filename validation
    clean_name = sanitize_filename(original_filename)
    if not clean_name.lower().endswith(".csv"):
        raise ValueError("Only CSV (.csv) files are supported for smart analysis.")

    # 3. Encoding detection
    encoding = detect_encoding(file_bytes)
    try:
        decoded_text = file_bytes.decode(encoding)
    except Exception as e:
        raise ValueError(f"Unable to decode CSV with detected encoding '{encoding}': {str(e)}")

    # 4. Delimiter detection
    delimiter = detect_delimiter(decoded_text)

    # 5. CSV Parsing
    reader = csv.reader(io.StringIO(decoded_text), delimiter=delimiter)
    try:
        headers = next(reader)
    except StopIteration:
        raise ValueError("CSV file contains no headers.")

    if not headers or all(h.strip() == "" for h in headers):
        raise ValueError("CSV header row is empty or malformed.")

    # Check for duplicate headers
    seen_headers: Set[str] = set()
    cleaned_headers: List[str] = []
    for i, h in enumerate(headers):
        h_clean = h.strip() or f"Column_{i+1}"
        if h_clean in seen_headers:
            h_clean = f"{h_clean}_{i+1}"
        seen_headers.add(h_clean)
        cleaned_headers.append(h_clean)

    headers = cleaned_headers

    # Parse rows
    all_rows: List[Dict[str, Any]] = []
    col_values: Dict[str, List[str]] = {h: [] for h in headers}

    for row_idx, row_data in enumerate(reader):
        if not row_data or all(c.strip() == "" for c in row_data):
            continue
        row_dict: Dict[str, Any] = {}
        for h_idx, h in enumerate(headers):
            val = row_data[h_idx].strip() if h_idx < len(row_data) else ""
            row_dict[h] = val
            if row_idx < 50:
                col_values[h].append(val)
        all_rows.append(row_dict)

    if not all_rows:
        raise ValueError("CSV contains no valid data rows.")

    total_rows = len(all_rows)
    preview_rows = all_rows[:10]

    # 6. Smart Column Mapping
    column_mappings: List[ColumnMappingItem] = []
    already_mapped: Set[str] = set()

    for h in headers:
        vals = col_values.get(h, [])
        canonical, conf, tier = match_column(h, vals, already_mapped)
        if canonical and tier in ["HIGH", "MEDIUM"]:
            already_mapped.add(canonical)

        non_empty = sum(1 for r in all_rows if r.get(h, "") != "")
        null_count = total_rows - non_empty
        data_type = infer_column_type(vals)

        column_mappings.append(ColumnMappingItem(
            uploaded_column=h,
            canonical_field=canonical,
            confidence=conf,
            confidence_tier=tier,
            data_type=data_type,
            sample_values=[str(v) for v in vals[:3] if v != ""],
            non_empty_count=non_empty,
            null_count=null_count,
        ))

    # 7. Dataset Classification & Module Eligibility
    mapped_canonical_set = {m.canonical_field for m in column_mappings if m.canonical_field}
    dataset_type, dataset_label = classify_dataset_type(mapped_canonical_set)
    module_eligibility = evaluate_module_eligibility(mapped_canonical_set)

    # 8. Save CSV in isolated storage
    analysis_id = f"analysis_{datetime.now().strftime('%Y%m%d')}_{uuid.uuid4().hex[:8]}"
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    saved_csv_path = UPLOAD_DIR / f"{analysis_id}.csv"
    with open(saved_csv_path, "wb") as f:
        f.write(file_bytes)

    # 9. Record Analysis Run in SQLite
    mapping_dict = {m.uploaded_column: m.canonical_field for m in column_mappings if m.canonical_field}
    eligible_modules = [m.module_id for m in module_eligibility if m.is_available]

    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO analysis_runs (
            analysis_id, file_name, dataset_type, total_rows, valid_rows,
            status, column_mapping_json, modules_applied_json, summary_metrics_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        analysis_id,
        clean_name,
        dataset_type,
        total_rows,
        total_rows,
        "UPLOADED",
        json.dumps(mapping_dict),
        json.dumps(eligible_modules),
        json.dumps({
            "total_columns": len(headers),
            "mapped_columns": len(mapping_dict),
            "file_size_bytes": file_size,
        }),
    ))
    conn.commit()

    return DatasetPreviewResponse(
        analysis_id=analysis_id,
        file_name=clean_name,
        file_size_bytes=file_size,
        total_rows=total_rows,
        headers=headers,
        preview_rows=preview_rows,
        dataset_type=dataset_type,
        dataset_type_label=dataset_label,
        column_mappings=column_mappings,
        module_eligibility=module_eligibility,
        created_at=datetime.now().isoformat(),
    )


def get_preview_data(conn: sqlite3.Connection, analysis_id: str) -> DatasetPreviewResponse:
    """Retrieves stored preview and schema details for an analysis run."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM analysis_runs WHERE analysis_id = ?
    """, (analysis_id,))
    row = cursor.fetchone()
    if not row:
        raise KeyError(f"Analysis run '{analysis_id}' not found.")

    r = dict(row)
    csv_path = UPLOAD_DIR / f"{analysis_id}.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Underlying CSV dataset file for '{analysis_id}' was not found on disk.")

    with open(csv_path, "rb") as f:
        file_bytes = f.read()

    encoding = detect_encoding(file_bytes)
    text = file_bytes.decode(encoding)
    delimiter = detect_delimiter(text)
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    headers = next(reader)

    preview_rows = []
    col_values = {h: [] for h in headers}
    for i, r_data in enumerate(reader):
        if i >= 10:
            break
        r_dict = {h: r_data[h_idx] if h_idx < len(r_data) else "" for h_idx, h in enumerate(headers)}
        preview_rows.append(r_dict)
        for h, val in r_dict.items():
            col_values[h].append(val)

    mapping_dict = json.loads(r.get("column_mapping_json") or "{}")
    column_mappings = []
    for h in headers:
        mapped = mapping_dict.get(h)
        vals = col_values.get(h, [])
        data_type = infer_column_type(vals)
        column_mappings.append(ColumnMappingItem(
            uploaded_column=h,
            canonical_field=mapped,
            confidence=1.0 if mapped else 0.0,
            confidence_tier="HIGH" if mapped else "UNMAPPED",
            data_type=data_type,
            sample_values=vals[:3],
            non_empty_count=len(vals),
            null_count=0,
        ))

    mapped_set = {v for v in mapping_dict.values() if v}
    dataset_type, dataset_label = classify_dataset_type(mapped_set)
    modules = evaluate_module_eligibility(mapped_set)

    return DatasetPreviewResponse(
        analysis_id=analysis_id,
        file_name=r["file_name"],
        file_size_bytes=len(file_bytes),
        total_rows=r["total_rows"],
        headers=headers,
        preview_rows=preview_rows,
        dataset_type=dataset_type,
        dataset_type_label=dataset_label,
        column_mappings=column_mappings,
        module_eligibility=modules,
        created_at=r["created_at"],
    )


def update_column_mapping(
    conn: sqlite3.Connection,
    analysis_id: str,
    user_mappings: Dict[str, Optional[str]],
) -> ColumnMappingResponse:
    """Updates user-confirmed column mappings and recalculates module eligibility."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM analysis_runs WHERE analysis_id = ?
    """, (analysis_id,))
    row = cursor.fetchone()
    if not row:
        raise KeyError(f"Analysis run '{analysis_id}' not found.")

    clean_mappings = {k: v for k, v in user_mappings.items() if v}
    mapped_set = set(clean_mappings.values())
    dataset_type, dataset_label = classify_dataset_type(mapped_set)
    module_eligibility = evaluate_module_eligibility(mapped_set)
    eligible_modules = [m.module_id for m in module_eligibility if m.is_available]

    # Update database
    cursor.execute("""
        UPDATE analysis_runs
        SET dataset_type = ?,
            column_mapping_json = ?,
            modules_applied_json = ?,
            status = 'MAPPED'
        WHERE analysis_id = ?
    """, (
        dataset_type,
        json.dumps(clean_mappings),
        json.dumps(eligible_modules),
        analysis_id,
    ))
    conn.commit()

    column_mapping_items = [
        ColumnMappingItem(
            uploaded_column=col,
            canonical_field=canon,
            confidence=1.0 if canon else 0.0,
            confidence_tier="HIGH" if canon else "UNMAPPED",
            data_type="text",
            sample_values=[],
            non_empty_count=0,
            null_count=0,
        )
        for col, canon in user_mappings.items()
    ]

    ready = len(eligible_modules) > 0
    msg = (
        f"Column mapping confirmed. {len(eligible_modules)} analytical module(s) ready for execution."
        if ready else
        "Column mapping updated. Please map additional required fields to enable analysis modules."
    )

    return ColumnMappingResponse(
        analysis_id=analysis_id,
        dataset_type=dataset_type,
        dataset_type_label=dataset_label,
        column_mappings=column_mapping_items,
        module_eligibility=module_eligibility,
        ready_for_analysis=ready,
        message=msg,
    )


def get_analysis_status(conn: sqlite3.Connection, analysis_id: str) -> AnalysisStatusResponse:
    """Returns the current status of an analysis run."""
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_runs WHERE analysis_id = ?", (analysis_id,))
    row = cursor.fetchone()
    if not row:
        raise KeyError(f"Analysis run '{analysis_id}' not found.")

    r = dict(row)
    modules = json.loads(r.get("modules_applied_json") or "[]")
    status_str = r["status"]
    msg = {
        "UPLOADED": "Dataset uploaded and schema detected. Awaiting mapping confirmation.",
        "MAPPED": "Schema mapping confirmed. Dataset ready for batch analysis.",
        "RUNNING": "Analysis is currently processing.",
        "COMPLETED": "Analysis completed successfully.",
        "FAILED": "Analysis execution failed.",
    }.get(status_str, "Active analysis run.")

    return AnalysisStatusResponse(
        analysis_id=analysis_id,
        status=status_str,
        dataset_type=r["dataset_type"],
        total_rows=r["total_rows"],
        valid_rows=r["valid_rows"],
        modules_applied=modules,
        created_at=r["created_at"],
        message=msg,
    )


def list_analysis_runs(conn: sqlite3.Connection) -> AnalysisRunListResponse:
    """Lists all stored analysis runs sorted by creation date descending."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM analysis_runs ORDER BY created_at DESC
    """)
    rows = cursor.fetchall()
    items: List[AnalysisRunItem] = []

    for r in rows:
        d = dict(r)
        mapping = json.loads(d.get("column_mapping_json") or "{}")
        modules = json.loads(d.get("modules_applied_json") or "[]")
        metrics = json.loads(d.get("summary_metrics_json") or "{}") if d.get("summary_metrics_json") else None

        items.append(AnalysisRunItem(
            analysis_id=d["analysis_id"],
            file_name=d["file_name"],
            dataset_type=d["dataset_type"],
            total_rows=d["total_rows"],
            valid_rows=d["valid_rows"],
            status=d["status"],
            column_mapping=mapping,
            modules_applied=modules,
            summary_metrics=metrics,
            created_at=d["created_at"],
        ))

    return AnalysisRunListResponse(total=len(items), data=items)


def sanitize_csv_cell(val: Any) -> str:
    """
    Guards against CSV / Excel Formula Injection (CWE-1236).
    Prepends a single quote if the cell begins with dangerous formula triggers.
    """
    if val is None:
        return ""
    s = str(val)
    if s.startswith(("=", "+", "-", "@", "\t", "\r")):
        return "'" + s
    return s


def get_analysis_results(
    conn: sqlite3.Connection,
    analysis_id: str,
    page: int = 1,
    page_size: int = 20,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    sort_by: Optional[str] = None,
    sort_order: str = "desc",
) -> Dict[str, Any]:
    """
    Retrieves paginated and filtered analysis results for MP or Project datasets.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_runs WHERE analysis_id = ?", (analysis_id,))
    run_row = cursor.fetchone()
    if not run_row:
        raise KeyError(f"Analysis run '{analysis_id}' not found.")

    r = dict(run_row)
    dataset_type = r["dataset_type"]
    metrics = json.loads(r.get("summary_metrics_json") or "{}") if r.get("summary_metrics_json") else None

    page = max(1, page)
    page_size = max(1, min(100, page_size))
    offset = (page - 1) * page_size

    mp_results: Optional[List[Dict[str, Any]]] = None
    project_results: Optional[List[Dict[str, Any]]] = None
    total_records = 0

    if dataset_type in ["MP_CONSTITUENCY", "COMBINED"]:
        # Query MP results
        where_clauses = ["analysis_id = ?"]
        params: List[Any] = [analysis_id]

        if risk_level:
            where_clauses.append("final_risk_level = ?")
            params.append(risk_level.upper())

        if search:
            where_clauses.append("(mp_name LIKE ? OR constituency LIKE ?)")
            search_param = f"%{search}%"
            params.extend([search_param, search_param])

        where_sql = " AND ".join(where_clauses)
        cursor.execute(f"SELECT COUNT(*) FROM analysis_mp_results WHERE {where_sql}", params)
        total_records = cursor.fetchone()[0]

        allowed_sorts = {
            "final_risk_score": "final_risk_score",
            "utilization": "utilization",
            "pending_ratio": "pending_ratio",
            "cancelled_ratio": "cancelled_ratio",
            "avg_project_cost": "avg_project_cost",
            "avg_delay_days": "avg_delay_days",
            "row_index": "row_index",
        }
        order_col = allowed_sorts.get(sort_by or "", "final_risk_score")
        order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"

        query = f"""
            SELECT * FROM analysis_mp_results
            WHERE {where_sql}
            ORDER BY {order_col} {order_dir}
            LIMIT ? OFFSET ?
        """
        cursor.execute(query, params + [page_size, offset])
        mp_rows = cursor.fetchall()
        mp_results = [dict(row) for row in mp_rows]

    if dataset_type in ["PROJECT", "COMBINED"]:
        # Query Project results
        where_clauses = ["analysis_id = ?"]
        params = [analysis_id]

        if risk_level:
            where_clauses.append("risk_level = ?")
            params.append(risk_level.upper())

        if search:
            where_clauses.append("(project_title LIKE ? OR project_id LIKE ? OR contractor_name LIKE ? OR district LIKE ?)")
            search_param = f"%{search}%"
            params.extend([search_param, search_param, search_param, search_param])

        where_sql = " AND ".join(where_clauses)
        cursor.execute(f"SELECT COUNT(*) FROM analysis_project_results WHERE {where_sql}", params)
        proj_count = cursor.fetchone()[0]
        if dataset_type == "PROJECT":
            total_records = proj_count
        else:
            total_records = max(total_records, proj_count)

        allowed_sorts = {
            "risk_score": "risk_score",
            "sanctioned_cost": "sanctioned_cost",
            "row_index": "row_index",
        }
        order_col = allowed_sorts.get(sort_by or "", "risk_score")
        order_dir = "ASC" if sort_order.lower() == "asc" else "DESC"

        query = f"""
            SELECT * FROM analysis_project_results
            WHERE {where_sql}
            ORDER BY {order_col} {order_dir}
            LIMIT ? OFFSET ?
        """
        cursor.execute(query, params + [page_size, offset])
        proj_rows = cursor.fetchall()

        project_results = []
        for row in proj_rows:
            d = dict(row)
            d["is_cost_outlier"] = bool(d.get("is_cost_outlier"))
            d["is_tender_split_candidate"] = bool(d.get("is_tender_split_candidate"))
            d["is_duplicate_candidate"] = bool(d.get("is_duplicate_candidate"))
            d["anomaly_flags"] = json.loads(d.get("anomaly_flags_json") or "[]")
            project_results.append(d)

    total_pages = (total_records + page_size - 1) // page_size if total_records > 0 else 1

    return {
        "analysis_id": analysis_id,
        "dataset_type": dataset_type,
        "total_records": total_records,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "summary_metrics": metrics,
        "mp_results": mp_results,
        "project_results": project_results,
    }


def export_analysis_csv(conn: sqlite3.Connection, analysis_id: str) -> str:
    """
    Exports the complete analyzed dataset enriched with Satark AI governance scores
    and XAI justifications, formatted cleanly with formula injection defenses.
    """
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM analysis_runs WHERE analysis_id = ?", (analysis_id,))
    run = cursor.fetchone()
    if not run:
        raise KeyError(f"Analysis run '{analysis_id}' not found.")

    r = dict(run)
    dataset_type = r["dataset_type"]

    csv_path = UPLOAD_DIR / f"{analysis_id}.csv"
    if not csv_path.exists():
        raise FileNotFoundError(f"Underlying CSV dataset file for '{analysis_id}' not found.")

    with open(csv_path, "rb") as f:
        file_bytes = f.read()

    encoding = detect_encoding(file_bytes)
    text = file_bytes.decode(encoding)
    delimiter = detect_delimiter(text)
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    headers = next(reader)
    original_rows = list(reader)

    out = io.StringIO()
    writer = csv.writer(out, quoting=csv.QUOTE_MINIMAL)

    if dataset_type in ["MP_CONSTITUENCY", "COMBINED"]:
        cursor.execute("""
            SELECT * FROM analysis_mp_results WHERE analysis_id = ? ORDER BY row_index ASC
        """, (analysis_id,))
        results = {row["row_index"]: dict(row) for row in cursor.fetchall()}

        enriched_headers = headers + [
            "Satark_Risk_Score",
            "Satark_Risk_Level",
            "Satark_Statistical_Score",
            "Satark_ML_Score",
            "Satark_Primary_Driver",
            "Satark_Detailed_Justification",
        ]
        writer.writerow(enriched_headers)

        for idx, row in enumerate(original_rows):
            row_idx = idx + 1
            res = results.get(row_idx, {})
            row_data = [sanitize_csv_cell(c) for c in row] + [
                sanitize_csv_cell(res.get("final_risk_score")),
                sanitize_csv_cell(res.get("final_risk_level")),
                sanitize_csv_cell(res.get("statistical_anomaly_score")),
                sanitize_csv_cell(res.get("ml_anomaly_score")),
                sanitize_csv_cell(res.get("primary_anomaly_reason")),
                sanitize_csv_cell(res.get("detailed_reason")),
            ]
            writer.writerow(row_data)

    elif dataset_type == "PROJECT":
        cursor.execute("""
            SELECT * FROM analysis_project_results WHERE analysis_id = ? ORDER BY row_index ASC
        """, (analysis_id,))
        results = {row["row_index"]: dict(row) for row in cursor.fetchall()}

        enriched_headers = headers + [
            "Satark_Risk_Score",
            "Satark_Risk_Level",
            "Satark_Cost_Outlier",
            "Satark_Tender_Splitting_Candidate",
            "Satark_Duplicate_Candidate",
            "Satark_Duplicate_Matched_ID",
            "Satark_Anomaly_Flags",
        ]
        writer.writerow(enriched_headers)

        for idx, row in enumerate(original_rows):
            row_idx = idx + 1
            res = results.get(row_idx, {})
            flags = json.loads(res.get("anomaly_flags_json") or "[]")
            row_data = [sanitize_csv_cell(c) for c in row] + [
                sanitize_csv_cell(res.get("risk_score")),
                sanitize_csv_cell(res.get("risk_level")),
                "YES" if res.get("is_cost_outlier") else "NO",
                "YES" if res.get("is_tender_split_candidate") else "NO",
                "YES" if res.get("is_duplicate_candidate") else "NO",
                sanitize_csv_cell(res.get("duplicate_matched_id")),
                sanitize_csv_cell("; ".join(flags)),
            ]
            writer.writerow(row_data)

    else:
        # Generic export
        writer.writerow(headers)
        for row in original_rows:
            writer.writerow([sanitize_csv_cell(c) for c in row])

    return out.getvalue()

