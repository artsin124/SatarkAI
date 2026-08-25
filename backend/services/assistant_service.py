"""
AI Assistant Service for SIH MPLADS AI Governance Risk System.

Provides data-grounded natural language question answering querying the real SQLite database
without external LLM dependencies, ensuring zero hallucination, strict factual grounding,
and ethical governance language.
"""

import re
import sqlite3
from typing import Any, Dict, List, Optional, Tuple

from backend.database.connection import get_connection
from backend.schemas.assistant_schema import ChatRequest, ChatResponse

DISCLAIMER = (
    "\n\n> **Governance Note:** These results are AI-assisted risk indicators "
    "and should be verified by authorized administrative officials."
)


def _format_rupee(amount: int | float) -> str:
    """Formats numeric values in Indian numbering style."""
    try:
        return f"₹{int(amount):,}"
    except Exception:
        return f"₹{amount}"


def _extract_limit(query: str, default: int = 5, max_limit: int = 20) -> int:
    """Extracts requested record count (e.g. 'top 10', 'first 3') from user prompt."""
    match = re.search(r"\b(top|first|show|list)\s+(\d+)\b", query, re.IGNORECASE)
    if match:
        try:
            val = int(match.group(2))
            return max(1, min(max_limit, val))
        except ValueError:
            pass
    # Check standalone number if asking 'top 5'
    num_match = re.search(r"\b(\d+)\b", query)
    if num_match:
        try:
            val = int(num_match.group(1))
            if 1 <= val <= max_limit:
                return val
        except ValueError:
            pass
    return default


def process_chat_query(request: ChatRequest, conn: Optional[sqlite3.Connection] = None) -> ChatResponse:
    """
    Analyzes user query, matches governance data intent, queries SQLite, and formats grounded markdown response.
    """
    raw_query = request.message.strip()
    q = raw_query.lower()

    should_close = False
    if conn is None:
        conn = get_connection()
        should_close = True

    try:
        cursor = conn.cursor()

        # ----------------------------------------------------
        # 1. Total Records Intent
        # ----------------------------------------------------
        if any(kw in q for kw in [
            "how many records", "total records", "number of records",
            "how many constituencies", "total constituencies", "dataset size",
            "how many mps", "how many rows"
        ]):
            cursor.execute("SELECT COUNT(*) FROM anomaly_results")
            count = cursor.fetchone()[0]
            reply = (
                f"The system has analyzed a total of **{count} parliamentary constituency records** "
                f"across India in the current MPLADS governance dataset."
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Show the risk distribution",
                    "How many critical records are there?",
                    "Show the top 5 highest risk constituencies",
                ],
                related_constituencies=[],
            )

        # ----------------------------------------------------
        # 2. Risk Distribution & Specific Counts (Critical, High, etc.)
        # ----------------------------------------------------
        if "critical" in q and any(kw in q for kw in ["how many", "count", "number of", "total"]):
            cursor.execute("SELECT COUNT(*) FROM anomaly_results WHERE final_risk_level = 'CRITICAL'")
            crit_count = cursor.fetchone()[0]
            cursor.execute("""
                SELECT hon_ble_members_of_parliaments, constituency, final_risk_score 
                FROM anomaly_results WHERE final_risk_level = 'CRITICAL' 
                ORDER BY final_risk_score DESC
            """)
            rows = cursor.fetchall()
            list_str = "\n".join([f"- **{r[0]}** ({r[1]}): Risk Score **{r[2]:.2f}**" for r in rows])
            reply = (
                f"There are **{crit_count} constituencies** categorized under the **CRITICAL** risk tier (Risk Score $\\ge 75.0$):\n\n"
                f"{list_str}{DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Why is YAVATMAL-WASHIM critical?",
                    "How many high risk records are there?",
                    "Show the full risk distribution",
                ],
                related_constituencies=[r[1] for r in rows],
            )

        if "high" in q and any(kw in q for kw in ["how many", "count", "number of", "total"]):
            cursor.execute("SELECT COUNT(*) FROM anomaly_results WHERE final_risk_level = 'HIGH'")
            high_count = cursor.fetchone()[0]
            reply = (
                f"There are **{high_count} constituencies** categorized under the **HIGH** risk tier "
                f"(Risk Score between 60.0 and 74.99) requiring priority administrative review.{DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Show the top 5 highest risk constituencies",
                    "How many critical records are there?",
                    "Show risk distribution",
                ],
                related_constituencies=[],
            )

        if any(kw in q for kw in ["risk distribution", "distribution of risk", "breakdown of risk", "how many in each", "risk breakdown"]):
            cursor.execute("""
                SELECT
                    SUM(CASE WHEN final_risk_level = 'LOW' THEN 1 ELSE 0 END) AS low_c,
                    SUM(CASE WHEN final_risk_level = 'MEDIUM' THEN 1 ELSE 0 END) AS med_c,
                    SUM(CASE WHEN final_risk_level = 'HIGH' THEN 1 ELSE 0 END) AS high_c,
                    SUM(CASE WHEN final_risk_level = 'CRITICAL' THEN 1 ELSE 0 END) AS crit_c,
                    COUNT(*) AS total_c
                FROM anomaly_results
            """)
            r = cursor.fetchone()
            reply = (
                f"### MPLADS Governance Risk Distribution ({r['total_c']} Constituencies)\n\n"
                f"- 🟢 **LOW Risk** (0 – 29.99): **{r['low_c']}** constituencies (Normal operational parameters)\n"
                f"- 🟡 **MEDIUM Risk** (30 – 59.99): **{r['med_c']}** constituencies (Standard periodic monitoring)\n"
                f"- 🟠 **HIGH Risk** (60 – 74.99): **{r['high_c']}** constituencies (Requires administrative review)\n"
                f"- 🔴 **CRITICAL Risk** (75 – 100): **{r['crit_c']}** constituencies (Top-priority audit review){DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Show the top 5 highest risk constituencies",
                    "Which constituency has the highest cancellation ratio?",
                    "What is the average risk score?",
                ],
                related_constituencies=[],
            )

        # ----------------------------------------------------
        # 3. Average Risk Score Intent
        # ----------------------------------------------------
        if any(kw in q for kw in ["average risk", "average score", "avg risk", "mean risk"]):
            cursor.execute("SELECT AVG(final_risk_score), MIN(final_risk_score), MAX(final_risk_score) FROM anomaly_results")
            avg_s, min_s, max_s = cursor.fetchone()
            reply = (
                f"The national dataset statistics across 544 constituencies are:\n\n"
                f"- **Average Risk Score:** **{avg_s:.2f} / 100**\n"
                f"- **Lowest Risk Score:** **{min_s:.2f}**\n"
                f"- **Highest Risk Score:** **{max_s:.2f}** (YAVATMAL-WASHIM)"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Show the top 5 highest risk constituencies",
                    "Why is YAVATMAL-WASHIM critical?",
                    "Show risk distribution",
                ],
                related_constituencies=["YAVATMAL-WASHIM"],
            )

        # ----------------------------------------------------
        # 4. "Why was X flagged?" / Explainability Intent
        # ----------------------------------------------------
        if any(kw in q for kw in ["why is", "why was", "explain the risk", "explain why", "why flagged", "reasons for"]):
            # Search for constituency or MP mentioned in query
            cursor.execute("""
                SELECT rowid AS id, * FROM anomaly_results
            """)
            all_records = cursor.fetchall()
            target_record = None
            for rec in all_records:
                c_name = rec["constituency"].lower()
                m_name = rec["hon_ble_members_of_parliaments"].lower()
                # Check for match in query
                if c_name in q or any(part in q for part in c_name.split("-") if len(part) > 3) or m_name in q or any(part in q for part in m_name.split() if len(part) > 4):
                    target_record = rec
                    break

            if target_record:
                r = target_record
                reply = (
                    f"### Risk Explanation: **{r['hon_ble_members_of_parliaments']}** ({r['constituency']})\n\n"
                    f"- **Assigned Risk Tier:** **{r['final_risk_level']}** (Risk Score: **{r['final_risk_score']:.2f} / 100**)\n"
                    f"- **Statistical Score:** **{r['statistical_anomaly_score']:.2f}** (60% weight)\n"
                    f"- **ML Anomaly Score:** **{r['ml_anomaly_score']:.2f}** (40% weight)\n"
                    f"- **Primary Anomaly Driver:** **{r['primary_anomaly_reason']}**\n\n"
                    f"#### Detected Risk Indicators:\n"
                    f"{r['detailed_reason']}\n\n"
                    f"#### Key Operational Metrics:\n"
                    f"- **Fund Utilization:** {r['utilization_mock']:.1f}%\n"
                    f"- **Pending Work Ratio:** {r['pending_ratio_pct']:.1f}%\n"
                    f"- **Cancellation Ratio:** {r['cancelled_ratio_pct']:.1f}%\n"
                    f"- **Average Project Cost:** {_format_rupee(r['average_project_cost_mock'])}\n"
                    f"- **Average Completion Delay:** {r['average_delay_days_mock']} days"
                    f"{DISCLAIMER}"
                )
                return ChatResponse(
                    reply=reply,
                    suggestions=[
                        "Show the top 5 highest risk constituencies",
                        "Which constituency has the highest cancellation ratio?",
                        "Show risk distribution",
                    ],
                    related_constituencies=[r["constituency"]],
                )

        # ----------------------------------------------------
        # 5. Parameter Rankings: Cancellation, Pending, Utilization, Delay, Cost
        # ----------------------------------------------------
        if any(kw in q for kw in ["cancellation", "cancelled"]):
            limit = _extract_limit(q, default=5)
            cursor.execute(f"""
                SELECT hon_ble_members_of_parliaments, constituency, cancelled_ratio_pct, final_risk_score, final_risk_level
                FROM anomaly_results
                ORDER BY cancelled_ratio_pct DESC, final_risk_score DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            list_str = "\n".join([
                f"{i+1}. **{r[0]}** ({r[1]}) — Cancellation Ratio: **{r[2]:.1f}%** | Risk Score: **{r[3]:.2f}** [{r[4]}]"
                for i, r in enumerate(rows)
            ])
            reply = (
                f"### Top {limit} Constituencies with Highest Cancellation Ratios:\n\n"
                f"{list_str}\n\n"
                f"A high cancellation ratio indicates potential project planning disruptions, unexecuted approvals, or procurement issues.{DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Why is YAVATMAL-WASHIM critical?",
                    "Which constituencies have the highest pending work?",
                    "Show the top 5 highest risk constituencies",
                ],
                related_constituencies=[r[1] for r in rows],
            )

        if any(kw in q for kw in ["pending work", "pending ratio", "highest pending", "most pending"]):
            limit = _extract_limit(q, default=5)
            cursor.execute(f"""
                SELECT hon_ble_members_of_parliaments, constituency, pending_ratio_pct, final_risk_score, final_risk_level
                FROM anomaly_results
                ORDER BY pending_ratio_pct DESC, final_risk_score DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            list_str = "\n".join([
                f"{i+1}. **{r[0]}** ({r[1]}) — Pending Ratio: **{r[2]:.1f}%** | Risk Score: **{r[3]:.2f}** [{r[4]}]"
                for i, r in enumerate(rows)
            ])
            reply = (
                f"### Top {limit} Constituencies with Highest Pending-Work Ratios:\n\n"
                f"{list_str}\n\n"
                f"A high pending-work ratio signals potential execution bottlenecks, delayed contractor delivery, or incomplete milestones.{DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Which constituency has the highest delay?",
                    "Show the top 5 highest risk constituencies",
                    "Show risk distribution",
                ],
                related_constituencies=[r[1] for r in rows],
            )

        if any(kw in q for kw in ["lowest utilization", "low utilization", "least utilization", "utilization"]):
            limit = _extract_limit(q, default=5)
            cursor.execute(f"""
                SELECT hon_ble_members_of_parliaments, constituency, utilization_mock, final_risk_score, final_risk_level
                FROM anomaly_results
                ORDER BY utilization_mock ASC, final_risk_score DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            list_str = "\n".join([
                f"{i+1}. **{r[0]}** ({r[1]}) — Utilization: **{r[2]:.1f}%** | Risk Score: **{r[3]:.2f}** [{r[4]}]"
                for i, r in enumerate(rows)
            ])
            reply = (
                f"### Top {limit} Constituencies with Lowest Fund Utilization:\n\n"
                f"{list_str}\n\n"
                f"Low fund utilization indicates unspent allocations and delayed project initiation.{DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Show the top 5 highest risk constituencies",
                    "Which constituency has the highest cancellation ratio?",
                    "Show risk distribution",
                ],
                related_constituencies=[r[1] for r in rows],
            )

        if any(kw in q for kw in ["highest delay", "most delayed", "delay", "delays"]):
            limit = _extract_limit(q, default=5)
            cursor.execute(f"""
                SELECT hon_ble_members_of_parliaments, constituency, average_delay_days_mock, final_risk_score, final_risk_level
                FROM anomaly_results
                ORDER BY average_delay_days_mock DESC, final_risk_score DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            list_str = "\n".join([
                f"{i+1}. **{r[0]}** ({r[1]}) — Avg Delay: **{r[2]} days** | Risk Score: **{r[3]:.2f}** [{r[4]}]"
                for i, r in enumerate(rows)
            ])
            reply = (
                f"### Top {limit} Constituencies with Highest Average Project Delays:\n\n"
                f"{list_str}\n\n"
                f"Severe delays indicate chronic timeline slippages that require administrative inspection.{DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Show the top 5 highest risk constituencies",
                    "Which constituency has the highest pending work?",
                    "Show risk distribution",
                ],
                related_constituencies=[r[1] for r in rows],
            )

        if any(kw in q for kw in ["highest cost", "average project cost", "expensive", "average cost", "highest average cost"]):
            limit = _extract_limit(q, default=5)
            cursor.execute(f"""
                SELECT hon_ble_members_of_parliaments, constituency, average_project_cost_mock, final_risk_score, final_risk_level
                FROM anomaly_results
                ORDER BY average_project_cost_mock DESC, final_risk_score DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            list_str = "\n".join([
                f"{i+1}. **{r[0]}** ({r[1]}) — Avg Project Cost: **{_format_rupee(r[2])}** | Risk Score: **{r[3]:.2f}** [{r[4]}]"
                for i, r in enumerate(rows)
            ])
            reply = (
                f"### Top {limit} Constituencies with Highest Average Project Cost:\n\n"
                f"{list_str}\n\n"
                f"Statistically atypical project costs are evaluated through log-transformed Isolation Forest to detect potential expenditure anomalies.{DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    "Why is YAVATMAL-WASHIM critical?",
                    "Show the top 5 highest risk constituencies",
                    "Show risk distribution",
                ],
                related_constituencies=[r[1] for r in rows],
            )

        # ----------------------------------------------------
        # 6. Top Risk / Highest Anomaly Constituencies Intent
        # ----------------------------------------------------
        if any(kw in q for kw in ["top", "highest risk", "most risky", "critical constituencies", "highest anomalies", "top risk", "riskiest"]):
            limit = _extract_limit(q, default=5)
            cursor.execute(f"""
                SELECT hon_ble_members_of_parliaments, constituency, final_risk_score, final_risk_level, primary_anomaly_reason
                FROM anomaly_results
                ORDER BY final_risk_score DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            list_str = "\n".join([
                f"{i+1}. **{r[0]}** ({r[1]})\n"
                f"   - **Risk Score:** **{r[2]:.2f}** [{r[3]}]\n"
                f"   - **Primary Driver:** {r[4]}"
                for i, r in enumerate(rows)
            ])
            reply = (
                f"### Top {limit} Highest-Risk Constituencies (Governance Prioritization):\n\n"
                f"{list_str}{DISCLAIMER}"
            )
            return ChatResponse(
                reply=reply,
                suggestions=[
                    f"Why is {rows[0][1]} critical?",
                    "Which constituency has the highest cancellation ratio?",
                    "Show risk distribution",
                ],
                related_constituencies=[r[1] for r in rows],
            )

        # ----------------------------------------------------
        # 7. Direct MP / Constituency Entity Lookup
        # ----------------------------------------------------
        # Try direct search on MP or Constituency
        # Strip common prefixes like 'tell me about', 'show', 'who is', 'what is'
        cleaned_search = re.sub(
            r"\b(tell me about|what is the risk of|show me|show|who is|what is|search|about|details for|record for)\b",
            "",
            raw_query,
            flags=re.IGNORECASE,
        ).strip(" ?.,!:\t\n")

        if len(cleaned_search) >= 3:
            pattern = f"%{cleaned_search}%"
            cursor.execute("""
                SELECT rowid AS id, *
                FROM anomaly_results
                WHERE hon_ble_members_of_parliaments LIKE ? OR constituency LIKE ?
                ORDER BY final_risk_score DESC
                LIMIT 3
            """, (pattern, pattern))
            matches = cursor.fetchall()

            if matches:
                r = matches[0]
                reply = (
                    f"### Governance Profile: **{r['hon_ble_members_of_parliaments']}** ({r['constituency']})\n\n"
                    f"- **Risk Score:** **{r['final_risk_score']:.2f} / 100**\n"
                    f"- **Risk Level Tier:** **{r['final_risk_level']}**\n"
                    f"- **Primary Anomaly Reason:** {r['primary_anomaly_reason']}\n"
                    f"- **Detailed Indicators:** {r['detailed_reason']}\n\n"
                    f"**Operational Parameters:**\n"
                    f"- **Fund Utilization:** {r['utilization_mock']:.1f}%\n"
                    f"- **Pending Work Ratio:** {r['pending_ratio_pct']:.1f}%\n"
                    f"- **Cancellation Ratio:** {r['cancelled_ratio_pct']:.1f}%\n"
                    f"- **Average Project Cost:** {_format_rupee(r['average_project_cost_mock'])}\n"
                    f"- **Average Delay:** {r['average_delay_days_mock']} days"
                    f"{DISCLAIMER}"
                )
                return ChatResponse(
                    reply=reply,
                    suggestions=[
                        f"Why was {r['constituency']} flagged?",
                        "Show the top 5 highest risk constituencies",
                        "Show risk distribution",
                    ],
                    related_constituencies=[r["constituency"]],
                )

        # ----------------------------------------------------
        # 8. General Help / Fallback Response
        # ----------------------------------------------------
        reply = (
            "I can assist you with governance intelligence and risk inquiries across the 544 MPLADS parliamentary constituencies. "
            "I can currently answer questions about:\n\n"
            "- **Risk Tiers & Distribution** (Critical, High, Medium, Low counts)\n"
            "- **Highest Risk Constituencies** (Top anomalies, highest scores)\n"
            "- **Specific MP & Constituency Lookups** (e.g. *Sanjay Uttamrao Deshmukh*, *VIZIANAGARAM*)\n"
            "- **Root Cause Explanations** (Why a record was flagged)\n"
            "- **Parameter Rankings** (Highest cancellation, highest pending work, lowest utilization, delays, project costs)\n\n"
            "> **Tip:** Try one of the suggested prompts below or ask about any specific MP or constituency."
        )
        return ChatResponse(
            reply=reply,
            suggestions=[
                "How many records are there?",
                "How many critical records are there?",
                "Show the top 5 highest risk constituencies",
                "Why is YAVATMAL-WASHIM critical?",
                "Which constituency has the highest cancellation ratio?",
            ],
            related_constituencies=[],
        )

    finally:
        if should_close:
            conn.close()
