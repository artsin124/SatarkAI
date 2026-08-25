"""
Project-Level Anomaly Detection Service for SATARK AI (Phase 3).

Implements:
1. Category-Wise Cost Outlier Detection (IQR Outlier Rule)
2. Tender Splitting & Threshold Clumping Heuristic
3. Semantic Duplicate & Overlapping Work Detection (Lexical Token & N-Gram Similarity)
4. Contractor Concentration Analysis
5. Composite Project Risk Scoring & Governance Classification
"""

import json
import re
from datetime import datetime
from typing import Any, Dict, List, Optional, Set, Tuple
import numpy as np


DEFAULT_TENDER_THRESHOLD = 1000000.0  # Configurable statutory threshold (₹10 Lakhs)
SPLIT_WINDOW_DAYS = 30                # Date window for clumping


def normalize_text_for_similarity(text: str) -> str:
    """
    Normalizes project descriptions by removing boilerplate scheme prefixes,
    punctuation, numbers, and ward qualifiers for fuzzy comparison.
    """
    if not text:
        return ""
    s = text.lower().strip()
    # Remove punctuation
    s = re.sub(r"[^\w\s]", " ", s)
    # Remove boilerplate terms
    stopwords = [
        "construction of", "work of", "proposed", "provision of",
        "development of", "renovation of", "installation of",
        "building of", "facility", "scheme", "project", "under mplads",
        "phase", "ward", "street", "village", "taluka", "road", "at"
    ]
    for w in stopwords:
        s = re.sub(r"\b" + re.escape(w) + r"\b", " ", s)
    # Strip standalone numbers
    s = re.sub(r"\b\d+\b", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def compute_token_jaccard(s1: str, s2: str) -> float:
    """Computes word-token Jaccard similarity between two strings."""
    tokens1 = set(s1.split())
    tokens2 = set(s2.split())
    if not tokens1 or not tokens2:
        return 0.0
    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))
    return intersection / union if union > 0 else 0.0


def compute_ngram_similarity(s1: str, s2: str, n: int = 3) -> float:
    """Computes character n-gram Dice coefficient."""
    if len(s1) < n or len(s2) < n:
        return 1.0 if s1 == s2 and s1 != "" else 0.0
    ngrams1 = set(s1[i : i + n] for i in range(len(s1) - n + 1))
    ngrams2 = set(s2[i : i + n] for i in range(len(s2) - n + 1))
    intersection = len(ngrams1.intersection(ngrams2))
    total = len(ngrams1) + len(ngrams2)
    return (2.0 * intersection) / total if total > 0 else 0.0


def parse_date_safe(date_str: Any) -> Optional[datetime]:
    """Parses date string in common formats."""
    if not date_str or not isinstance(date_str, str):
        return None
    cleaned = date_str.strip()
    formats = ["%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%Y/%m/%d", "%d.%m.%Y", "%Y.%m.%d"]
    for fmt in formats:
        try:
            return datetime.strptime(cleaned, fmt)
        except ValueError:
            continue
    return None


def detect_cost_outliers(
    rows: List[Dict[str, Any]],
    cost_field: str = "sanctioned_cost",
    category_field: str = "category",
) -> List[int]:
    """
    Computes category-wise IQR cost outlier flags (1 if outlier, 0 otherwise).
    Outlier Rule: sanctioned_cost > Q3 + 2.0 * IQR
    """
    n = len(rows)
    outlier_flags = [0] * n

    # Group row indices and costs by category
    cat_indices: Dict[str, List[int]] = {}
    all_costs: List[float] = []

    for i, row in enumerate(rows):
        val = row.get(cost_field)
        cost = float(val) if val is not None and isinstance(val, (int, float, np.number)) else None
        if cost is not None:
            all_costs.append(cost)
            cat = str(row.get(category_field) or "General").strip().lower()
            cat_indices.setdefault(cat, []).append(i)

    if not all_costs:
        return outlier_flags

    # Global distribution for categories with < 3 items
    global_q1 = float(np.percentile(all_costs, 25))
    global_q3 = float(np.percentile(all_costs, 75))
    global_iqr = global_q3 - global_q1
    global_threshold = global_q3 + (2.0 * global_iqr) if global_iqr > 0 else global_q3 * 2.0

    for cat, idxs in cat_indices.items():
        cat_costs = [float(rows[i][cost_field]) for i in idxs if rows[i].get(cost_field) is not None]
        if len(cat_costs) >= 3:
            q1 = float(np.percentile(cat_costs, 25))
            q3 = float(np.percentile(cat_costs, 75))
            iqr = q3 - q1
            threshold = q3 + (2.0 * iqr) if iqr > 0 else (q3 * 1.8)
        else:
            threshold = global_threshold

        for i in idxs:
            val = rows[i].get(cost_field)
            if val is not None and float(val) > threshold:
                outlier_flags[i] = 1

    return outlier_flags


def detect_tender_splitting(
    rows: List[Dict[str, Any]],
    contractor_field: str = "contractor_id",
    cost_field: str = "sanctioned_cost",
    date_field: str = "sanction_date",
    threshold: float = DEFAULT_TENDER_THRESHOLD,
    window_days: int = SPLIT_WINDOW_DAYS,
) -> List[int]:
    """
    Identifies multiple projects awarded to the same contractor clustering
    just below standard audit thresholds (70% - 100% of threshold).
    """
    n = len(rows)
    split_flags = [0] * n
    lower_bound = 0.70 * threshold

    # Group indices by contractor
    contractor_groups: Dict[str, List[int]] = {}
    for i, row in enumerate(rows):
        contractor = str(row.get(contractor_field) or "").strip().lower()
        if contractor and contractor not in ["", "unknown", "none", "n/a", "departmental"]:
            contractor_groups.setdefault(contractor, []).append(i)

    for contractor, idxs in contractor_groups.items():
        candidate_idxs = []
        for i in idxs:
            cost = row_cost = rows[i].get(cost_field)
            if cost is not None:
                c_val = float(cost)
                if lower_bound <= c_val <= threshold:
                    candidate_idxs.append(i)

        if len(candidate_idxs) >= 2:
            # Check date proximity if sanction dates available
            has_dates = any(parse_date_safe(rows[i].get(date_field)) is not None for i in candidate_idxs)
            if has_dates:
                # Pairwise date comparison
                for i in candidate_idxs:
                    d1 = parse_date_safe(rows[i].get(date_field))
                    for j in candidate_idxs:
                        if i != j:
                            d2 = parse_date_safe(rows[j].get(date_field))
                            if d1 and d2 and abs((d1 - d2).days) <= window_days:
                                split_flags[i] = 1
                                split_flags[j] = 1
                            elif not d1 or not d2:
                                # Cluster flag if dates missing in batch
                                split_flags[i] = 1
            else:
                # If dates are absent, flag the cluster directly
                for i in candidate_idxs:
                    split_flags[i] = 1

    return split_flags


def detect_semantic_duplicates(
    rows: List[Dict[str, Any]],
    title_field: str = "project_title",
    id_field: str = "project_id",
    district_field: str = "district",
    similarity_threshold: float = 0.85,
) -> Tuple[List[int], List[Optional[str]]]:
    """
    Detects potential duplicate and overlapping project works using
    district-blocked lexical token and 3-gram character similarity.
    """
    n = len(rows)
    dup_flags = [0] * n
    matched_ids: List[Optional[str]] = [None] * n

    # Group by district to avoid O(n^2) across unrelated locations
    district_blocks: Dict[str, List[int]] = {}
    for i, row in enumerate(rows):
        dist = str(row.get(district_field) or "Global").strip().lower()
        district_blocks.setdefault(dist, []).append(i)

    for dist, idxs in district_blocks.items():
        m = len(idxs)
        if m < 2:
            continue

        normalized_titles = [
            normalize_text_for_similarity(str(rows[i].get(title_field) or ""))
            for i in idxs
        ]

        for a in range(m):
            t1 = normalized_titles[a]
            if len(t1) < 4:
                continue
            for b in range(a + 1, m):
                t2 = normalized_titles[b]
                if len(t2) < 4:
                    continue

                jaccard = compute_token_jaccard(t1, t2)
                ngram_sim = compute_ngram_similarity(t1, t2, n=3)
                composite_sim = (0.5 * jaccard) + (0.5 * ngram_sim)

                if composite_sim >= similarity_threshold or t1 == t2:
                    idx_a = idxs[a]
                    idx_b = idxs[b]
                    id_a = str(rows[idx_a].get(id_field) or f"ROW_{idx_a+1}")
                    id_b = str(rows[idx_b].get(id_field) or f"ROW_{idx_b+1}")

                    dup_flags[idx_a] = 1
                    dup_flags[idx_b] = 1
                    matched_ids[idx_a] = id_b
                    matched_ids[idx_b] = id_a

    return dup_flags, matched_ids


def evaluate_contractor_concentration(
    rows: List[Dict[str, Any]],
    contractor_field: str = "contractor_id",
    cost_field: str = "sanctioned_cost",
) -> List[int]:
    """
    Flags projects belonging to contractors with disproportionate workload share (>30% of total amount).
    """
    n = len(rows)
    flags = [0] * n
    contractor_totals: Dict[str, float] = {}
    dataset_total = 0.0

    for row in rows:
        contractor = str(row.get(contractor_field) or "").strip()
        val = row.get(cost_field)
        cost = float(val) if val is not None and isinstance(val, (int, float, np.number)) else 0.0
        if contractor and contractor.lower() not in ["", "unknown", "none"]:
            contractor_totals[contractor] = contractor_totals.get(contractor, 0.0) + cost
            dataset_total += cost

    if dataset_total > 0:
        high_share_contractors = {
            c for c, total in contractor_totals.items() if (total / dataset_total) >= 0.30
        }
        for i, row in enumerate(rows):
            contractor = str(row.get(contractor_field) or "").strip()
            if contractor in high_share_contractors:
                flags[i] = 1

    return flags


def calculate_project_risk_scores(
    cost_outliers: List[int],
    tender_splits: List[int],
    duplicates: List[int],
    contractor_flags: List[int],
) -> Tuple[List[float], List[str], List[List[str]]]:
    """
    Computes a deterministic project-level governance risk score (0-100),
    governance risk tier, and itemized anomaly flags list.
    """
    n = len(cost_outliers)
    scores: List[float] = []
    levels: List[str] = []
    flags_list: List[List[str]] = []

    for i in range(n):
        detected_flags: List[str] = []
        score = 15.0  # Base nominal low risk

        if cost_outliers[i]:
            score += 30.0
            detected_flags.append("Cost Outlier")
        if tender_splits[i]:
            score += 35.0
            detected_flags.append("Potential Tender Splitting")
        if duplicates[i]:
            score += 30.0
            detected_flags.append("Potential Overlapping / Duplicate Work")
        if contractor_flags[i]:
            score += 15.0
            detected_flags.append("Elevated Contractor Concentration")

        final_score = round(min(100.0, score), 2)
        if final_score >= 75.0:
            level = "CRITICAL"
        elif final_score >= 60.0:
            level = "HIGH"
        elif final_score >= 30.0:
            level = "MEDIUM"
        else:
            level = "LOW"

        scores.append(final_score)
        levels.append(level)
        flags_list.append(detected_flags)

    return scores, levels, flags_list
