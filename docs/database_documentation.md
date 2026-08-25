# SIH MPLADS AI — Database Documentation

## 1. Overview
The **SIH MPLADS AI** backend uses an embedded SQLite database stored at `data/output/mplads.db`.
The database stores precomputed constituency-level anomaly evaluations, parameter breakdowns, final risk scores, risk levels, and Explainable AI rationales across all 544 parliamentary constituencies.

---

## 2. Table Schema: `anomaly_results`

| Column Name | Data Type | Description |
| :--- | :--- | :--- |
| `hon_ble_members_of_parliaments` | `TEXT` | Name of the Member of Parliament |
| `constituency` | `TEXT` | Parliamentary Constituency Name |
| `utilization_mock` | `REAL` | MPLADS fund utilization percentage |
| `pending_ratio_pct` | `REAL` | Percentage of sanctioned works currently pending |
| `cancelled_ratio_pct` | `REAL` | Percentage of sanctioned works cancelled |
| `average_project_cost_mock` | `INTEGER` | Average sanctioned project cost (INR) |
| `average_delay_days_mock` | `INTEGER` | Average project completion delay (days) |
| `statistical_anomaly_score` | `REAL` | Composite percentile statistical anomaly score ($0-100$) |
| `ml_anomaly_score` | `REAL` | Isolation Forest V2 anomaly score ($0-100$) |
| `final_risk_score` | `REAL` | Calibrated hybrid risk score ($0-100$) |
| `final_risk_level` | `TEXT` | Assigned risk tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `primary_anomaly_reason` | `TEXT` | Primary driving risk factor |
| `detailed_reason` | `TEXT` | Evidence-based explanation of elevated metrics |
| `previously_selected_10` | `INTEGER` | Flag (`1` or `0`) indicating validation candidate status |

---

## 3. Querying & Indexing
To support fast API responses:
- SQLite's native `rowid` serves as the primary unique identifier for direct lookups via `GET /api/anomalies/{record_id}`.
- Indexes exist on `final_risk_score DESC`, `final_risk_level`, `hon_ble_members_of_parliaments`, and `constituency`.

```sql
-- Fetch top critical records
SELECT rowid AS id, *
FROM anomaly_results
WHERE final_risk_level = 'CRITICAL'
ORDER BY final_risk_score DESC;

-- Parameterized search
SELECT rowid AS id, *
FROM anomaly_results
WHERE hon_ble_members_of_parliaments LIKE ? OR constituency LIKE ?
ORDER BY final_risk_score DESC;
```

---

## 4. Future Project-Level Tables (Planned Phase)
In the upcoming project-level analysis phase, relational tables will link constituency records to granular project data:

- `mplads_projects`: Individual projects (`project_id`, `constituency_id`, `project_title`, `sanctioned_cost`, `category`, `district`, `contractor_id`, `sanction_date`).
- `mplads_contractors`: Contractor profiles (`contractor_id`, `contractor_name`, `total_projects`, `total_value`).
- `mplads_project_anomalies`: Flags for semantic duplicates, tender splitting, and cost outliers.
