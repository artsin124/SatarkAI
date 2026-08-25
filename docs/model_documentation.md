# SIH MPLADS AI — Machine Learning Model Documentation

## 1. Problem Formulation & Philosophy
In public fund governance (such as the Members of Parliament Local Area Development Scheme — MPLADS), large-scale ground truth labels of verified fraud are typically unavailable. Declaring fraud directly from an algorithm is ethically and legally inappropriate.

Therefore, **SIH MPLADS AI** is designed as a **Governance Decision-Support and Risk-Prioritization System**. It highlights records with unusual multi-dimensional risk patterns to assist administrators in prioritizing manual audits.

---

## 2. The Five Governance Parameters
The anomaly detection pipeline operates on five parameters:

| Parameter | Signal Direction | Anomaly Logic |
| :--- | :--- | :--- |
| `utilization_mock` | Low Utilization $\rightarrow$ High Risk | Funds remaining unutilized or delayed execution |
| `pending_ratio_pct` | High Pending $\rightarrow$ High Risk | Execution bottlenecks and backlog accumulation |
| `cancelled_ratio_pct` | High Cancellation $\rightarrow$ High Risk | Ineffective planning or procurement disruptions |
| `average_project_cost_mock` | High Average Cost $\rightarrow$ High Risk | Atypical project sizing requiring cost validation |
| `average_delay_days_mock` | High Delay $\rightarrow$ High Risk | Severe timeline slippage beyond norms |

---

## 3. Dual Detection Architecture

### A. Statistical Anomaly Score
- Each parameter is mapped to an empirical percentile score between `0` and `100` relative to the national 544-constituency distribution.
- Composite statistical score is the arithmetic mean of all 5 parameter scores.

### B. Isolation Forest Model (V2)
- **Model**: `sklearn.ensemble.IsolationForest`
- **Trained Artifact**: `ml/trained/mplads_isolation_forest_v2.pkl`
- **Configuration**:
  - `n_estimators`: 300
  - `contamination`: 0.10
  - `random_state`: 42
- **Features Used**:
  - `utilization_mock`
  - `pending_ratio_pct`
  - `cancelled_ratio_pct`
  - `average_delay_days_mock`
  - `average_project_cost_log` ($\log(1 + \text{cost})$ to accommodate skewness)
- **Score Normalization**:
  The decision function output is inverted and scaled to a $[0, 100]$ interval where higher values represent greater anomaly degree.

---

## 4. Hybrid Risk Scoring
The final calibrated governance risk score combines both models using a 60/40 weighting:

$$\text{Final Risk Score} = 0.60 \times \text{Statistical Anomaly Score} + 0.40 \times \text{ML Anomaly Score}$$

### Risk Tiers
- **LOW** (`0.00 – 29.99`): Metrics within normal operational parameters.
- **MEDIUM** (`30.00 – 59.99`): Moderate deviations; standard periodic monitoring recommended.
- **HIGH** (`60.00 – 74.99`): Significant deviation across multiple parameters; administrative review suggested.
- **CRITICAL** (`75.00 – 100.00`): Exceptional statistical and ML anomaly signals; top-priority human review recommended.

---

## 5. Validation Candidates & Contamination Analysis
The system incorporates **10 historical validation candidates** used strictly to benchmark sensitivity and threshold tuning. They are **not** confirmed fraud ground truth.

### Historical Contamination Sensitivity Benchmarks
| Contamination | Total Flagged | Candidates Detected | Candidate Detection Rate |
| :--- | :--- | :--- | :--- |
| `0.02` | 11 | 2 / 10 | 20% |
| `0.03` | 17 | 2 / 10 | 20% |
| `0.05` | 28 | 3 / 10 | 30% |
| `0.08` | 44 | 4 / 10 | 40% |
| `0.10` (Selected) | 55 | 6 / 10 | 60% |
| `0.15` | 82 | 8 / 10 | 80% |

---

## 6. Limitations & Ethical Safeguards
1. **Decision Support Only**: ML outputs indicate statistical divergence, not illegality.
2. **Context Dependency**: Genuine local emergencies (e.g. natural disasters) may justify high cancellation or delay without malpractice.
3. **No Auto-Retraining**: The model configuration is deterministic to prevent uncontrolled drift during production inference.
