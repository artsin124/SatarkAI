/**
 * UI Adapters and Data Normalizers for SIH MPLADS AI Frontend.
 * Maps backend API data models to Figma UI component props cleanly.
 */

import type { AnomalyRecord } from "../types/api";

export function formatRupee(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatRupeeCompact(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  return `₹${formatRupee(amount)}`;
}

export function extractIndicators(record: AnomalyRecord): string[] {
  const indicators: string[] = [];
  const text = `${record.primary_anomaly_reason || ""} ${record.detailed_reason || ""}`.toLowerCase();

  if (text.includes("cost") || record.average_project_cost_mock > 8000000) {
    indicators.push("Cost Outlier");
  }
  if (text.includes("cancellation") || record.cancelled_ratio_pct > 20) {
    indicators.push("High Cancellation");
  }
  if (text.includes("pending") || record.pending_ratio_pct > 35) {
    indicators.push("High Pending Work");
  }
  if (text.includes("delay") || record.average_delay_days_mock > 100) {
    indicators.push("High Delay");
  }
  if (text.includes("utilization") || record.utilization_mock < 60) {
    indicators.push("Low Utilization");
  }

  // Fallback if none matched
  if (indicators.length === 0 && record.primary_anomaly_reason) {
    indicators.push(record.primary_anomaly_reason);
  }

  return indicators;
}

export interface RiskContributionItem {
  factor: string;
  value: number;
  detail: string;
}

export function extractContributions(record: AnomalyRecord): RiskContributionItem[] {
  return [
    {
      factor: "Cancellation Ratio",
      value: Math.min(30, Math.round((record.cancelled_ratio_pct / 50) * 28) || 5),
      detail: `${record.cancelled_ratio_pct.toFixed(1)}% cancellation`,
    },
    {
      factor: "Pending Work Ratio",
      value: Math.min(30, Math.round((record.pending_ratio_pct / 55) * 24) || 6),
      detail: `${record.pending_ratio_pct.toFixed(1)}% pending`,
    },
    {
      factor: "Avg Project Cost",
      value: Math.min(30, Math.round((record.average_project_cost_mock / 15000000) * 20) || 5),
      detail: `₹${formatRupee(record.average_project_cost_mock)} avg`,
    },
    {
      factor: "Avg Delay",
      value: Math.min(30, Math.round((record.average_delay_days_mock / 180) * 15) || 4),
      detail: `${record.average_delay_days_mock} days avg`,
    },
    {
      factor: "Utilization",
      value: Math.min(30, Math.round(((100 - record.utilization_mock) / 100) * 10) || 3),
      detail: `${record.utilization_mock.toFixed(1)}% utilization`,
    },
  ];
}

export interface RiskFlagItem {
  level: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  label: string;
  detail: string;
  icon: string;
}

export function extractFlags(record: AnomalyRecord): RiskFlagItem[] {
  const flags: RiskFlagItem[] = [];
  const clauses = (record.detailed_reason || "").split(";").map((c) => c.trim()).filter(Boolean);

  for (const clause of clauses) {
    const isCritical = clause.toLowerCase().includes("cancellation") || clause.toLowerCase().includes("pending");
    const isHigh = clause.toLowerCase().includes("cost") || clause.toLowerCase().includes("delay") || clause.toLowerCase().includes("utilization");

    flags.push({
      level: isCritical ? "CRITICAL" : isHigh ? "HIGH" : "MEDIUM",
      label: clause.split(" is ")[0] || clause,
      detail: `${clause} — flagged for administrative review.`,
      icon: isCritical ? "🔴" : "🟠",
    });
  }

  if (flags.length === 0) {
    flags.push({
      level: (record.final_risk_level as any) || "MEDIUM",
      label: record.primary_anomaly_reason || "Operational Variation",
      detail: record.detailed_reason || "Metrics observed within monitored variance limits.",
      icon: record.final_risk_level === "CRITICAL" ? "🔴" : "🟠",
    });
  }

  return flags;
}

export function generateRecommendation(record: AnomalyRecord): string {
  const reasons = [];
  if (record.cancelled_ratio_pct > 20) reasons.push("project cancellation records");
  if (record.pending_ratio_pct > 35) reasons.push("pending work backlogs and execution bottlenecks");
  if (record.average_project_cost_mock > 8000000) reasons.push("project scope sizing and expenditure justifications");
  if (record.average_delay_days_mock > 100) reasons.push("implementation delays and contractor adherence");
  if (record.utilization_mock < 60) reasons.push("fund utilization schedules");

  if (reasons.length > 0) {
    return `Review ${reasons.join(", ")}. Cross-reference sanction orders, implementing agency status, and milestone reports for flagged projects in ${record.constituency}.`;
  }
  return `Conduct routine periodic review of project implementation timelines and expenditure reports for ${record.constituency}.`;
}
