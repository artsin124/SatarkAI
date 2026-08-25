import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, TrendingUp, Clock } from "lucide-react";
import DevBanner from "../components/DevBanner";

const PREDICTION_CARDS = [
  { label: "Delay Risk",           value: 82, color: "#DC2626", bg: "linear-gradient(135deg,#fef2f2,#ffffff)", border: "rgba(220,38,38,0.2)",  bar: "#DC2626", icon: Clock },
  { label: "Implementation Risk",  value: 78, color: "#EA580C", bg: "linear-gradient(135deg,#fff7ed,#ffffff)", border: "rgba(234,88,12,0.2)",  bar: "#EA580C", icon: AlertTriangle },
  { label: "Cost Overrun Risk",    value: 71, color: "#D97706", bg: "linear-gradient(135deg,#fffbeb,#ffffff)", border: "rgba(217,119,6,0.2)",  bar: "#D97706", icon: TrendingUp },
  { label: "Low Utilization Risk", value: 64, color: "#CA8A04", bg: "linear-gradient(135deg,#fefce8,#ffffff)", border: "rgba(202,138,4,0.2)",  bar: "#CA8A04", icon: TrendingUp },
];

const trendData = [
  { month: "Jan", critical: 1, high: 14 }, { month: "Feb", critical: 1, high: 16 },
  { month: "Mar", critical: 2, high: 18 }, { month: "Apr", critical: 2, high: 19 },
  { month: "May", critical: 3, high: 20 }, { month: "Jun", critical: 3, high: 21 },
  { month: "Jul", critical: 3, high: 22 }, { month: "Aug", critical: 3, high: 22 },
];

const AT_RISK = [
  { name: "Sanjay Uttamrao Deshmukh", constituency: "YAVATMAL-WASHIM", risk: "HIGH", prediction: "Escalation to Critical within 30 days" },
  { name: "Appalanaidu Kalisetti",     constituency: "VIZIANAGARAM",    risk: "HIGH", prediction: "Project delay likely by Q4" },
  { name: "VISHAL",                    constituency: "SANGLI",           risk: "HIGH", prediction: "Utilization shortfall risk in 45 days" },
  { name: "Ramesh Bidhuri",            constituency: "SOUTH DELHI",     risk: "MEDIUM", prediction: "Cost escalation if delays persist" },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white ${className}`}
      style={{ border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
      {children}
    </div>
  );
}

export default function PredictiveAnalytics() {
  return (
    <div className="p-6 space-y-5 max-w-screen-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Predictive Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">Forecast emerging project risks before they escalate to critical levels.</p>
        </div>
        <span className="dev-tag mt-1">Development Phase</span>
      </div>

      <DevBanner
        feature="Predictive models are under active development. Probability estimates shown are prototype illustrations based on current dataset statistical patterns — not live model outputs."
        eta="Q2 2025"
      />

      <DevBanner
        partial
        feature="Risk trend chart and early warning list use static prototype data. Real-time trajectory modeling, historical MPLADS data ingestion, and ML forecasting pipeline are not yet deployed."
        eta="Q3 2025"
      />

      {/* Prediction cards */}
      <div className="grid grid-cols-4 gap-3">
        {PREDICTION_CARDS.map(({ label, value, color, bg, border, bar, icon: Icon }) => (
          <div key={label} className="rounded-xl p-5"
            style={{ background: bg, border: `1px solid ${border}`, boxShadow: `0 1px 2px rgba(15,23,42,0.06), 0 4px 12px ${color}14, inset 0 1px 0 rgba(255,255,255,0.8)` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-600">{label}</span>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: color, boxShadow: `0 2px 6px ${color}40` }}>
                <Icon size={12} className="text-white" />
              </div>
            </div>
            <div className="text-4xl font-black font-mono" style={{ color }}>{value}%</div>
            <div className="mt-3 rounded-full h-1.5 overflow-hidden"
              style={{ background: "rgba(15,23,42,0.08)", boxShadow: "inset 0 1px 2px rgba(0,0,0,0.08)" }}>
              <div className="h-1.5 rounded-full" style={{ width: `${value}%`, background: bar }} />
            </div>
            <div className="text-[10px] text-slate-400 mt-2 italic">Prototype estimate — not a live model output</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-0.5">Risk Level Trend</h3>
          <p className="text-[11px] text-slate-400 mb-4">High and Critical risk record trajectory — prototype illustration</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid #e2e8f0", boxShadow: "0 4px 16px rgba(15,23,42,0.12)" }} />
              <Area type="monotone" dataKey="high" stroke="#EA580C" fill="#FFF7ED" strokeWidth={2} name="High Risk" />
              <Area type="monotone" dataKey="critical" stroke="#DC2626" fill="#FEF2F2" strokeWidth={2} name="Critical Risk" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Early Warning — Escalation Risk</h3>
          <div className="space-y-2">
            {AT_RISK.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg"
                style={{ background: r.risk === "HIGH" ? "#FFF7ED" : "#FFFBEB", border: `1px solid ${r.risk === "HIGH" ? "#FED7AA" : "#FDE68A"}`, boxShadow: "0 1px 3px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
                <div className="mt-1 w-2 h-2 rounded-full shrink-0" style={{ background: r.risk === "HIGH" ? "#EA580C" : "#D97706", boxShadow: `0 0 4px ${r.risk === "HIGH" ? "#EA580C" : "#D97706"}80` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-slate-800 truncate">{r.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{r.constituency}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{r.prediction}</div>
                </div>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: r.risk === "HIGH" ? "#FED7AA" : "#FDE68A", color: r.risk === "HIGH" ? "#9a3412" : "#78350f", border: `1px solid ${r.risk === "HIGH" ? "#ea580c30" : "#d9770630"}` }}>
                  {r.risk}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-3 italic">Prototype indicators only. Requires authorized review before action.</p>
        </Card>
      </div>
    </div>
  );
}
