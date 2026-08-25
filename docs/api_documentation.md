# SIH MPLADS AI — API Reference Documentation

Base URL: `http://127.0.0.1:8000`  
Interactive Swagger UI: `http://127.0.0.1:8000/docs`  
ReDoc UI: `http://127.0.0.1:8000/redoc`

---

## Endpoints

### 1. Health Check
- **Endpoint**: `GET /`
- **Description**: Returns API health and operational status.
- **Response**: `200 OK`
```json
{
  "message": "MPLADS AI API is running",
  "status": "success"
}
```

---

### 2. Get All Anomalies
- **Endpoint**: `GET /api/anomalies`
- **Description**: Returns all 544 constituency anomaly records sorted by `final_risk_score DESC`.
- **Response**: `200 OK`
```json
{
  "total": 544,
  "data": [
    {
      "id": 1,
      "hon_ble_members_of_parliaments": "Sanjay Uttamrao Deshmukh",
      "constituency": "YAVATMAL-WASHIM",
      "utilization_mock": 77.18,
      "pending_ratio_pct": 50.0,
      "cancelled_ratio_pct": 50.0,
      "average_project_cost_mock": 15206600,
      "average_delay_days_mock": 168,
      "statistical_anomaly_score": 83.38,
      "ml_anomaly_score": 95.17,
      "final_risk_score": 88.1,
      "final_risk_level": "CRITICAL",
      "primary_anomaly_reason": "High cancellation ratio",
      "detailed_reason": "Pending work ratio is 50.0%; Cancellation ratio is 50.0%; Average project cost is ₹15,206,600; Average delay is 168 days",
      "previously_selected_10": true
    }
  ]
}
```

---

### 3. Get CRITICAL Risk Anomalies
- **Endpoint**: `GET /api/anomalies/critical`
- **Description**: Returns constituencies categorized under CRITICAL risk tier ($\ge 75.0$).
- **Response**: `200 OK`

---

### 4. Get HIGH & CRITICAL Risk Anomalies
- **Endpoint**: `GET /api/anomalies/high`
- **Description**: Returns all constituencies categorized under HIGH ($\ge 60.0$) and CRITICAL ($\ge 75.0$) risk tiers.
- **Response**: `200 OK`

---

### 5. Get Anomaly Record by ID
- **Endpoint**: `GET /api/anomalies/{record_id}`
- **Parameters**: `record_id` (integer path parameter)
- **Response**: `200 OK` (record found) or `404 Not Found`

---

### 6. Get Top Highest-Risk Records
- **Endpoint**: `GET /api/top-anomalies?limit=10`
- **Query Parameters**: `limit` (integer, default `10`, range `1` to `100`)
- **Response**: `200 OK`

---

### 7. Governance Risk Statistics
- **Endpoint**: `GET /api/statistics`
- **Description**: Returns dynamically computed aggregate metrics across the entire dataset.
- **Response**: `200 OK`
```json
{
  "total_records": 544,
  "low_count": 111,
  "medium_count": 408,
  "high_count": 22,
  "critical_count": 3,
  "average_risk_score": 38.87,
  "maximum_risk_score": 88.1,
  "minimum_risk_score": 4.14
}
```

---

### 8. Risk Tier Distribution
- **Endpoint**: `GET /api/risk-distribution`
- **Description**: Returns counts per risk category.
- **Response**: `200 OK`
```json
{
  "LOW": 111,
  "MEDIUM": 408,
  "HIGH": 22,
  "CRITICAL": 3,
  "total": 544
}
```

---

### 9. Search Records
- **Endpoint**: `GET /api/search?q=<search_text>`
- **Query Parameters**: `q` (string, required)
- **Description**: Searches MP name and Constituency using parameterized SQL queries.
- **Response**: `200 OK`

---

### 10. On-Demand Record Evaluation
- **Endpoint**: `POST /api/analyze`
- **Description**: Runs full ML and statistical pipeline with explainability on an arbitrary constituency parameter vector.
- **Request Body**:
```json
{
  "hon_ble_members_of_parliaments": "Sample Representative",
  "constituency": "Sample Constituency",
  "utilization_mock": 48.5,
  "pending_ratio_pct": 52.0,
  "cancelled_ratio_pct": 30.0,
  "average_project_cost_mock": 9500000.0,
  "average_delay_days_mock": 140.0
}
```
- **Response**: `200 OK`
```json
{
  "hon_ble_members_of_parliaments": "Sample Representative",
  "constituency": "Sample Constituency",
  "statistical_anomaly_score": 83.12,
  "ml_anomaly_score": 78.45,
  "final_risk_score": 81.25,
  "final_risk_level": "CRITICAL",
  "primary_anomaly_reason": "High pending-work ratio",
  "detailed_reason": "Utilization is 48.5%; Pending work ratio is 52.0%; Cancellation ratio is 30.0%; Average project cost is ₹9,500,000; Average delay is 140 days",
  "parameter_breakdown": {
    "utilization_anomaly_score": 93.2,
    "pending_anomaly_score": 96.5,
    "cancelled_anomaly_score": 95.8,
    "avg_cost_anomaly_score": 94.7,
    "avg_delay_anomaly_score": 82.1
  }
}
```

---

### 11. Project-Level Analysis (Placeholder)
- **Endpoint**: `GET /api/projects`
- **Description**: Returns planned module status for project-level analysis.
- **Response**: `200 OK`
```json
{
  "status": "planned",
  "message": "Project-level anomaly analysis will be integrated in the next phase."
}
```
