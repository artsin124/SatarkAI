import { useState, useEffect } from "react";
import { Info, Search, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { api } from "../services/api";
import { extractIndicators } from "../utils/adapters";
import type { AnomalyRecord } from "../types/api";

const TABS = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];

const INDICATOR_STYLES: Record<string, React.CSSProperties> = {
  "Cost Outlier":      { background: "#FFF7ED", color: "#9a3412", borderColor: "#FED7AA" },
  "High Cancellation": { background: "#FEF2F2", color: "#991b1b", borderColor: "#FECACA" },
  "High Pending Work": { background: "#FFFBEB", color: "#78350f", borderColor: "#FDE68A" },
  "Low Utilization":   { background: "#EFF6FF", color: "#1e40af", borderColor: "#BFDBFE" },
  "High Delay":        { background: "#FFF7ED", color: "#9a3412", borderColor: "#FED7AA" },
};

interface AnomalyDetectionProps {
  onNavigate?: (id: string, recordId?: number) => void;
}

export default function AnomalyDetection({ onNavigate }: AnomalyDetectionProps) {
  const [tab, setTab] = useState("ALL");
  const [records, setRecords] = useState<AnomalyRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  async function loadAnomalies() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAllAnomalies();
      setRecords(res.data);
    } catch (err) {
      console.error("Error fetching anomalies:", err);
      setError("Unable to connect to MPLADS backend. Please verify that FastAPI is running at http://127.0.0.1:8000.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnomalies();
  }, []);

  const filtered = records.filter((a) => {
    const matchTab = tab === "ALL" || a.final_risk_level === tab;
    const matchSearch =
      !search ||
      a.hon_ble_members_of_parliaments.toLowerCase().includes(search.toLowerCase()) ||
      a.constituency.toLowerCase().includes(search.toLowerCase()) ||
      (a.primary_anomaly_reason || "").toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Anomaly Detection</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-assisted identification of potentially unusual MPLADS implementation patterns.</p>
        </div>
        <button
          onClick={loadAnomalies}
          className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-sm font-medium transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin text-blue-600" : "text-slate-400"} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Disclaimer */}
      <div
        className="flex items-start gap-3 rounded-xl px-4 py-3"
        style={{
          background: "linear-gradient(135deg,#eff6ff,#dbeafe)",
          border: "1px solid rgba(147,197,253,0.5)",
          boxShadow: "0 1px 3px rgba(37,99,235,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-800">
          <strong>Decision-Support Notice:</strong> Records shown are <em>potential anomalies</em> identified by statistical percentile ranking and Isolation Forest ML models. These are risk indicators requiring further review by authorized officials — not confirmed findings of irregularity or fraud.
        </p>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div
          className="flex gap-1 p-1 rounded-xl w-fit"
          style={{ background: "linear-gradient(135deg,#F1F5F9,#E2E8F0)", boxShadow: "inset 0 1px 3px rgba(15,23,42,0.08)" }}
        >
          {TABS.map((t) => {
            const count = t === "ALL" ? records.length : records.filter((a) => a.final_risk_level === t).length;
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
                className="px-4 py-1.5 rounded-lg text-[11px] font-bold font-mono transition-all"
                style={
                  isActive
                    ? {
                        background: "white",
                        color: "#0F172A",
                        boxShadow: "0 1px 4px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
                      }
                    : { color: "#64748B" }
                }
              >
                {t} {count > 0 && <span className="ml-1 opacity-50 font-normal">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div
          className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-200 min-w-64"
          style={{ boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
        >
          <Search size={13} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by MP, constituency, reason..."
            className="bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none w-full"
          />
        </div>
      </div>

      {/* Indicator legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(INDICATOR_STYLES).map(([k, s]) => (
          <span
            key={k}
            className="text-[9px] px-2 py-0.5 rounded-md font-mono font-semibold"
            style={{ ...s, border: `1px solid ${s.borderColor}`, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
          >
            {k}
          </span>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden bg-white"
        style={{
          border: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs sticky-table">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(226,232,240,0.8)" }}>
                {["#", "MP / Authority", "Constituency", "Risk Score", "Risk Level", "Primary Reason", "Detected Indicators", "Action"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-xs">Loading live constituency anomaly dataset from SQLite backend...</p>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-red-600">
                    <p className="text-xs font-semibold mb-2">{error}</p>
                    <button
                      onClick={loadAnomalies}
                      className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium"
                    >
                      Retry Connection
                    </button>
                  </td>
                </tr>
              ) : paged.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No matching constituency records found.
                  </td>
                </tr>
              ) : (
                paged.map((a, i) => {
                  const indicators = extractIndicators(a);
                  return (
                    <tr key={a.id || i} className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        {a.id || (page - 1) * PER_PAGE + i + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-800 text-[12px]">{a.hon_ble_members_of_parliaments}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {a.previously_selected_10 ? "Validation Candidate" : "Constituency Audit Pool"}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 text-[11px] font-semibold">{a.constituency}</td>
                      <td className="px-4 py-3">
                        <div
                          className="text-[15px] font-black font-mono"
                          style={{
                            color:
                              a.final_risk_level === "CRITICAL"
                                ? "#DC2626"
                                : a.final_risk_level === "HIGH"
                                ? "#EA580C"
                                : a.final_risk_level === "MEDIUM"
                                ? "#D97706"
                                : "#16A34A",
                          }}
                        >
                          {a.final_risk_score.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge level={a.final_risk_level} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-slate-600 max-w-[200px] text-[11px]">
                        {a.primary_anomaly_reason}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {indicators.map((ind) => {
                            const style = INDICATOR_STYLES[ind] || { background: "#F1F5F9", color: "#475569", borderColor: "#E2E8F0" };
                            return (
                              <span
                                key={ind}
                                className="text-[9px] px-1.5 py-0.5 rounded-md font-mono font-semibold"
                                style={{ ...style, border: `1px solid ${style.borderColor}` }}
                              >
                                {ind}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onNavigate?.("risk", a.id)}
                          className="text-[11px] font-semibold rounded-lg px-2.5 py-1 transition-colors hover:bg-blue-100"
                          style={{
                            color: "#1d4ed8",
                            border: "1px solid rgba(147,197,253,0.5)",
                            background: "#EFF6FF",
                            boxShadow: "0 1px 2px rgba(37,99,235,0.08)",
                          }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div
          className="flex items-center justify-between px-4 py-3 border-t border-slate-100"
          style={{ background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)" }}
        >
          <span className="text-[11px] text-slate-500 font-mono">
            Showing {filtered.length > 0 ? (page - 1) * PER_PAGE + 1 : 0}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} records (544 National Dataset)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={14} className="text-slate-600" />
            </button>
            <span className="text-[11px] font-mono font-semibold px-2 text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={14} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
