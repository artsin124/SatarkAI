import { useState } from "react";
import { Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import DevBanner from "../components/DevBanner";
import { PROJECTS } from "../data/mockData";

const CATEGORIES = ["All Categories", "Roads & Bridges", "Drinking Water", "Community Assets", "Electrification", "Education", "Health & Welfare", "Urban Dev", "Agriculture", "Irrigation"];
const RISK_LEVELS = ["All Risk Levels", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const STATUSES = ["All Statuses", "Ongoing", "Completed", "Pending"];

export default function ProjectMonitoring() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [riskLevel, setRiskLevel] = useState("All Risk Levels");
  const [status, setStatus] = useState("All Statuses");
  const [sortKey, setSortKey] = useState<string>("riskScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const filtered = PROJECTS.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.district.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All Categories" || p.category === category;
    const matchRisk = riskLevel === "All Risk Levels" || p.riskLevel === riskLevel;
    const matchStatus = status === "All Statuses" || p.status === status;
    return matchSearch && matchCat && matchRisk && matchStatus;
  }).sort((a, b) => {
    const av = (a as any)[sortKey];
    const bv = (b as any)[sortKey];
    return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  function sort(key: string) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortIcon({ col }: { col: string }) {
    if (sortKey !== col) return <ChevronUp size={11} className="text-slate-300" />;
    return sortDir === "asc" ? <ChevronUp size={11} className="text-blue-600" /> : <ChevronDown size={11} className="text-blue-600" />;
  }

  const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Project Monitoring</h1>
        <p className="text-xs text-slate-500 mt-0.5">Track implementation status, financial utilization and risk indicators across all MPLADS projects.</p>
      </div>

      <DevBanner
        partial
        feature="Project-level anomaly analysis (semantic duplicate works, tender splitting, and cost outlier detection) is planned for the next integration phase. Below is a preview of the project tracking interface."
        eta="Phase 2"
      />

      {/* Filters */}
      <div className="bg-white rounded border border-slate-200 p-3 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-3 py-1.5 flex-1 min-w-48">
          <Search size={13} className="text-slate-400 shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search projects, districts..." className="bg-transparent text-xs text-slate-600 placeholder-slate-400 outline-none w-full" />
        </div>
        {[
          { label: "Category", value: category, options: CATEGORIES, onChange: setCategory },
          { label: "Risk Level", value: riskLevel, options: RISK_LEVELS, onChange: setRiskLevel },
          { label: "Status", value: status, options: STATUSES, onChange: setStatus },
        ].map(({ label, value, options, onChange }) => (
          <select key={label} value={value} onChange={e => { onChange(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white text-slate-600 outline-none cursor-pointer">
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        ))}
        <div className="ml-auto text-[11px] text-slate-400 font-mono">{filtered.length} records</div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sticky-table">
            <thead>
              <tr className="border-b border-slate-200">
                {[
                  { key: "id", label: "Project ID" },
                  { key: "title", label: "Project Title" },
                  { key: "district", label: "District" },
                  { key: "category", label: "Category" },
                  { key: "sanctioned", label: "Sanctioned (₹)" },
                  { key: "expenditure", label: "Expenditure (₹)" },
                  { key: "utilization", label: "Util %" },
                  { key: "progress", label: "Progress" },
                  { key: "delay", label: "Delay (days)" },
                  { key: "riskScore", label: "Risk Score" },
                  { key: "riskLevel", label: "Risk Level" },
                ].map(({ key, label }) => (
                  <th key={key} onClick={() => sort(key)} className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-slate-700">
                    <span className="flex items-center gap-1">{label} <SortIcon col={key} /></span>
                  </th>
                ))}
                <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-blue-700 font-medium whitespace-nowrap">{p.id}</td>
                  <td className="px-4 py-3 text-slate-800 font-medium max-w-[180px] truncate">{p.title}</td>
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{p.district}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{p.category}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">₹{fmt(p.sanctioned)}</td>
                  <td className="px-4 py-3 font-mono text-slate-700 whitespace-nowrap">₹{fmt(p.expenditure)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${p.utilization}%` }} />
                      </div>
                      <span className="font-mono text-slate-600">{p.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${p.progress}%` }} />
                      </div>
                      <span className="font-mono text-slate-600">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-600">{p.delay}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-slate-800">{p.riskScore.toFixed(2)}</td>
                  <td className="px-4 py-3"><RiskBadge level={p.riskLevel} size="sm" /></td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-[11px] text-blue-600 hover:text-blue-700 font-medium border border-blue-200 hover:border-blue-300 rounded px-2 py-0.5 transition-colors">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-[11px] text-slate-400 font-mono">
            Showing {Math.min((page - 1) * PER_PAGE + 1, filtered.length)}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)} className={`w-6 h-6 rounded text-[11px] font-mono font-medium transition-colors ${page === n ? "bg-blue-600 text-white" : "hover:bg-slate-200 text-slate-600"}`}>{n}</button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
