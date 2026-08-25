/**
 * TypeScript Interfaces for Smart CSV Analysis (Phase 1 & 2)
 */

export interface ColumnMappingItem {
  uploaded_column: string;
  canonical_field: string | null;
  confidence: number;
  confidence_tier: "HIGH" | "MEDIUM" | "LOW" | "UNMAPPED";
  data_type: "numeric" | "text" | "date" | "unknown";
  sample_values: string[];
  non_empty_count: number;
  null_count: number;
}

export interface ModuleEligibilityItem {
  module_id: string;
  module_name: string;
  target_type: "MP_CONSTITUENCY" | "PROJECT";
  is_available: boolean;
  status: "AVAILABLE" | "PARTIALLY_AVAILABLE" | "UNAVAILABLE";
  required_fields: string[];
  missing_fields: string[];
  description: string;
  status_reason: string | null;
}

export interface DatasetPreviewResponse {
  analysis_id: string;
  file_name: string;
  file_size_bytes: number;
  total_rows: number;
  headers: string[];
  preview_rows: Record<string, any>[];
  dataset_type: "MP_CONSTITUENCY" | "PROJECT" | "COMBINED" | "UNKNOWN";
  dataset_type_label: string;
  column_mappings: ColumnMappingItem[];
  module_eligibility: ModuleEligibilityItem[];
  created_at: string;
}

export interface ColumnMappingRequest {
  mappings: Record<string, string | null>;
}

export interface ColumnMappingResponse {
  analysis_id: string;
  dataset_type: "MP_CONSTITUENCY" | "PROJECT" | "COMBINED" | "UNKNOWN";
  dataset_type_label: string;
  column_mappings: ColumnMappingItem[];
  module_eligibility: ModuleEligibilityItem[];
  ready_for_analysis: boolean;
  message: string;
}

export interface AnalysisRunItem {
  analysis_id: string;
  file_name: string;
  dataset_type: string;
  total_rows: number;
  valid_rows: number;
  status: "UPLOADED" | "MAPPED" | "RUNNING" | "COMPLETED" | "FAILED";
  column_mapping: Record<string, any>;
  modules_applied: string[];
  summary_metrics?: Record<string, any> | null;
  created_at: string;
}

export interface AnalysisRunListResponse {
  total: number;
  data: AnalysisRunItem[];
}

export interface AnalysisStatusResponse {
  analysis_id: string;
  status: string;
  dataset_type: string;
  total_rows: number;
  valid_rows: number;
  modules_applied: string[];
  created_at: string;
  message: string;
}
