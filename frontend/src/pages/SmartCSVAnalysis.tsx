import { useState } from "react";
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Layers,
  Sparkles,
  RefreshCw,
  Table,
  Cpu,
  Info,
  ShieldCheck,
  Check,
  RotateCcw,
} from "lucide-react";
import UploadDropzone from "../components/analysis/UploadDropzone";
import ColumnMappingReview from "../components/analysis/ColumnMappingReview";
import ModuleAvailabilityGrid from "../components/analysis/ModuleAvailabilityGrid";
import { api } from "../services/api";
import type { DatasetPreviewResponse, ColumnMappingResponse } from "../types/analysis";

const STEPS = [
  { id: 1, label: "Upload CSV" },
  { id: 2, label: "Dataset Preview" },
  { id: 3, label: "Column Mapping" },
  { id: 4, label: "Module Eligibility" },
  { id: 5, label: "Confirmation" },
];

export default function SmartCSVAnalysis() {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Active dataset state
  const [datasetData, setDatasetData] = useState<DatasetPreviewResponse | null>(null);
  const [currentMappings, setCurrentMappings] = useState<Record<string, string | null>>({});
  const [confirmedResponse, setConfirmedResponse] = useState<ColumnMappingResponse | null>(null);

  // Handle CSV file upload
  const handleFileUpload = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.uploadCSV(file);
      setDatasetData(res);
      const initialMap: Record<string, string | null> = {};
      res.column_mappings.forEach((m) => {
        initialMap[m.uploaded_column] = m.canonical_field;
      });
      setCurrentMappings(initialMap);
      setCurrentStep(2);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to upload and validate CSV file.");
    } finally {
      setLoading(false);
    }
  };

  // Handle mapping modification
  const handleMappingChange = (updated: Record<string, string | null>) => {
    setCurrentMappings(updated);
  };

  // Handle confirming mappings
  const handleConfirmMapping = async () => {
    if (!datasetData) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.submitColumnMapping(datasetData.analysis_id, currentMappings);
      setConfirmedResponse(res);
      setCurrentStep(5);
    } catch (err: any) {
      console.error("Mapping confirmation error:", err);
      setError(err.message || "Failed to confirm column mappings.");
    } finally {
      setLoading(false);
    }
  };

  // Reset workflow
  const handleStartNew = () => {
    setDatasetData(null);
    setCurrentMappings({});
    setConfirmedResponse(null);
    setCurrentStep(1);
    setError(null);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-semibold">
            <Sparkles size={12} className="text-blue-400" />
            <span>Intelligent MPLADS Ingestion Engine</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Smart CSV Analysis</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Upload any parliamentary constituency or project-level MPLADS CSV dataset. Satark AI
            automatically detects schema semantics, maps canonical features, and determines eligible
            governance analysis modules.
          </p>
        </div>

        {datasetData && (
          <button
            onClick={handleStartNew}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-sm border border-white/10 transition-all self-start sm:self-auto"
          >
            <RotateCcw size={14} />
            <span>Upload Another File</span>
          </button>
        )}
      </div>

      {/* Stepper Navigation */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STEPS.map((s) => {
            const isCompleted = currentStep > s.id;
            const isCurrent = currentStep === s.id;

            return (
              <div
                key={s.id}
                onClick={() => datasetData && s.id < currentStep && setCurrentStep(s.id)}
                className={`flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                  datasetData && s.id < currentStep ? "cursor-pointer hover:bg-slate-50" : ""
                } ${isCurrent ? "bg-blue-50/70 border border-blue-200" : ""}`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isCurrent
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check size={12} /> : s.id}
                </div>
                <span
                  className={`text-xs font-semibold truncate ${
                    isCurrent ? "text-blue-900" : isCompleted ? "text-slate-700" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="space-y-6">
        {/* STEP 1: Upload CSV */}
        {currentStep === 1 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <UploadDropzone onUpload={handleFileUpload} loading={loading} error={error} />
          </div>
        )}

        {/* STEP 2: Dataset Preview */}
        {currentStep === 2 && datasetData && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Table size={18} className="text-blue-600" />
                  <span>Dataset Preview & Schema Detection</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parsed {datasetData.total_rows} records from <span className="font-semibold text-slate-700">{datasetData.file_name}</span>.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                  {datasetData.dataset_type_label}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {(datasetData.file_size_bytes / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>

            {/* Table Preview */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner bg-slate-50/50">
              <div className="overflow-x-auto max-h-[400px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-sm border-b border-slate-200 z-10">
                    <tr>
                      <th className="py-2.5 px-3 font-bold text-slate-500 w-12 text-center">#</th>
                      {datasetData.headers.map((h) => (
                        <th key={h} className="py-2.5 px-3 font-bold text-slate-700 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/70 bg-white font-mono text-[11px]">
                    {datasetData.preview_rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/40 transition-colors">
                        <td className="py-2 px-3 text-slate-400 text-center font-sans font-bold">
                          {idx + 1}
                        </td>
                        {datasetData.headers.map((h) => (
                          <td key={h} className="py-2 px-3 text-slate-800 whitespace-nowrap">
                            {row[h] !== undefined && row[h] !== "" ? String(row[h]) : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:translate-x-0.5"
              >
                <span>Proceed to Column Mapping</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Column Mapping */}
        {currentStep === 3 && datasetData && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <ColumnMappingReview
              mappings={datasetData.column_mappings}
              onChange={handleMappingChange}
              onReset={() => {
                const initialMap: Record<string, string | null> = {};
                datasetData.column_mappings.forEach((m) => {
                  initialMap[m.uploaded_column] = m.canonical_field;
                });
                setCurrentMappings(initialMap);
              }}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(2)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <ArrowLeft size={14} /> Back to Preview
              </button>
              <button
                onClick={() => setCurrentStep(4)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:translate-x-0.5"
              >
                <span>Review Available Modules</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Module Eligibility */}
        {currentStep === 4 && datasetData && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Cpu size={18} className="text-blue-600" />
                  <span>Module Availability Report</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Based on your mapped columns, Satark AI has evaluated analytical module compatibility.
                </p>
              </div>
            </div>

            <ModuleAvailabilityGrid modules={datasetData.module_eligibility} />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(3)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
              >
                <ArrowLeft size={14} /> Back to Mapping
              </button>
              <button
                onClick={handleConfirmMapping}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
              >
                <CheckCircle2 size={16} />
                <span>{loading ? "Confirming..." : "Confirm Mapping & Prepare Dataset"}</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Confirmation & Ready State */}
        {currentStep === 5 && datasetData && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm space-y-8 text-center max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Dataset Ready for Analysis</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {confirmedResponse?.message || "Schema mapping is confirmed and stored in an isolated analysis partition."}
              </p>
            </div>

            {/* Summary Metadata Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Analysis Run ID</span>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {datasetData.analysis_id}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Dataset Classification</span>
                <span className="text-xs font-bold text-slate-800">
                  {confirmedResponse?.dataset_type_label || datasetData.dataset_type_label}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Total Records</span>
                <span className="text-xs font-bold text-slate-800">{datasetData.total_rows}</span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Valid Analyzable Rows</span>
                <span className="text-xs font-bold text-emerald-700">{datasetData.total_rows}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Available Modules</span>
                <span className="text-xs font-bold text-emerald-700">
                  {(confirmedResponse?.module_eligibility || datasetData.module_eligibility).filter((m) => m.is_available).length} Modules Ready
                </span>
              </div>
            </div>

            {/* Phase 3 Notice */}
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-left flex items-start gap-3">
              <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900 leading-relaxed">
                <span className="font-bold">Phase 1 & 2 Completed: </span>
                Dataset schema, column mappings, and module availability are saved. The batch execution engine (`POST /api/upload/&#123;analysis_id&#125;/analyze`) will be activated in Phase 3.
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleStartNew}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-md"
              >
                <RotateCcw size={14} />
                <span>Upload Another Dataset</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
