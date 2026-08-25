import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function UploadDropzone({ onUpload, loading, error }: UploadDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith(".csv")) {
        setSelectedFile(file);
        await onUpload(file);
      }
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      await onUpload(file);
    }
  };

  const loadSampleCSV = async (type: "mp" | "project") => {
    let content = "";
    let name = "";
    if (type === "mp") {
      name = "sample_mp_constituency_data.csv";
      content =
        "MP_Name,Constituency,Utilisation,Pending %,Cancelled %,Avg Cost,Avg Delay\n" +
        "Sanjay Deshmukh,YAVATMAL-WASHIM,52.5,48.0,45.2,₹18,500,000,165\n" +
        "Appalanaidu,VIZIANAGARAM,68.0,38.5,12.0,₹9,200,000,128\n" +
        "Vishal Patil,SANGLI,35.0,42.0,20.5,₹5,400,000,95\n" +
        "Dr. Sharma,NAGPUR,82.0,15.0,4.0,₹3,200,000,35\n" +
        "S. Verma,WARDHA,74.5,22.0,8.0,₹4,100,000,42\n";
    } else {
      name = "sample_project_implementation_data.csv";
      content =
        "Work_Code,Project_Title,Category,Sanctioned_Amount,District,Contractor,Sanction_Date\n" +
        "PRJ-001,Construction of Concrete CC Road Ward 4,Roads,₹18,50,000,Yavatmal,M/s SK Infra,2024-01-15\n" +
        "PRJ-002,Community Hall & Library Facility,Community Assets,₹12,00,000,Sangli,Bharat Builders,2024-02-10\n" +
        "PRJ-003,Drinking Water Pipeline Extension,Water Supply,₹9,80,000,Yavatmal,M/s SK Infra,2024-02-18\n" +
        "PRJ-004,Solar High Mast Lighting Installation,Energy,₹9,95,000,Yavatmal,M/s SK Infra,2024-02-25\n";
    }

    const blob = new Blob([content], { type: "text/csv" });
    const file = new File([blob], name, { type: "text/csv" });
    setSelectedFile(file);
    await onUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
          dragOver
            ? "border-blue-500 bg-blue-50/50 shadow-lg scale-[1.005]"
            : "border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50"
        } ${loading ? "pointer-events-none opacity-80" : ""}`}
        style={{
          boxShadow: dragOver
            ? "0 8px 30px rgba(37,99,235,0.12)"
            : "0 2px 12px rgba(0,0,0,0.04)",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
          disabled={loading}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25">
            {loading ? (
              <Loader2 size={30} className="animate-spin" />
            ) : (
              <UploadCloud size={32} />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800">
              {loading
                ? "Analyzing and Detecting Schema..."
                : selectedFile
                ? `Uploaded: ${selectedFile.name}`
                : "Drop your MPLADS CSV file here"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {loading
                ? "Reading headers, evaluating delimiters, and running smart column mapping..."
                : "Drag & drop or click to browse. Max file size 25 MB (.csv only)"}
            </p>
          </div>

          {!loading && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
              <FileSpreadsheet size={14} className="text-blue-600" />
              <span>Browse Computer</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 text-xs">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
          <div className="flex-1">
            <span className="font-semibold">Upload Validation Failed: </span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Quick Load Sample Datasets */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Sparkles size={14} className="text-amber-500" />
            <span>Try with Sample MPLADS Datasets</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Quick Demonstration</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => loadSampleCSV("mp")}
            className="flex items-start gap-3 p-3 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">
                Sample MP / Constituency Dataset
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                5 MPs with utilization, pending, cancellation ratios & delay
              </div>
            </div>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => loadSampleCSV("project")}
            className="flex items-start gap-3 p-3 bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">
                Sample Project Implementation Dataset
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Work orders, contractors, cost amounts & sanction dates
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
