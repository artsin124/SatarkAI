import { useState, useEffect } from "react";
import { Info, ChevronDown, Loader2, Sparkles } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { api } from "../services/api";
import {
  extractContributions,
  extractFlags,
  generateRecommendation,
  formatRupee,
} from "../utils/adapters";
import type { AnomalyRecord, NewAnalysisResponse } from "../types/api";

const BAR_COLORS = ["#DC2626", "#EA580C", "#D97706", "#CA8A04", "#16A34A"];

function Card({ children, className = "", style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={`rounded-xl bg-white ${className}`}
      style={{
        border: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface RiskIntelligenceProps {
  selectedRecordId?: number | null;
}

export default function RiskIntelligence({ selectedRecordId }: RiskIntelligenceProps) {
  const [records, setRecords] = useState<AnomalyRecord[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Custom Simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simUtilization, setSimUtilization] = useState(55);
  const [simPending, setSimPending] = useState(45);
  const [simCancelled, setSimCancelled] = useState(30);
  const [simCost, setSimCost] = useState(12000000);
  const [simDelay, setSimDelay] = useState(140);
  const [simResult, setSimResult] = useState<NewAnalysisResponse | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await api.getAllAnomalies();
        setRecords(res.data);
        if (selectedRecordId) {
          const idx = res.data.findIndex((r) => r.id === selectedRecordId);
          if (idx !== -1) setSelectedIdx(idx);
        }
      } catch (err) {
        console.error("Error loading anomalies for Risk Intelligence:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedRecordId]);

  async function handleRunSimulation() {
    setSimLoading(true);
    try {
      const res = await api.analyzeRecord({
        hon_ble_members_of_parliaments: "Custom Simulation",
        constituency: "Simulated Constituency",
        utilization_mock: simUtilization,
        pending_ratio_pct: simPending,
        cancelled_ratio_pct: simCancelled,
        average_project_cost_mock: simCost,
        average_delay_days_mock: simDelay,
      });
      setSimResult(res);
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setSimLoading(false);
    }
  }

  const rec = records[selectedIdx] || {
    id: 1,
    hon_ble_members_of_parliaments: "Sanjay Uttamrao Deshmukh",
    constituency: "YAVATMAL-WASHIM",
    final_risk_score: 88.1,
    final_risk_level: "CRITICAL",
    statistical_anomaly_score: 83.38,
    ml_anomaly_score: 95.17,
    utilization_mock: 77.18,
    pending_ratio_pct: 50.0,
    cancelled_ratio_pct: 50.0,
    average_project_cost_mock: 15206600,
    average_delay_days_mock: 168,
    primary_anomaly_reason: "High cancellation ratio",
    detailed_reason: "Pending work ratio is 50.0%; Cancellation ratio is 50.0%; Average project cost is ₹15,206,600; Average delay is 168 days",
    previously_selected_10: true,
  };

  const contributions = extractContributions(rec);
  const flags = extractFlags(rec);
  const recommendation = generateRecommendation(rec);
  const scoreColor = rec.final_risk_level === "CRITICAL" ? "#DC2626" : rec.final_risk_level === "HIGH" ? "#EA580C" : "#D97706";

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Risk Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">Explainable AI-driven risk analysis for individual MPs and constituencies.</p>
        </div>
        <button
          onClick={() => setShowSimulator(!showSimulator)}
          className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg shadow-sm font-semibold transition-colors"
        >
          <Sparkles size={13} className="text-blue-600" />
          <span>{showSimulator ? "Hide On-Demand Evaluator" : "On-Demand Risk Evaluator"}</span>
        </button>
      </div>

      {/* Simulator Drawer */}
      {showSimulator && (
        <Card className="p-5 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">On-Demand ML & Statistical Evaluator</h3>
              <p className="text-[11px] text-slate-500">Test live inference against the trained Isolation Forest and empirical statistical model via <code>POST /api/analyze</code>.</p>
            </div>
            <button
              onClick={handleRunSimulation}
              disabled={simLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
            >
              {simLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>Compute Risk Scores</span>
            </button>
          </div>

          <div className="grid grid-cols-5 gap-3 pt-2">
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">Utilization: {simUtilization}%</label>
              <input type="range" min="0" max="100" value={simUtilization} onChange={e => setSimUtilization(Number(e.target.value))} className="w-full cursor-pointer accent-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">Pending Ratio: {simPending}%</label>
              <input type="range" min="0" max="100" value={simPending} onChange={e => setSimPending(Number(e.target.value))} className="w-full cursor-pointer accent-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">Cancelled Ratio: {simCancelled}%</label>
              <input type="range" min="0" max="100" value={simCancelled} onChange={e => setSimCancelled(Number(e.target.value))} className="w-full cursor-pointer accent-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">Avg Cost: ₹{(simCost / 100000).toFixed(1)}L</label>
              <input type="range" min="500000" max="25000000" step="500000" value={simCost} onChange={e => setSimCost(Number(e.target.value))} className="w-full cursor-pointer accent-blue-600" />
            </div>
            <div>
              <label className="text-[10px] font-semibold text-slate-600 block mb-1">Avg Delay: {simDelay} days</label>
              <input type="range" min="0" max="200" value={simDelay} onChange={e => setSimDelay(Number(e.target.value))} className="w-full cursor-pointer accent-blue-600" />
            </div>
          </div>

          {simResult && (
            <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between bg-white rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Final Risk Score</span>
                  <span className="text-xl font-black font-mono text-slate-900">{simResult.final_risk_score.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Assigned Tier</span>
                  <RiskBadge level={simResult.final_risk_level} size="sm" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Primary Driver</span>
                  <span className="text-xs font-semibold text-slate-800">{simResult.primary_anomaly_reason}</span>
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-600 font-mono">
                Stat Score: <strong>{simResult.statistical_anomaly_score.toFixed(1)}</strong> | ML Score: <strong>{simResult.ml_anomaly_score.toFixed(1)}</strong>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Selector */}
      <Card className="p-4">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Select Constituency Record for Detailed Governance Analysis ({records.length} Available)
        </label>
        <div className="relative w-full max-w-xl">
          <select
            value={selectedIdx}
            onChange={(e) => setSelectedIdx(Number(e.target.value))}
            className="text-xs rounded-lg px-3 py-2 outline-none cursor-pointer pr-8 appearance-none font-medium w-full"
            style={{
              border: "1px solid rgba(226,232,240,0.8)",
              background: "#F8FAFC",
              boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)",
              color: "#1e293b",
            }}
          >
            {records.map((r, i) => (
              <option key={r.id || i} value={i}>
                #{r.id || i + 1} — {r.hon_ble_members_of_parliaments} ({r.constituency}) — Risk: {r.final_risk_score.toFixed(2)} [{r.final_risk_level}]
              </option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </Card>

      {/* Profile header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">{rec.hon_ble_members_of_parliaments}</h2>
            <p className="text-sm font-mono text-slate-500 mt-0.5 font-semibold">{rec.constituency}</p>
            <p className="text-[11px] text-slate-400 mt-2 italic">
              Potential anomaly requiring review — AI decision-support analysis only
            </p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black font-mono leading-none" style={{ color: scoreColor }}>
              {rec.final_risk_score.toFixed(2)}
            </div>
            <div className="mt-1.5">
              <RiskBadge level={rec.final_risk_level} size="lg" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100">
          {[
            {
              label: "Statistical Score",
              value: rec.statistical_anomaly_score,
              desc: "Percentile ranking (60% weight)",
            },
            {
              label: "ML Score",
              value: rec.ml_anomaly_score,
              desc: "Isolation Forest V2 (40% weight)",
            },
            {
              label: "Final Risk Score",
              value: rec.final_risk_score,
              desc: "Calibrated 60/40 hybrid score",
            },
          ].map(({ label, value, desc }) => (
            <div
              key={label}
              className="text-center rounded-xl p-4"
              style={{
                background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)",
                border: "1px solid rgba(226,232,240,0.7)",
                boxShadow: "inset 0 1px 3px rgba(15,23,42,0.05)",
              }}
            >
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
              <div className="text-2xl font-black font-mono text-slate-800">{value.toFixed(1)}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{desc}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Contribution bars */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Risk Factor Contribution</h3>
          <p className="text-[11px] text-slate-400 mb-5">Relative weight of each governance indicator in the risk profile</p>
          <div className="space-y-4">
            {contributions.map((c, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-slate-700">{c.factor}</span>
                  <span className="text-[10px] font-mono text-slate-400">{c.detail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 rounded-full h-2 overflow-hidden"
                    style={{ background: "rgba(15,23,42,0.07)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)" }}
                  >
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${(c.value / 30) * 100}%`,
                        background: BAR_COLORS[i % BAR_COLORS.length],
                        boxShadow: `0 1px 3px ${BAR_COLORS[i % BAR_COLORS.length]}60`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-black text-slate-600 w-5 text-right">{c.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Flags */}
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-1">Why Was This Flagged?</h3>
          <p className="text-[11px] text-slate-400 mb-4">Explainable AI — individual risk factor breakdown</p>
          <div className="space-y-3">
            {flags.map((f, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl"
                style={
                  f.level === "CRITICAL"
                    ? {
                        background: "linear-gradient(135deg,#FEF2F2,#FFF5F5)",
                        border: "1px solid #FECACA",
                        boxShadow: "0 1px 3px rgba(220,38,38,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
                      }
                    : {
                        background: "linear-gradient(135deg,#FFF7ED,#FFFAF5)",
                        border: "1px solid #FED7AA",
                        boxShadow: "0 1px 3px rgba(234,88,12,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
                      }
                }
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{f.icon}</span>
                  <span
                    className={`text-[12px] font-bold ${
                      f.level === "CRITICAL" ? "text-red-800" : "text-orange-800"
                    }`}
                  >
                    {f.label}
                  </span>
                </div>
                <p
                  className={`text-[11px] ${
                    f.level === "CRITICAL" ? "text-red-700" : "text-orange-700"
                  }`}
                >
                  {f.detail}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recommendation */}
      <div
        className="flex items-start gap-3 rounded-xl p-5"
        style={{
          background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)",
          border: "1px solid rgba(147,197,253,0.5)",
          boxShadow: "0 1px 3px rgba(37,99,235,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <div
          className="p-2 rounded-lg shrink-0"
          style={{ background: "#2563EB", boxShadow: "0 2px 8px rgba(37,99,235,0.35)" }}
        >
          <Info size={14} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-blue-900 mb-1">Recommended Review Action</h3>
          <p className="text-[12px] text-blue-800">{recommendation}</p>
          <p className="text-[10px] text-blue-600 mt-2 italic">
            System-generated decision support. Final action must be taken only by authorized officials after independent verification.
          </p>
        </div>
      </div>
    </div>
  );
}
