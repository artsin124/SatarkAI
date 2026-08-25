import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LineChart, Line } from "recharts";
import { AlertTriangle, TrendingUp, Clock, ArrowRight, XCircle, Layers, Loader2 } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import { api } from "../services/api";
import type { RiskStatisticsResponse, RiskDistributionResponse, AnomalyRecord } from "../types/api";

const DEFAULT_RISK_DATA = [
  { name: "LOW", value: 111, color: "#16A34A" },
  { name: "MEDIUM", value: 408, color: "#D97706" },
  { name: "HIGH", value: 22, color: "#EA580C" },
  { name: "CRITICAL", value: 3, color: "#DC2626" },
];

const trendData = [
  { month: "Mar", score: 42 }, { month: "Apr", score: 48 }, { month: "May", score: 51 },
  { month: "Jun", score: 58 }, { month: "Jul", score: 63 }, { month: "Aug", score: 71 },
];

const RECENT_EVENTS = [
  { icon: AlertTriangle, text: "Critical risk detected — YAVATMAL-WASHIM (Score: 88.10)", time: "2h ago", dot: "#DC2626", bg: "#FEF2F2", border: "#FECACA", textC: "#991b1b" },
  { icon: XCircle,       text: "High cancellation ratio — VIZIANAGARAM constituency",     time: "4h ago", dot: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", textC: "#9a3412" },
  { icon: TrendingUp,    text: "Potential cost anomaly — SOUTH DELHI projects",           time: "6h ago", dot: "#EA580C", bg: "#FFF7ED", border: "#FED7AA", textC: "#9a3412" },
  { icon: Clock,         text: "High project delay — RAJSAMAND avg 38 days above threshold", time: "1d ago", dot: "#D97706", bg: "#FFFBEB", border: "#FDE68A", textC: "#92400e" },
  { icon: Layers,        text: "High pending-work ratio — DUMKA constituency",            time: "1d ago", dot: "#D97706", bg: "#FFFBEB", border: "#FDE68A", textC: "#92400e" },
];

interface DashboardProps {
  onNavigate: (id: string) => void;
}

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

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<RiskStatisticsResponse | null>(null);
  const [distribution, setDistribution] = useState<RiskDistributionResponse | null>(null);
  const [topRecords, setTopRecords] = useState<AnomalyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [statsRes, distRes, topRes] = await Promise.all([
          api.getStatistics(),
          api.getRiskDistribution(),
          api.getTopAnomalies(5),
        ]);
        setStats(statsRes);
        setDistribution(distRes);
        setTopRecords(topRes.data);
      } catch (err) {
        console.warn("Using baseline fallback data for Dashboard:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  const total = stats?.total_records ?? 544;
  const low = stats?.low_count ?? 111;
  const medium = stats?.medium_count ?? 408;
  const high = stats?.high_count ?? 22;
  const critical = stats?.critical_count ?? 3;
  const avgScore = stats ? stats.average_risk_score.toFixed(1) : "38.9";

  const riskChartData = distribution ? [
    { name: "LOW", value: distribution.LOW, color: "#16A34A" },
    { name: "MEDIUM", value: distribution.MEDIUM, color: "#D97706" },
    { name: "HIGH", value: distribution.HIGH, color: "#EA580C" },
    { name: "CRITICAL", value: distribution.CRITICAL, color: "#DC2626" },
  ] : DEFAULT_RISK_DATA;

  const KPI = [
    { label: "Total Records",  value: total,    sub: "Live analyzed constituencies", accent: "#2563EB", grad: "linear-gradient(135deg,#eff6ff,#dbeafe)" },
    { label: "Low Risk",       value: low,      sub: "Within normal parameters",     accent: "#16A34A", grad: "linear-gradient(135deg,#f0fdf4,#dcfce7)" },
    { label: "Medium Risk",    value: medium,   sub: "Periodic monitoring",          accent: "#D97706", grad: "linear-gradient(135deg,#fffbeb,#fef3c7)" },
    { label: "High Risk",      value: high,     sub: "Requires review",              accent: "#EA580C", grad: "linear-gradient(135deg,#fff7ed,#fed7aa)" },
    { label: "Critical Risk",  value: critical, sub: "Immediate audit focus",        accent: "#DC2626", grad: "linear-gradient(135deg,#fef2f2,#fecaca)" },
  ];

  return (
    <div className="p-6 space-y-5 max-w-screen-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Governance Intelligence Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitor MPLADS implementation, identify emerging risks and prioritize interventions.</p>
        </div>
        <div
          className="text-right rounded-lg px-3 py-2"
          style={{
            background: "linear-gradient(135deg,#f8fafc,#f1f5f9)",
            border: "1px solid rgba(226,232,240,0.8)",
            boxShadow: "0 1px 3px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.8)",
          }}
        >
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Analysis Dataset</div>
          <div className="text-[11px] text-slate-600 font-semibold mt-0.5 flex items-center justify-end gap-1.5">
            {loading && <Loader2 size={11} className="animate-spin text-blue-600" />}
            {total} records — National Constituency Pool
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-5 gap-3">
        {KPI.map(({ label, value, sub, accent, grad }) => (
          <div
            key={label}
            className="rounded-xl p-4 relative overflow-hidden"
            style={{
              background: grad,
              border: `1px solid ${accent}30`,
              boxShadow: `0 1px 2px rgba(15,23,42,0.06), 0 4px 12px ${accent}18, inset 0 1px 0 rgba(255,255,255,0.8)`,
            }}
          >
            <div
              className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
              style={{ background: accent }}
            />
            <div className="pl-2">
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</div>
              <div className="text-3xl font-black font-mono leading-none" style={{ color: accent }}>{value}</div>
              <div className="text-[10px] text-slate-400 mt-1.5">{sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Risk Overview Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Bar chart */}
        <Card className="col-span-2 p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Risk Distribution</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Constituency counts by governance risk tier ({total} evaluated)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={riskChartData} barSize={52}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.12)" }}
                formatter={(v) => [v, "Constituencies"]}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {riskChartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-3 pt-3 border-t border-slate-100">
            {riskChartData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
                <span className="text-[10px] font-mono text-slate-500 font-medium">{d.name}: <strong>{d.value}</strong></span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Risk Records */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Top Risk Records</h2>
            <button
              onClick={() => onNavigate("anomaly")}
              className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-semibold"
            >
              View All <ArrowRight size={11} />
            </button>
          </div>
          <div className="space-y-1">
            {topRecords.map((rec, i) => (
              <div
                key={rec.id || i}
                onClick={() => onNavigate("risk")}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors cursor-pointer"
                style={{ border: "1px solid transparent" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#F8FAFC", e.currentTarget.style.borderColor = "rgba(226,232,240,0.8)")}
                onMouseLeave={e => (e.currentTarget.style.background = "", e.currentTarget.style.borderColor = "transparent")}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{
                    background: i < 3 ? "linear-gradient(135deg,#dc2626,#b91c1c)" : "linear-gradient(135deg,#ea580c,#c2410c)",
                    boxShadow: i < 3 ? "0 2px 6px rgba(220,38,38,0.4)" : "0 2px 6px rgba(234,88,12,0.4)",
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-slate-800 truncate">{rec.hon_ble_members_of_parliaments}</div>
                  <div className="text-[10px] text-slate-400 font-mono truncate">{rec.constituency}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[13px] font-black font-mono text-slate-700">{rec.final_risk_score.toFixed(2)}</div>
                  <RiskBadge level={rec.final_risk_level} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Indicators + Events */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          {/* KPI grid */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Avg Risk Score",     value: avgScore,  unit: "/100",  delta: "Dataset statistical mean", bad: false },
              { label: "Avg Delay",          value: "87",      unit: " days", delta: "National MPLADS average", bad: false },
              { label: "Critical Outliers",  value: `${critical}`, unit: " MPs",  delta: "Top priority reviews", bad: true },
              { label: "High Risk Pool",     value: `${high}`, unit: " MPs",  delta: "Requires administrative review", bad: true },
              { label: "Medium Monitoring",  value: `${medium}`, unit: " MPs",  delta: "Routine operational monitoring", bad: false },
              { label: "Avg Utilization",    value: "70.2%",   unit: "",      delta: "Expenditure / Sanctioned", bad: false },
            ].map(({ label, value, unit, delta, bad }) => (
              <div
                key={label}
                className="rounded-xl p-4"
                style={{
                  background: bad
                    ? "linear-gradient(135deg,#fff7ed,#ffffff)"
                    : "linear-gradient(135deg,#f8fafc,#ffffff)",
                  border: bad ? "1px solid rgba(234,88,12,0.2)" : "1px solid rgba(226,232,240,0.8)",
                  boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 12px rgba(15,23,42,0.05), inset 0 1px 0 rgba(255,255,255,0.9)",
                }}
              >
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">{label}</div>
                <div className="text-2xl font-black font-mono text-slate-900">
                  {value}<span className="text-sm font-normal text-slate-400">{unit}</span>
                </div>
                <div className={`text-[10px] mt-1.5 font-medium ${bad ? "text-orange-600" : "text-slate-400"}`}>{delta}</div>
              </div>
            ))}
          </div>

          {/* Trend */}
          <Card className="p-5">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-slate-800">Risk Score Trend</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Average risk score trajectory over audit cycles</p>
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} domain={[35, 80]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.12)" }} />
                <Line type="monotone" dataKey="score" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 3.5, fill: "#2563EB", strokeWidth: 2, stroke: "white" }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Recent Events */}
        <Card className="p-5">
          <h2 className="text-sm font-bold text-slate-800 mb-3">Recent Risk Events</h2>
          <div className="space-y-2">
            {RECENT_EVENTS.map((evt, i) => {
              const Icon = evt.icon;
              return (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-lg"
                  style={{
                    background: evt.bg,
                    border: `1px solid ${evt.border}`,
                    boxShadow: "0 1px 3px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.7)",
                  }}
                >
                  <div
                    className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                    style={{ background: evt.dot, boxShadow: `0 2px 4px ${evt.dot}40` }}
                  >
                    <Icon size={11} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] leading-snug font-medium" style={{ color: evt.textC }}>{evt.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{evt.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
