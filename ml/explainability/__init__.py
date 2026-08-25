"""
Explainable AI (XAI) Package for SIH MPLADS AI
"""

from .explanation import (
    generate_explanation,
    identify_primary_reason,
    format_detailed_reason,
    REASON_LOW_UTILIZATION,
    REASON_HIGH_PENDING,
    REASON_HIGH_CANCELLATION,
    REASON_HIGH_COST,
    REASON_HIGH_DELAY,
)

__all__ = [
    "generate_explanation",
    "identify_primary_reason",
    "format_detailed_reason",
    "REASON_LOW_UTILIZATION",
    "REASON_HIGH_PENDING",
    "REASON_HIGH_CANCELLATION",
    "REASON_HIGH_COST",
    "REASON_HIGH_DELAY",
]
