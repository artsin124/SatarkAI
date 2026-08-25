import { useState } from "react";
import { Search, AlertTriangle, Info } from "lucide-react";
import RiskBadge from "../components/RiskBadge";
import DevBanner from "../components/DevBanner";
import { CONTRACTORS } from "../data/mockData";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

export default function ContractorIntelligence() {
  const [selected, setSelected] = useState<typeof CONTRACTORS[0] | null>(null);

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Contractor Intelligence</h1>
        <p className="text-xs text-slate-500 mt-0.5">Identify potentially unusual contractor patterns — potential tender splitting, high-delay contractors, and risk concentrations.</p>
      </div>

      <DevBanner
        partial
        feature="Contractor intelligence and tender splitting analysis will be integrated with project-level tables in Phase 2. Below is a preview of the contractor risk profile interface."
        eta="Phase 2"
      />

      <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded p-3">
        <Info size={14} className="text-blue-600 mt-0.5 shrink-0" />
        <p className="text-[11px] text-blue-800">
          Contractor risk indicators are based on statistical analysis of project patterns. All flagged patterns are <em>potential anomalies</em> and require verification by authorized officials before action.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Table */}
        <div className="col-span-2 bg-white rounded border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs sticky-table">
              <thead>
                <tr className="border-b border-slate-200">
                  {["Contractor ID", "Name", "Projects", "Total Value", "Avg Delay", "Cancel Rate", "High Risk", "Anomalies", "Risk Level"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CONTRACTORS.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`cursor-pointer transition-colors ${selected?.id === c.id ? "bg-blue-50" : "hover:bg-slate-50"}`}
                  >
                    <td className="px-4 py-3 font-mono text-[11px] text-blue-700 font-medium">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.projects}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">₹{fmt(c.totalValue)}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.avgDelay}d</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{c.cancellationRate}%</td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${c.highRiskProjects > 3 ? "text-red-600" : c.highRiskProjects > 0 ? "text-orange-600" : "text-green-600"}`}>
                        {c.highRiskProjects}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-mono font-bold ${c.anomalies > 1 ? "text-red-600" : c.anomalies > 0 ? "text-orange-600" : "text-slate-400"}`}>
                        {c.anomalies}
                      </span>
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={c.riskLevel} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Profile panel */}
        <div className="bg-white rounded border border-slate-200 p-5">
          {selected ? (
            <div>
              <div className="pb-3 border-b border-slate-100 mb-4">
                <div className="text-[11px] font-mono text-slate-400 mb-1">{selected.id}</div>
                <h3 className="text-[13px] font-bold text-slate-800 leading-tight">{selected.name}</h3>
                <div className="mt-2"><RiskBadge level={selected.riskLevel} size="md" /></div>
              </div>

              <div className="space-y-3 mb-5">
                {[
                  { label: "Total Projects", value: selected.projects.toString() },
                  { label: "Total Project Value", value: `₹${fmt(selected.totalValue)}` },
                  { label: "Average Delay", value: `${selected.avgDelay} days` },
                  { label: "Cancellation Rate", value: `${selected.cancellationRate}%` },
                  { label: "High Risk Projects", value: selected.highRiskProjects.toString() },
                  { label: "Potential Anomalies", value: selected.anomalies.toString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between py-1.5 border-b border-slate-50">
                    <span className="text-[11px] text-slate-500">{label}</span>
                    <span className="text-[12px] font-mono font-semibold text-slate-800">{value}</span>
                  </div>
                ))}
              </div>

              {selected.anomalies > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3 mb-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={13} className="text-orange-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[11px] font-semibold text-orange-800">Potential Tender Splitting: {selected.anomalies}</p>
                      <p className="text-[10px] text-orange-700 mt-0.5">Multiple small-value works potentially awarded to same entity. Requires verification.</p>
                    </div>
                  </div>
                </div>
              )}

              <button className="w-full text-[11px] font-semibold bg-[#1B3A6B] hover:bg-[#112240] text-white py-2 rounded transition-colors">
                Full Contractor Report
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-16">
              <p className="text-xs">Select a contractor from the table to view their profile and risk indicators.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
