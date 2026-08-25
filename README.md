# SIH MPLADS AI — AI-Powered MPLADS Anomaly Detection and Governance Risk Analysis System

An AI-driven **Governance Decision-Support and Risk-Prioritization System** designed for analyzing the **Members of Parliament Local Area Development Scheme (MPLADS)** data across 544 parliamentary constituencies.

The system assists administrative authorities, ministries, and oversight committees in prioritizing manual reviews by highlighting statistically unusual operational patterns. **It does not declare fraud.**

---

## Key Features

- **Dual-Model Anomaly Architecture**: Combines empirical statistical percentile scoring with an unsupervised **Isolation Forest (V2)** model.
- **Calibrated Hybrid Risk Scoring**: Fuses 60% Statistical Anomaly Score and 40% ML Anomaly Score into a transparent 0–100 governance risk index.
- **Explainable AI (XAI)**: Generates human-interpretable primary anomaly drivers and detailed quantitative metric justifications for every constituency.
- **FastAPI REST Backend**: High-performance backend providing search, filtering, risk distribution, aggregate statistics, and on-demand inference endpoints.
- **Preserved Artifacts & Zero Retraining Drift**: Operates cleanly on precomputed datasets and pre-trained model artifacts without automated retraining.

---

## The Five Core Governance Parameters

1. `utilization_mock`: Fund utilization rate (%) — lower utilization indicates delayed capital deployment.
2. `pending_ratio_pct`: Ratio of sanctioned works pending completion (%) — high ratios signal execution backlogs.
3. `cancelled_ratio_pct`: Ratio of sanctioned works cancelled (%) — high ratios indicate project planning issues.
4. `average_project_cost_mock`: Average cost per project (INR) — handles extreme positive skewness via log transformation.
5. `average_delay_days_mock`: Average delay in days beyond scheduled completion dates.

---

## Hybrid Risk Scoring & Governance Tiers

$$\text{Final Risk Score} = (0.60 \times \text{Statistical Anomaly Score}) + (0.40 \times \text{ML Anomaly Score})$$

| Risk Tier | Score Range | Description | Dataset Count |
| :--- | :--- | :--- | :--- |
| **LOW** | $0.00 - 29.99$ | Normal operational parameters | **111** |
| **MEDIUM** | $30.00 - 59.99$ | Standard operational variation | **408** |
| **HIGH** | $60.00 - 74.99$ | Elevated anomaly signals across metrics | **22** |
| **CRITICAL** | $75.00 - 100.00$ | Severe multidimensional outlier patterns | **3** |

*Total Constituencies Analyzed: 544*

---

## Directory Structure

```
SatarkAI/
├── data/
│   ├── raw/
│   ├── processed/
│   │   ├── sih_ml_features.csv
│   │   └── sih_cleaned_data.csv
│   └── output/
│       ├── mplads.db
│       └── final_mplads_anomaly_results.csv
│
├── ml/
│   ├── preprocessing/
│   │   └── preprocessing.py
│   ├── models/
│   │   ├── isolation_forest.py
│   │   └── hybrid_risk_model.py
│   ├── explainability/
│   │   └── explanation.py
│   ├── trained/
│   │   ├── mplads_isolation_forest_v2.pkl
│   │   └── model_config.json
│   └── evaluate.py
│
├── backend/
│   ├── main.py
│   ├── api/
│   │   ├── anomalies.py
│   │   ├── statistics.py
│   │   ├── search.py
│   │   └── projects.py
│   ├── database/
│   │   ├── connection.py
│   │   ├── models.py
│   │   └── schema.sql
│   ├── services/
│   │   ├── anomaly_service.py
│   │   ├── statistics_service.py
│   │   └── project_service.py
│   └── schemas/
│       ├── anomaly_schema.py
│       └── project_schema.py
│
├── tests/
│   ├── test_api.py
│   ├── test_database.py
│   └── test_anomaly_model.py
│
├── docs/
│   ├── architecture.md
│   ├── model_documentation.md
│   ├── database_documentation.md
│   └── api_documentation.md
│
├── requirements.txt
├── README.md
└── .gitignore
```

---

## Installation & Setup

### 1. Prerequisites
- Python 3.10+ (tested on Python 3.10 to 3.14)

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## Running the API Server

Start the FastAPI application using Uvicorn:

```bash
uvicorn backend.main:app --reload
```

- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger UI: `http://127.0.0.1:8000/docs`
- ReDoc Documentation: `http://127.0.0.1:8000/redoc`

---

## Running Tests

Execute the complete test suite with Pytest:

```bash
python -m pytest tests/ -v
```

Run candidate sensitivity evaluation:

```bash
python -m ml.evaluate
```

---

## API Reference Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check endpoint |
| `GET` | `/api/anomalies` | Get all 544 constituency records (sorted by risk DESC) |
| `GET` | `/api/anomalies/critical` | Get CRITICAL risk records ($\ge 75$) |
| `GET` | `/api/anomalies/high` | Get HIGH & CRITICAL risk records ($\ge 60$) |
| `GET` | `/api/anomalies/{record_id}` | Get single constituency record by database ID |
| `GET` | `/api/top-anomalies?limit=10` | Get top highest-risk records with limit |
| `GET` | `/api/statistics` | Dynamically calculated dataset aggregate metrics |
| `GET` | `/api/risk-distribution` | Risk tier counts breakdown |
| `GET` | `/api/search?q=<query>` | Parameterized search on MP name and Constituency |
| `POST` | `/api/analyze` | On-demand ML & statistical risk scoring with XAI |
| `GET` | `/api/projects` | Status of upcoming project-level anomaly analysis |

---

## Limitations & Ethical Disclaimer

1. **Governance Support Only**: This system identifies statistical outliers to guide administrative prioritization; it does not replace formal audits or judicial investigations.
2. **Context Sensitivity**: Unforeseen ground realities (such as natural disasters or land disputes) may lead to project delays or cancellations without representing administrative failure.
