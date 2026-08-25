import { useState } from "react";
import { MapPin, Layers, ArrowRight } from "lucide-react";
import DevBanner from "../components/DevBanner";

const DISTRICTS = [
  { id: "yavatmal",     name: "Yavatmal",     state: "Maharashtra",  total: 42, high: 4, critical: 1, avgDelay: 132, avgScore: 62.4, level: "CRITICAL", x: 38, y: 52 },
  { id: "vizianagaram", name: "Vizianagaram", state: "Andhra Pradesh", total: 28, high: 3, critical: 1, avgDelay: 98,  avgScore: 58.2, level: "CRITICAL", x: 62, y: 58 },
  { id: "sangli",       name: "Sangli",       state: "Maharashtra",  total: 35, high: 2, critical: 1, avgDelay: 88,  avgScore: 54.1, level: "HIGH",     x: 32, y: 60 },
  { id: "south-delhi",  name: "South Delhi",  state: "Delhi",        total: 18, high: 3, critical: 0, avgDelay: 45,  avgScore: 48.3, level: "HIGH",     x: 46, y: 28 },
  { id: "rajsamand",    name: "Rajsamand",    state: "Rajasthan",    total: 22, high: 2, critical: 0, avgDelay: 38,  avgScore: 42.1, level: "HIGH",     x: 32, y: 35 },
  { id: "dumka",        name: "Dumka",        state: "Jharkhand",    total: 19, high: 1, critical: 0, avgDelay: 55,  avgScore: 38.9, level: "MEDIUM",   x: 65, y: 38 },
  { id: "coimbatore",   name: "Coimbatore",   state: "Tamil Nadu",   total: 31, high: 0, critical: 0, avgDelay: 12,  avgScore: 18.6, level: "LOW",      x: 42, y: 76 },
  { id: "surat",        name: "Surat",        state: "Gujarat",      total: 24, high: 0, critical: 0, avgDelay: 8,   avgScore: 16.2, level: "LOW",      x: 26, y: 50 },
  { id: "shivpuri",     name: "Shivpuri",     state: "M.P.",         total: 16, high: 0, critical: 0, avgDelay: 20,  avgScore: 22.3, level: "LOW",      x: 48, y: 38 },
  { id: "murshidabad",  name: "Murshidabad",  state: "West Bengal",  total: 20, high: 1, critical: 0, avgDelay: 88,  avgScore: 45.0, level: "MEDIUM",   x: 72, y: 38 },
];

const LEVEL_COLORS: Record<string, string> = {
  CRITICAL: "#DC2626", HIGH: "#EA580C", MEDIUM: "#D97706", LOW: "#16A34A",
};

const LAYER_OPTS = ["Risk", "Delay", "Utilization", "Cost", "Pending", "Cancellation"];

export default function GISRiskMap() {
  const [selected, setSelected] = useState<typeof DISTRICTS[0] | null>(DISTRICTS[0]);
  const [layer, setLayer] = useState("Risk");

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Geospatial Risk Intelligence</h1>
          <p className="text-xs text-slate-500 mt-0.5">District-level risk mapping across MPLADS implementation indicators.</p>
        </div>
        <span className="dev-tag mt-1">Development Phase</span>
      </div>

      <DevBanner
        feature="GIS map is a prototype SVG illustration. Full interactive India map with real district boundaries (GeoJSON), live project pin clustering, heatmap overlays, and satellite imagery integration are under development."
        eta="Q3 2025"
      />

      <div className="grid grid-cols-4 gap-4" style={{ height: 560 }}>
        {/* Map panel */}
        <div
          className="col-span-3 rounded-xl overflow-hidden relative"
          style={{
            border: "1px solid rgba(226,232,240,0.8)",
            boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)",
            background: "white",
          }}
        >
          {/* Layer controls */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
            {LAYER_OPTS.map(l => (
              <button key={l} onClick={() => setLayer(l)}
                className="text-[10px] font-bold font-mono px-3 py-1.5 rounded-lg border transition-all duration-150"
                style={layer === l ? {
                  background: "linear-gradient(135deg,#1e4080,#1B3A6B)",
                  color: "white",
                  border: "1px solid #1a3870",
                  boxShadow: "0 2px 8px rgba(27,58,107,0.35)",
                } : {
                  background: "rgba(255,255,255,0.88)",
                  backdropFilter: "blur(8px)",
                  color: "#475569",
                  border: "1px solid rgba(226,232,240,0.8)",
                  boxShadow: "0 1px 3px rgba(15,23,42,0.06)",
                }}
              >{l.toUpperCase()}</button>
            ))}
          </div>

          {/* Active layer indicator */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-lg px-3 py-1.5"
            style={{ background: "rgba(27,58,107,0.92)", backdropFilter: "blur(8px)", boxShadow: "0 2px 8px rgba(27,58,107,0.3)", color: "white" }}>
            <Layers size={11} />
            <span className="text-[10px] font-mono font-bold">{layer} Layer</span>
          </div>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 z-10 rounded-xl p-3"
            style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)", border: "1px solid rgba(226,232,240,0.7)", boxShadow: "0 4px 16px rgba(15,23,42,0.10)" }}>
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Risk Level</div>
            {Object.entries(LEVEL_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: color, boxShadow: `0 1px 4px ${color}60` }} />
                <span className="text-[10px] font-mono font-medium text-slate-600">{level}</span>
              </div>
            ))}
          </div>

          {/* SVG Map */}
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ background: "linear-gradient(180deg,#EEF4FB 0%,#E8F0F9 100%)" }}>
            <path d="M22 10 L45 8 L62 12 L78 18 L82 30 L80 40 L75 42 L78 50 L70 60 L68 70 L62 78 L55 85 L48 88 L42 82 L36 72 L30 60 L24 52 L20 42 L18 30 Z"
              fill="#D6E4F0" stroke="#B8CDE0" strokeWidth="0.5" />
            <path d="M22 10 L45 8 M45 8 L62 12 M38 35 L58 30 M35 50 L60 48" stroke="#C0D5E8" strokeWidth="0.3" fill="none" />
            <ellipse cx="72" cy="33" rx="4" ry="7" fill="#BCDAF0" opacity="0.7" />
            {DISTRICTS.map(d => {
              const isSelected = selected?.id === d.id;
              const color = LEVEL_COLORS[d.level];
              return (
                <g key={d.id} onClick={() => setSelected(d)} style={{ cursor: "pointer" }}>
                  {isSelected && (
                    <circle cx={d.x} cy={d.y} r={7} fill={color} opacity={0.15} />
                  )}
                  <circle cx={d.x} cy={d.y} r={isSelected ? 4 : 2.8} fill={color}
                    stroke="white" strokeWidth={isSelected ? 1.5 : 1} opacity={0.95} />
                  {isSelected && (
                    <text x={d.x + 5.5} y={d.y + 1.2} fontSize="2.8" fill="#0F172A"
                      fontFamily="Inter" fontWeight="700">{d.name}</text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="absolute bottom-4 right-4 text-[9px] text-slate-400 font-mono">
            Prototype SVG map — not actual district boundaries
          </div>
        </div>

        {/* Side Panel */}
        <div className="rounded-xl bg-white p-5 flex flex-col"
          style={{ border: "1px solid rgba(226,232,240,0.8)", boxShadow: "0 1px 2px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)" }}>
          {selected ? (
            <>
              <div className="pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <MapPin size={12} className="text-blue-600 shrink-0" />
                  <h3 className="text-sm font-bold text-slate-800">{selected.name}</h3>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">{selected.state}</p>
                <div className="mt-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded"
                    style={{ background: LEVEL_COLORS[selected.level] + "18", color: LEVEL_COLORS[selected.level], border: `1px solid ${LEVEL_COLORS[selected.level]}35` }}>
                    {selected.level}
                  </span>
                </div>
              </div>

              <div className="space-y-2.5 flex-1">
                {[
                  { label: "Total Projects",    value: selected.total.toString(),           flag: false },
                  { label: "High Risk Projects", value: selected.high.toString(),           flag: selected.high > 2 },
                  { label: "Critical Projects",  value: selected.critical.toString(),       flag: selected.critical > 0 },
                  { label: "Avg Delay",          value: `${selected.avgDelay} days`,        flag: selected.avgDelay > 60 },
                  { label: "Avg Risk Score",     value: selected.avgScore.toFixed(1),       flag: selected.avgScore > 40 },
                ].map(({ label, value, flag }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <span className="text-[11px] text-slate-500">{label}</span>
                    <span className={`text-[12px] font-mono font-bold ${flag ? "text-orange-600" : "text-slate-800"}`}>{value}</span>
                  </div>
                ))}
              </div>

              <button className="mt-4 w-full flex items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-semibold text-white transition-all duration-150 btn-primary">
                View District Details <ArrowRight size={12} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
              <MapPin size={28} className="mb-2 opacity-30" />
              <p className="text-xs">Click a district marker to view details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
