/**
 * Centralized API Client Service for SIH MPLADS AI.
 * Interfaces with the FastAPI Backend (http://127.0.0.1:8000).
 */

import type {
  AnomalyRecord,
  AnomalyListResponse,
  RiskStatisticsResponse,
  RiskDistributionResponse,
  SearchResponse,
  NewAnalysisRequest,
  NewAnalysisResponse,
  ProjectPlaceholderResponse,
  ChatRequest,
  ChatResponse,
  AlertListResponse,
} from "../types/api";

import type {
  DatasetPreviewResponse,
  ColumnMappingResponse,
  AnalysisRunListResponse,
  AnalysisStatusResponse,
} from "../types/analysis";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const isFormData = options?.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...((options?.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (!res.ok) {
      let errorDetail = res.statusText;
      try {
        const errorJson = await res.json();
        if (errorJson.detail) errorDetail = errorJson.detail;
      } catch {}
      throw new Error(errorDetail || `API Error [${res.status}]`);
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`Failed to fetch from ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  /** Health check */
  getHealth: () => fetchJson<{ message: string; status: string }>("/"),

  /** Aggregate Statistics */
  getStatistics: () => fetchJson<RiskStatisticsResponse>("/api/statistics"),

  /** Risk Tier Distribution */
  getRiskDistribution: () => fetchJson<RiskDistributionResponse>("/api/risk-distribution"),

  /** Top N Anomaly Records */
  getTopAnomalies: (limit: number = 5) =>
    fetchJson<AnomalyListResponse>(`/api/top-anomalies?limit=${limit}`),

  /** All Anomaly Records (sorted by final_risk_score DESC) */
  getAllAnomalies: () => fetchJson<AnomalyListResponse>("/api/anomalies"),
  getAnomalies: () => fetchJson<AnomalyListResponse>("/api/anomalies"),

  /** Critical Anomaly Records */
  getCriticalAnomalies: () => fetchJson<AnomalyListResponse>("/api/anomalies/critical"),

  /** High & Critical Anomaly Records */
  getHighAnomalies: () => fetchJson<AnomalyListResponse>("/api/anomalies/high"),

  /** Single Anomaly Record by ID */
  getAnomalyById: (id: number) => fetchJson<AnomalyRecord>(`/api/anomalies/${id}`),
  getAnomalyDetails: (id: number) => fetchJson<AnomalyRecord>(`/api/anomalies/${id}`),

  /** Search by MP or Constituency */
  searchAnomalies: (query: string) =>
    fetchJson<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`),
  searchRecords: (query: string) =>
    fetchJson<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`),

  /** Dynamic Alerts & Early Warnings */
  getAlerts: (severity?: string) =>
    fetchJson<AlertListResponse>(severity ? `/api/alerts?severity=${encodeURIComponent(severity)}` : "/api/alerts"),

  /** On-Demand Record Evaluation */
  analyzeRecord: (payload: NewAnalysisRequest) =>
    fetchJson<NewAnalysisResponse>("/api/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /** Project Analysis Status */
  getProjectsStatus: () => fetchJson<ProjectPlaceholderResponse>("/api/projects"),

  /** AI Governance Assistant Natural Language Query */
  sendChatMessage: (message: string, history?: Array<{ role: string; content: string }>) =>
    fetchJson<ChatResponse>("/api/assistant", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  // ============================================================================
  // SMART CSV ANALYSIS APIS (Phase 1 & 2)
  // ============================================================================

  /** Upload CSV file for validation, preview & smart column mapping */
  uploadCSV: (file: File): Promise<DatasetPreviewResponse> => {
    const formData = new FormData();
    formData.append("file", file);
    return fetchJson<DatasetPreviewResponse>("/api/upload", {
      method: "POST",
      body: formData,
    });
  },

  /** Get dataset preview and detected column schema */
  getUploadPreview: (analysisId: string): Promise<DatasetPreviewResponse> =>
    fetchJson<DatasetPreviewResponse>(`/api/upload/${encodeURIComponent(analysisId)}/preview`),

  /** Submit confirmed or modified column mappings */
  submitColumnMapping: (
    analysisId: string,
    mappings: Record<string, string | null>
  ): Promise<ColumnMappingResponse> =>
    fetchJson<ColumnMappingResponse>(`/api/upload/${encodeURIComponent(analysisId)}/mapping`, {
      method: "POST",
      body: JSON.stringify({ mappings }),
    }),

  /** Get analysis run status */
  getAnalysisStatus: (analysisId: string): Promise<AnalysisStatusResponse> =>
    fetchJson<AnalysisStatusResponse>(`/api/upload/${encodeURIComponent(analysisId)}/status`),

  /** List all historical analysis runs */
  getAnalyses: (): Promise<AnalysisRunListResponse> =>
    fetchJson<AnalysisRunListResponse>("/api/analyses"),
};

export default api;

