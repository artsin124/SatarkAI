import { useState } from "react";
import { ArrowRight, Check, AlertTriangle, HelpCircle, RefreshCw } from "lucide-react";
import type { ColumnMappingItem } from "../../types/analysis";

interface ColumnMappingReviewProps {
  mappings: ColumnMappingItem[];
  onChange: (updatedMappings: Record<string, string | null>) => void;
  onReset: () => void;
}

const CANONICAL_OPTIONS = [
  { group: "MP & Constituency Fields", options: [
    { value: "mp_name", label: "MP Name (hon_ble_members_of_parliaments)" },
    { value: "constituency", label: "Constituency Name" },
    { value: "utilization", label: "Fund Utilization (%)" },
    { value: "pending_ratio", label: "Pending Work Ratio (%)" },
    { value: "cancelled_ratio", label: "Cancellation Ratio (%)" },
    { value: "average_project_cost", label: "Average Project Cost (₹)" },
    { value: "average_delay_days", label: "Average Delay (Days)" },
  ]},
  { group: "Project Implementation Fields", options: [
    { value: "project_id", label: "Project ID / Work Code" },
    { value: "project_title", label: "Project Title / Description" },
    { value: "category", label: "Category / Sector" },
    { value: "sanctioned_cost", label: "Sanctioned Cost (₹)" },
    { value: "district", label: "District" },
    { value: "contractor_id", label: "Contractor / Agency" },
    { value: "sanction_date", label: "Sanction Date" },
  ]},
];

export default function ColumnMappingReview({ mappings, onChange, onReset }: ColumnMappingReviewProps) {
  const [currentMap, setCurrentMap] = useState<Record<string, string | null>>(() => {
    const initial: Record<string, string | null> = {};
    mappings.forEach((m) => {
      initial[m.uploaded_column] = m.canonical_field;
    });
    return initial;
  });

  const handleSelectChange = (uploadedCol: string, val: string) => {
    const updated = {
      ...currentMap,
      [uploadedCol]: val === "" ? null : val,
    };
    setCurrentMap(updated);
    onChange(updated);
  };

  const getConfidenceBadge = (tier: string, score: number) => {
    if (tier === "HIGH") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check size={10} /> High ({(score * 100).toFixed(0)}%)
        </span>
      );
    }
    if (tier === "MEDIUM") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle size={10} /> Medium ({(score * 100).toFixed(0)}%)
        </span>
      );
    }
    if (tier === "LOW") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
          Low ({(score * 100).toFixed(0)}%)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
        Unmapped
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-slate-800">Smart Column Mapping Review</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify automated field associations. You can reassign or ignore any column below.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
        >
          <RefreshCw size={12} />
          <span>Reset to Auto-Detect</span>
        </button>
      </div>

      <div className="border border-slate-200/80 rounded-xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Uploaded CSV Column</th>
                <th className="py-3 px-4">Sample Values</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4 w-6"></th>
                <th className="py-3 px-4">Satark AI Canonical Field</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mappings.map((m) => {
                const selectedVal = currentMap[m.uploaded_column] ?? "";
                const isMapped = Boolean(selectedVal);

                return (
                  <tr
                    key={m.uploaded_column}
                    className={`hover:bg-slate-50/70 transition-colors ${
                      isMapped ? "bg-white" : "bg-slate-50/30 text-slate-400"
                    }`}
                  >
                    {/* Uploaded Header */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800 font-mono text-[12px]">
                        {m.uploaded_column}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {m.data_type}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {m.non_empty_count} values ({m.null_count} nulls)
                        </span>
                      </div>
                    </td>

                    {/* Sample Values */}
                    <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                      {m.sample_values.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {m.sample_values.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-mono truncate max-w-[140px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No samples</span>
                      )}
                    </td>

                    {/* Confidence Score */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getConfidenceBadge(m.confidence_tier, m.confidence)}
                    </td>

                    {/* Arrow */}
                    <td className="py-3 px-2 text-slate-400 text-center">
                      <ArrowRight size={14} />
                    </td>

                    {/* Canonical Dropdown */}
                    <td className="py-3 px-4 min-w-[240px]">
                      <select
                        value={selectedVal}
                        onChange={(e) => handleSelectChange(m.uploaded_column, e.target.value)}
                        className={`w-full text-xs font-semibold py-1.5 px-3 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                          isMapped
                            ? "border-blue-300 bg-blue-50/30 text-blue-900 font-bold"
                            : "border-slate-300 bg-white text-slate-500"
                        }`}
                      >
                        <option value="">-- Ignore / Do Not Map --</option>
                        {CANONICAL_OPTIONS.map((grp) => (
                          <optgroup key={grp.group} label={grp.group}>
                            {grp.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
