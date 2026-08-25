import { useState, useEffect } from "react";
import { Eye, ArrowRight, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { api } from "../services/api";
import type { AlertItem } from "../types/api";

const TABS = ["All", "Critical", "High"];

const STATUS_STYLES: Record<string, string> = {
  "New": "bg-red-50 text-red-700 border border-red-200",
  "Under Review": "bg-amber-50 text-amber-700 border border-amber-200",
  "Verified": "bg-blue-50 text-blue-700 border border-blue-200",
  "Resolved": "bg-green-50 text-green-700 border border-green-200",
};

interface AlertsEarlyWarningsProps {
  onNavigate?: (id: string, recordId?: number) => void;
}

export default function AlertsEarlyWarnings({ onNavigate }: AlertsEarlyWarningsProps) {
  const [tab, setTab] = useState("All");
  const [records, setRecords] = useState<AlertItem[]>([]);
  const [statuses, setStatuses] = useState<Record<number, string>>(() => {
    try {
      const saved = localStorage.getItem("satark_alert_statuses");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  async function loadAlerts() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAlerts();
      setRecords(res.data);
    } catch (err) {
      console.error("Error loading alerts:", err);
      setError("Unable to load dynamic alerts from FastAPI backend. Please check connection.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAlerts();
  }, []);

  const filtered = records.filter((a) => {
    if (tab === "All") return true;
    return a.severity.toUpperCase() === tab.toUpperCase();
  });

  const criticalCount = records.filter((a) => a.severity === "CRITICAL").length;
  const highCount = records.filter((a) => a.severity === "HIGH").length;

  function getStatus(id: number) {
    return statuses[id] || "New";
  }

  function cycleStatus(id: number, current: string) {
    const cycle = ["New", "Under Review", "Verified", "Resolved"];
    const next = cycle[(cycle.indexOf(current) + 1) % cycle.length];
    const updated = { ...statuses, [id]: next };
    setStatuses(updated);
    try {
      localStorage.setItem("satark_alert_statuses", JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }
  }

  function handleEscalate(constituency: string) {
    const msg = `Constituency ${constituency} escalated to Central Oversight & Monitoring Division.`;
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  }

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Alerts & Early Warnings</h1>
          <p className="text-xs text-slate-500 mt-0.5">System-generated alerts for constituencies and projects requiring prioritized attention.</p>
        </div>
        <button
          onClick={loadAlerts}
          className="flex items-center gap-1.5 text-xs text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg shadow-sm font-medium transition-colors"
        >
          <RefreshCw size={12} className={loading ? "animate-spin text-blue-600" : "text-slate-400"} />
          <span>Refresh Alerts</span>
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Critical Risk Alerts", count: criticalCount, color: "border-l-red-600 text-red-600" },
          { label: "High Risk Alerts", count: highCount, color: "border-l-orange-500 text-orange-600" },
          { label: "Total Prioritized", count: records.length, color: "border-l-blue-500 text-blue-600" },
          { label: "Active Review Pool", count: records.length, color: "border-l-amber-500 text-amber-600" },
        ].map(({ label, count, color }) => (
          <div key={label} className={`bg-white rounded-xl border border-slate-200 border-l-4 ${color.split(" ")[0]} p-4 shadow-sm`}>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{label}</div>
            <div className={`text-2xl font-black font-mono mt-1 ${color.split(" ")[1]}`}>{count}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
              tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t} Alerts ({t === "All" ? records.length : t === "Critical" ? criticalCount : highCount})
          </button>
        ))}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center gap-2 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Alert cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            <Loader2 size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-xs">Loading dynamic risk alerts from SQLite backend...</p>
          </div>
        ) : error ? (
          <div className="py-10 text-center text-red-600 bg-white rounded-xl border border-red-200 p-4">
            <p className="text-xs font-semibold mb-2">{error}</p>
            <button
              onClick={loadAlerts}
              className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium"
            >
              Retry Connection
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
            No alerts found for selected filter.
          </div>
        ) : (
          filtered.map((alert) => {
            const st = getStatus(alert.id);
            const borderColor = alert.severity === "CRITICAL" ? "border-l-red-600" : "border-l-orange-500";
            return (
              <div
                key={alert.id}
                className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderColor} p-4 shadow-sm`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5">
                      <RiskBadge level={alert.severity} size="sm" />
                      <span className="text-[13px] font-bold text-slate-900">{alert.hon_ble_members_of_parliaments}</span>
                      <span className="text-[11px] text-slate-500 font-mono">({alert.constituency})</span>
                    </div>
                    <p className="text-[12px] text-slate-700 mb-2 font-medium">
                      {alert.detailed_reason || alert.primary_anomaly_reason}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-500">
                        Risk Score: <span className="font-mono font-black text-slate-800">{alert.final_risk_score.toFixed(2)}</span>
                      </span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] text-slate-500">
                        Primary Driver: <strong className="text-slate-700">{alert.primary_anomaly_reason}</strong>
                      </span>
                      <button
                        onClick={() => cycleStatus(alert.id, st)}
                        className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded cursor-pointer transition-colors ml-auto ${
                          STATUS_STYLES[st] || STATUS_STYLES["New"]
                        }`}
                      >
                        {st}
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate?.("risk", alert.id)}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 border border-blue-200 hover:border-blue-400 rounded-lg px-3 py-1.5 transition-colors"
                    >
                      <Eye size={11} /> Review Profile
                    </button>
                    {alert.severity === "CRITICAL" && (
                      <button
                        onClick={() => handleEscalate(alert.constituency)}
                        className="flex items-center gap-1.5 text-[11px] font-semibold text-red-600 border border-red-200 hover:border-red-400 rounded-lg px-3 py-1.5 transition-colors"
                      >
                        <ArrowRight size={11} /> Escalate
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
