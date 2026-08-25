-- SIH MPLADS AI Anomaly Detection Database Schema
-- Database: data/output/mplads.db

CREATE TABLE IF NOT EXISTS anomaly_results (
    hon_ble_members_of_parliaments TEXT,
    constituency TEXT,
    utilization_mock REAL,
    pending_ratio_pct REAL,
    cancelled_ratio_pct REAL,
    average_project_cost_mock INTEGER,
    average_delay_days_mock INTEGER,
    statistical_anomaly_score REAL,
    ml_anomaly_score REAL,
    final_risk_score REAL,
    final_risk_level TEXT,
    primary_anomaly_reason TEXT,
    detailed_reason TEXT,
    previously_selected_10 INTEGER
);

-- Index recommendations for fast retrieval and filtering
CREATE INDEX IF NOT EXISTS idx_anomaly_final_risk ON anomaly_results (final_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_risk_level ON anomaly_results (final_risk_level);
CREATE INDEX IF NOT EXISTS idx_anomaly_mp ON anomaly_results (hon_ble_members_of_parliaments);
CREATE INDEX IF NOT EXISTS idx_anomaly_constituency ON anomaly_results (constituency);

-- ============================================================================
-- SMART CSV ANALYSIS RUN STORAGE (Phase 1 & 2)
-- Isolated dataset partitions identified by unique analysis_id
-- ============================================================================

CREATE TABLE IF NOT EXISTS analysis_runs (
    analysis_id TEXT PRIMARY KEY,
    file_name TEXT NOT NULL,
    dataset_type TEXT NOT NULL,
    total_rows INTEGER NOT NULL,
    valid_rows INTEGER NOT NULL,
    status TEXT NOT NULL,
    column_mapping_json TEXT NOT NULL,
    modules_applied_json TEXT NOT NULL,
    summary_metrics_json TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_runs_created ON analysis_runs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_status ON analysis_runs (status);

CREATE TABLE IF NOT EXISTS analysis_mp_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT NOT NULL,
    row_index INTEGER NOT NULL,
    mp_name TEXT,
    constituency TEXT,
    utilization REAL,
    pending_ratio REAL,
    cancelled_ratio REAL,
    avg_project_cost REAL,
    avg_delay_days REAL,
    statistical_anomaly_score REAL,
    ml_anomaly_score REAL,
    final_risk_score REAL,
    final_risk_level TEXT,
    primary_anomaly_reason TEXT,
    detailed_reason TEXT,
    is_valid INTEGER DEFAULT 1,
    FOREIGN KEY (analysis_id) REFERENCES analysis_runs(analysis_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mp_run_id ON analysis_mp_results (analysis_id);
CREATE INDEX IF NOT EXISTS idx_mp_risk_score ON analysis_mp_results (analysis_id, final_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_mp_risk_level ON analysis_mp_results (analysis_id, final_risk_level);

CREATE TABLE IF NOT EXISTS analysis_project_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id TEXT NOT NULL,
    row_index INTEGER NOT NULL,
    project_id TEXT,
    project_title TEXT,
    category TEXT,
    district TEXT,
    sanctioned_cost REAL,
    expenditure REAL,
    contractor_name TEXT,
    is_cost_outlier INTEGER DEFAULT 0,
    is_tender_split_candidate INTEGER DEFAULT 0,
    is_duplicate_candidate INTEGER DEFAULT 0,
    duplicate_matched_id TEXT,
    risk_score REAL,
    risk_level TEXT,
    anomaly_flags_json TEXT,
    FOREIGN KEY (analysis_id) REFERENCES analysis_runs(analysis_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_project_run_id ON analysis_project_results (analysis_id);
CREATE INDEX IF NOT EXISTS idx_project_risk_score ON analysis_project_results (analysis_id, risk_score DESC);

