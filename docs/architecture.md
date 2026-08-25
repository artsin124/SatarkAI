# SIH MPLADS AI — System Architecture

## Overview
The **SIH MPLADS AI** system is an AI-powered governance decision-support and risk-prioritization system designed to assist public oversight bodies, administrative auditors, and ministry officials in identifying potentially unusual patterns and elevated operational risks in the execution of the Members of Parliament Local Area Development Scheme (MPLADS).

The system operates strictly as a **Risk-Prioritization Decision Support Tool** and **does not declare fraud**.

```mermaid
flowchart TD
    A[Raw MPLADS Datasets] --> B[Data Cleaning & Standardization]
    B --> C[Feature Engineering & Log Transform]
    C --> D[Statistical Anomaly Scoring (0-100)]
    C --> E[Isolation Forest V2 Model]
    E --> F[ML Anomaly Scoring (0-100)]
    D --> G[Hybrid Risk Fusion Engine (60% Stat + 40% ML)]
    F --> G
    G --> H[Risk Level Classification: LOW / MEDIUM / HIGH / CRITICAL]
    G --> I[Explainable AI (XAI) Engine]
    H --> J[(SQLite Database: mplads.db)]
    I --> J
    J --> K[FastAPI Backend Services]
    K --> L[REST API & OpenAPI / Swagger Docs]
    K --> M[Future Frontend Dashboard]
```

---

## Architecture Pipeline Stages

### 1. Raw Data Ingestion
- Ingests raw constituency-level MPLADS financial allocations, expenditure, works sanctioned, works completed, pending works, cancellations, and project timelines.

### 2. Cleaning & Standardization (`data/processed/sih_cleaned_data.csv`)
- Standardizes constituency and MP nomenclature across Indian states.
- Imputes missing operational values.
- Validates numerical limits and consistency across financial years.

### 3. Feature Engineering (`data/processed/sih_ml_features.csv`)
- Distills records into 5 core governance parameters:
  1. `utilization_mock`: Fund utilization percentage.
  2. `pending_ratio_pct`: Percentage of sanctioned works remaining pending.
  3. `cancelled_ratio_pct`: Percentage of sanctioned works cancelled.
  4. `average_project_cost_mock`: Mean cost per sanctioned project.
  5. `average_delay_days_mock`: Average completion delay in days.
- Applies log-transformation on project cost (`average_project_cost_log = log1p(average_project_cost_mock)`) to handle extreme positive skewness.

### 4. Dual Anomaly Scoring
- **Statistical Anomaly Score (0–100)**: Parameter-level empirical percentile ranking across historical distributions.
- **Machine Learning Anomaly Score (0–100)**: Trained Unsupervised Isolation Forest (300 estimators, 0.10 contamination) decision function inverted and scaled to 0–100.

### 5. Hybrid Risk Fusion Engine
- Computes calibrated final risk score:
  $$\text{Final Risk Score} = 0.60 \times \text{Statistical Score} + 0.40 \times \text{ML Score}$$
- Classifies risk into tiers:
  - `0.00 – 29.99` ➔ `LOW`
  - `30.00 – 59.99` ➔ `MEDIUM`
  - `60.00 – 74.99` ➔ `HIGH`
  - `75.00 – 100.00` ➔ `CRITICAL`

### 6. Explainable AI (XAI) Generation
- Generates evidence-based rationales (`primary_anomaly_reason` and `detailed_reason`) attributing risk to specific out-of-boundary parameters.

### 7. Storage Layer (`data/output/mplads.db`)
- Persists all analyzed records in SQLite table `anomaly_results`.
- Indexed by `final_risk_score`, `final_risk_level`, MP name, and constituency.

### 8. Backend API Layer (`backend/`)
- High-performance asynchronous FastAPI service.
- Exposes structured REST endpoints for anomaly retrieval, risk distribution, aggregate statistics, parameterized search, and on-demand record evaluation.
