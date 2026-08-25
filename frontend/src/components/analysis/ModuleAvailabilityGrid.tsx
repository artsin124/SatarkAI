import { CheckCircle2, AlertTriangle, XCircle, Brain, FolderKanban, ShieldCheck, Activity } from "lucide-react";
import type { ModuleEligibilityItem } from "../../types/analysis";

interface ModuleAvailabilityGridProps {
  modules: ModuleEligibilityItem[];
}

export default function ModuleAvailabilityGrid({ modules }: ModuleAvailabilityGridProps) {
  const mpModules = modules.filter((m) => m.target_type === "MP_CONSTITUENCY");
  const projectModules = modules.filter((m) => m.target_type === "PROJECT");

  const renderModuleCard = (m: ModuleEligibilityItem) => {
    const isAvailable = m.status === "AVAILABLE";
    const isPartial = m.status === "PARTIALLY_AVAILABLE";

    return (
      <div
        key={m.module_id}
        className={`p-4 rounded-xl border transition-all ${
          isAvailable
            ? "bg-white border-emerald-200/90 shadow-sm shadow-emerald-500/5 hover:border-emerald-300"
            : isPartial
            ? "bg-amber-50/40 border-amber-200/80 shadow-sm shadow-amber-500/5"
            : "bg-slate-50/60 border-slate-200 text-slate-400 opacity-80"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                isAvailable
                  ? "bg-emerald-100 text-emerald-700"
                  : isPartial
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {isAvailable ? (
                <CheckCircle2 size={16} />
              ) : isPartial ? (
                <AlertTriangle size={16} />
              ) : (
                <XCircle size={16} />
              )}
            </div>
            <div className="min-w-0">
              <h5
                className={`text-xs font-bold truncate ${
                  isAvailable
                    ? "text-slate-800"
                    : isPartial
                    ? "text-amber-900"
                    : "text-slate-500"
                }`}
              >
                {m.module_name}
              </h5>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                {m.description}
              </p>
            </div>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 uppercase tracking-wider ${
              isAvailable
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : isPartial
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-slate-100 text-slate-500 border border-slate-200"
            }`}
          >
            {isAvailable ? "✓ Available" : isPartial ? "⚠️ Partial" : "✕ Unavailable"}
          </span>
        </div>

        {/* Missing fields warning or details */}
        {m.status_reason && (
          <div
            className={`mt-3 pt-2.5 border-t text-[11px] font-medium flex items-center gap-1.5 ${
              isPartial
                ? "border-amber-200 text-amber-800"
                : "border-slate-200 text-slate-500"
            }`}
          >
            <span className="font-semibold">Requirement Note:</span>
            <span>{m.status_reason}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* MP Constituency Group */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Brain size={16} className="text-blue-600" />
          <span>MP & Parliamentary Constituency Analysis Modules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mpModules.map(renderModuleCard)}
        </div>
      </div>

      {/* Project Group */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <FolderKanban size={16} className="text-indigo-600" />
          <span>Project-Level Implementation Intelligence Modules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {projectModules.map(renderModuleCard)}
        </div>
      </div>
    </div>
  );
}
