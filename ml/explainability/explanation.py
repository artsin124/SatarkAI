"""
Explainable AI (XAI) Generation for SIH MPLADS AI Anomaly Detection.

Produces interpretable, evidence-based explanations for anomaly predictions
based exclusively on empirical parameter metrics and anomaly signal strengths.
"""

from typing import Dict, List, Optional, Tuple, Union

# Standard primary anomaly reason constants
REASON_LOW_UTILIZATION = "Low utilization"
REASON_HIGH_PENDING = "High pending-work ratio"
REASON_HIGH_CANCELLATION = "High cancellation ratio"
REASON_HIGH_COST = "High average project cost"
REASON_HIGH_DELAY = "High average delay"

# Default signal threshold above which a parameter is considered an elevated risk factor
SIGNAL_THRESHOLD = 70.0


def identify_primary_reason(parameter_scores: Dict[str, float]) -> str:
    """
    Identifies the single highest risk driver from the parameter anomaly scores.
    """
    mapping = [
        ("cancelled_anomaly_score", REASON_HIGH_CANCELLATION),
        ("pending_anomaly_score", REASON_HIGH_PENDING),
        ("utilization_anomaly_score", REASON_LOW_UTILIZATION),
        ("avg_cost_anomaly_score", REASON_HIGH_COST),
        ("avg_delay_anomaly_score", REASON_HIGH_DELAY),
    ]

    # Find the parameter with the maximum score
    best_reason = REASON_LOW_UTILIZATION
    max_score = -1.0

    for score_key, reason_name in mapping:
        score = parameter_scores.get(score_key, 0.0)
        if score > max_score:
            max_score = score
            best_reason = reason_name

    return best_reason


def format_detailed_reason(
    raw_data: Dict[str, Union[int, float]],
    parameter_scores: Dict[str, float],
    threshold: float = SIGNAL_THRESHOLD,
) -> str:
    """
    Constructs a detailed breakdown of all metrics contributing elevated risk signals.
    Only includes factors exceeding the signal threshold to keep reasons concise and actionable.
    """
    clauses: List[str] = []

    # 1. Low utilization
    if parameter_scores.get("utilization_anomaly_score", 0.0) >= threshold:
        u_val = raw_data.get("utilization_mock", 0.0)
        clauses.append(f"Utilization is {u_val:.1f}%")

    # 2. High pending ratio
    if parameter_scores.get("pending_anomaly_score", 0.0) >= threshold:
        p_val = raw_data.get("pending_ratio_pct", 0.0)
        clauses.append(f"Pending work ratio is {p_val:.1f}%")

    # 3. High cancellation ratio
    if parameter_scores.get("cancelled_anomaly_score", 0.0) >= threshold:
        c_val = raw_data.get("cancelled_ratio_pct", 0.0)
        clauses.append(f"Cancellation ratio is {c_val:.1f}%")

    # 4. High project cost
    if parameter_scores.get("avg_cost_anomaly_score", 0.0) >= threshold:
        cost_val = int(raw_data.get("average_project_cost_mock", 0))
        clauses.append(f"Average project cost is ₹{cost_val:,}")

    # 5. High delay
    if parameter_scores.get("avg_delay_anomaly_score", 0.0) >= threshold:
        delay_val = int(raw_data.get("average_delay_days_mock", 0))
        clauses.append(f"Average delay is {delay_val} days")

    if not clauses:
        # If no individual parameter crosses the high threshold, summarize the highest parameter
        primary = identify_primary_reason(parameter_scores)
        return f"Operational variation observed primarily driven by: {primary.lower()}"

    return "; ".join(clauses)


def generate_explanation(
    raw_data: Dict[str, Union[int, float]],
    parameter_scores: Dict[str, float],
) -> Tuple[str, str]:
    """
    Generates both primary_anomaly_reason and detailed_reason for a given record.
    
    Returns:
        tuple (primary_anomaly_reason: str, detailed_reason: str)
    """
    primary = identify_primary_reason(parameter_scores)
    detailed = format_detailed_reason(raw_data, parameter_scores)
    return primary, detailed
