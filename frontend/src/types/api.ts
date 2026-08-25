/**
 * TypeScript Interfaces for SIH MPLADS AI Backend API.
 * Matches backend/schemas/anomaly_schema.py and backend/schemas/project_schema.py.
 */

export interface AnomalyRecord {
  id: number;
  hon_ble_members_of_parliaments: string;
  constituency: string;
  utilization_mock: number;
  pending_ratio_pct: number;
  cancelled_ratio_pct: number;
  average_project_cost_mock: number;
  average_delay_days_mock: number;
  statistical_anomaly_score: number;
  ml_anomaly_score: number;
  final_risk_score: number;
  final_risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  primary_anomaly_reason: string;
  detailed_reason: string;
  previously_selected_10: boolean;
}

export interface AnomalyListResponse {
  total: number;
  data: AnomalyRecord[];
}

export interface RiskStatisticsResponse {
  total_records: number;
  low_count: number;
  medium_count: number;
  high_count: number;
  critical_count: number;
  average_risk_score: number;
  maximum_risk_score: number;
  minimum_risk_score: number;
}

export interface RiskDistributionResponse {
  LOW: number;
  MEDIUM: number;
  HIGH: number;
  CRITICAL: number;
  total: number;
}

export interface SearchResponse {
  total: number;
  query: string;
  data: AnomalyRecord[];
}

export interface ParameterBreakdown {
  utilization_anomaly_score: number;
  pending_anomaly_score: number;
  cancelled_anomaly_score: number;
  avg_cost_anomaly_score: number;
  avg_delay_anomaly_score: number;
}

export interface NewAnalysisRequest {
  hon_ble_members_of_parliaments?: string;
  constituency?: string;
  utilization_mock: number;
  pending_ratio_pct: number;
  cancelled_ratio_pct: number;
  average_project_cost_mock: number;
  average_delay_days_mock: number;
}

export interface NewAnalysisResponse {
  hon_ble_members_of_parliaments?: string;
  constituency?: string;
  statistical_anomaly_score: number;
  ml_anomaly_score: number;
  final_risk_score: number;
  final_risk_level: string;
  primary_anomaly_reason: string;
  detailed_reason: string;
  parameter_breakdown: ParameterBreakdown;
}

export interface ProjectPlaceholderResponse {
  status: string;
  message: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  related_constituencies?: string[];
}

export interface ChatRequest {
  message: string;
  history?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  reply: string;
  suggestions: string[];
  related_constituencies: string[];
}

export interface AlertItem {
  id: number;
  hon_ble_members_of_parliaments: string;
  constituency: string;
  severity: "CRITICAL" | "HIGH" | string;
  alert_title: string;
  final_risk_score: number;
  final_risk_level: string;
  primary_anomaly_reason: string;
  detailed_reason: string;
  recommendation: string;
}

export interface AlertListResponse {
  total: number;
  critical_count: number;
  high_count: number;
  data: AlertItem[];
}
