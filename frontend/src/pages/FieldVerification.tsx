import { useState } from "react";
import { MapPin, Camera, Upload, CheckCircle, Clock, FileText } from "lucide-react";
import DevBanner from "../components/DevBanner";

const TIMELINE = [
  { step: "Sanctioned",          date: "15 Jan 2024", done: true },
  { step: "Work Started",        date: "28 Feb 2024", done: true },
  { step: "Inspection Assigned", date: "10 Apr 2024", done: true },
  { step: "Evidence Uploaded",   date: "—",           done: false },
  { step: "Verified",            date: "—",           done: false },
  { step: "Closed",              date: "—",           done: false },
];

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl bg-white ${className}`}
      style={{ border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
      {children}
    </div>
  );
}

export default function FieldVerification() {
  const [inspectionStarted, setInspectionStarted] = useState(false);
  const [notes, setNotes] = useState("");

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Field Verification</h1>
          <p className="text-xs text-slate-500 mt-0.5">Document and track physical inspection progress for flagged MPLADS projects.</p>
        </div>
        <span className="dev-tag mt-1">Partial Implementation</span>
      </div>

      <DevBanner
        partial
        feature="Mobile app integration, GPS-verified photo uploads, offline inspection mode, and real-time sync with central database are under development. Web form submission and manual data entry are operational."
        eta="Q2 2025"
      />

      {/* Project card */}
      <Card className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-[10px] font-mono text-slate-400 mb-1">MPLADS-MH-001 · Rural Infrastructure</div>
            <h2 className="text-base font-bold text-slate-900">Rural Road Connectivity Phase II</h2>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
              <MapPin size={11} className="text-blue-600" />
              <span>Yavatmal District, Maharashtra</span>
              <span className="text-slate-200 mx-1">·</span>
              <span className="font-mono">GPS: 20.3974° N, 78.1320° E</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-lg"
              style={{ background: "#FFF7ED", color: "#9a3412", border: "1px solid #FED7AA", boxShadow: "0 1px 3px rgba(234,88,12,0.1), inset 0 1px 0 rgba(255,255,255,0.7)" }}>
              Inspection Pending
            </span>
            <div className="text-[11px] text-slate-400 mt-1.5">Risk Score: <span className="font-mono font-black text-red-600">88.10</span></div>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Sanctioned Cost", value: "₹18,50,000" },
            { label: "Expenditure", value: "₹9,25,000" },
            { label: "Physical Progress", value: "48%" },
            { label: "Expected Completion", value: "30 Jun 2024" },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-3"
              style={{ background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)", border: "1px solid rgba(226,232,240,0.7)", boxShadow: "inset 0 1px 3px rgba(15,23,42,0.04)" }}>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</div>
              <div className="text-sm font-black font-mono text-slate-800">{value}</div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Inspection Details</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Inspection Date", type: "date", placeholder: "" },
                { label: "Inspector Name", type: "text", placeholder: "Full name" },
              ].map(({ label, type, placeholder }) => (
                <div key={label}>
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder}
                    className="w-full text-xs rounded-lg px-3 py-2 outline-none transition-colors"
                    style={{ border: "1px solid rgba(226,232,240,0.8)", background: "#F8FAFC", boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)" }} />
                </div>
              ))}
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Physical Progress (%)</label>
                <input type="number" placeholder="0–100"
                  className="w-full text-xs rounded-lg px-3 py-2 outline-none"
                  style={{ border: "1px solid rgba(226,232,240,0.8)", background: "#F8FAFC", boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)" }} />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Asset Verification</label>
                <select className="w-full text-xs rounded-lg px-3 py-2 outline-none"
                  style={{ border: "1px solid rgba(226,232,240,0.8)", background: "#F8FAFC", boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)" }}>
                  <option>Select status</option>
                  <option>Asset Present &amp; As-Specified</option>
                  <option>Asset Present, Minor Deviations</option>
                  <option>Asset Present, Major Deviations</option>
                  <option>Asset Not Found</option>
                  <option>Work Not Started</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Inspection Notes</label>
              <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Record your observations about the physical state of the work, deviations from sanction, quality issues, or any irregularities observed..."
                className="w-full text-xs rounded-lg px-3 py-2 outline-none resize-none"
                style={{ border: "1px solid rgba(226,232,240,0.8)", background: "#F8FAFC", boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)" }} />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Photographic Evidence</h3>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-blue-300 transition-colors cursor-pointer"
              style={{ background: "linear-gradient(135deg,#F8FAFC,#F1F5F9)" }}>
              <Camera size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-slate-500 font-semibold">Drag &amp; drop photos or click to upload</p>
              <p className="text-[10px] text-slate-400 mt-1">Before, during, and after photos. Max 10 MB each.</p>
              <button className="mt-3 text-[11px] font-semibold rounded-lg px-3 py-1.5 transition-colors"
                style={{ color: "#1d4ed8", border: "1px solid rgba(147,197,253,0.6)", background: "#EFF6FF" }}>
                Select Files
              </button>
            </div>
          </Card>

          <div className="flex items-center gap-3">
            <button onClick={() => setInspectionStarted(true)}
              className="flex items-center gap-2 text-[12px] font-semibold px-5 py-2.5 rounded-lg transition-all"
              style={inspectionStarted ? {
                background: "linear-gradient(135deg,#16a34a,#15803d)",
                color: "white",
                border: "1px solid #15803d",
                boxShadow: "0 2px 8px rgba(22,163,74,0.35)",
              } : {
                background: "linear-gradient(135deg,#1e4080,#1B3A6B)",
                color: "white",
                border: "1px solid #1a3870",
                boxShadow: "0 2px 8px rgba(27,58,107,0.3)",
              }}>
              <CheckCircle size={14} />
              {inspectionStarted ? "Inspection In Progress" : "Start Inspection"}
            </button>
            <button className="flex items-center gap-2 text-[12px] font-semibold px-5 py-2.5 rounded-lg transition-colors"
              style={{ border: "1px solid rgba(226,232,240,0.8)", background: "#F8FAFC", color: "#475569", boxShadow: "0 1px 3px rgba(15,23,42,0.06)" }}>
              <Upload size={14} /> Upload Evidence
            </button>
            <button className="flex items-center gap-2 text-[12px] font-semibold px-5 py-2.5 rounded-lg ml-auto text-white"
              style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", border: "1px solid #15803d", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
              <FileText size={14} /> Submit Verification
            </button>
          </div>
        </div>

        <Card className="p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Verification Timeline</h3>
          <div className="space-y-0">
            {TIMELINE.map((t, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={t.done ? { borderColor: "#16a34a", background: "#f0fdf4", boxShadow: "0 2px 6px rgba(22,163,74,0.2)" } : { borderColor: "#e2e8f0", background: "white" }}>
                    {t.done ? <CheckCircle size={12} className="text-green-600" /> : <Clock size={12} className="text-slate-300" />}
                  </div>
                  {i < TIMELINE.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[28px]" style={{ background: t.done ? "#bbf7d0" : "#f1f5f9" }} />
                  )}
                </div>
                <div className="pb-4 pt-0.5">
                  <div className={`text-[12px] font-semibold ${t.done ? "text-slate-800" : "text-slate-400"}`}>{t.step}</div>
                  <div className={`text-[10px] font-mono ${t.done ? "text-green-600" : "text-slate-300"}`}>{t.date}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
