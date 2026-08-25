import { useState, useEffect } from "react";
import {
  LayoutDashboard, FolderKanban, AlertTriangle, Brain, TrendingUp, Map,
  HardHat, ClipboardCheck, Bell, Bot, Settings, HelpCircle, User,
  ChevronRight, FlaskConical, FileSpreadsheet,
} from "lucide-react";
import satarkLogo from "@/imports/2275511f-1ecf-4070-a0f9-0f0d3ab302f1.png";
import { api } from "../services/api";

const NAV_ITEMS = [
  { id: "dashboard",      label: "Dashboard",               icon: LayoutDashboard, dev: false },
  { id: "smart-analysis", label: "Smart CSV Analysis",      icon: FileSpreadsheet, dev: false },
  { id: "projects",       label: "Project Monitoring",      icon: FolderKanban,    dev: false },
  { id: "anomaly",        label: "Anomaly Detection",       icon: AlertTriangle,   dev: false },
  { id: "risk",           label: "Risk Intelligence",       icon: Brain,           dev: false },
  { id: "predictive",     label: "Predictive Analytics",    icon: TrendingUp,      dev: true  },
  { id: "gis",            label: "GIS Risk Map",            icon: Map,             dev: true  },
  { id: "contractor",     label: "Contractor Intelligence", icon: HardHat,         dev: false },
  { id: "field",          label: "Field Verification",      icon: ClipboardCheck,  dev: true  },
  { id: "alerts",         label: "Alerts & Warnings",       icon: Bell,            dev: false },
  { id: "ai",             label: "AI Assistant",            icon: Bot,             dev: true  },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
}

export default function Sidebar({ active, onNavigate }: SidebarProps) {
  const [criticalCount, setCriticalCount] = useState<number>(3);

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await api.getStatistics();
        setCriticalCount(stats.critical_count);
      } catch (e) {
        console.warn("Could not fetch stats for Sidebar badge:", e);
      }
    }
    loadStats();
  }, []);
  return (
    <aside
      className="flex flex-col h-screen w-60 text-white shrink-0 sidebar-bg shadow-sidebar"
      style={{ zIndex: 40, position: "relative" }}
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.12)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
            }}
          >
            <img src={satarkLogo} alt="Satark AI logo" className="w-9 h-9 object-contain" />
          </div>
          <div>
            <div className="flex items-baseline gap-1 leading-none">
              <span className="text-[16px] font-black tracking-wide text-white">SATARK</span>
              <span className="text-[16px] font-black tracking-wide text-orange-400">AI</span>
            </div>
            <div className="text-[9px] text-slate-400 mt-1 font-medium tracking-wide">सतर्क नजर, बेहतर भारत</div>
          </div>
        </div>
        <p className="text-[9px] text-slate-500 leading-tight mt-2.5 pl-0.5">
          AI-Powered MPLADS Monitoring & Risk Detection
        </p>
      </div>

      {/* Section label */}
      <div className="px-4 pt-4 pb-1">
        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-[0.16em]">Navigation</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto pb-2">
        {NAV_ITEMS.map(({ id, label, icon: Icon, dev }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate(id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-[12px] transition-all duration-150 group"
              style={isActive ? {
                background: "linear-gradient(135deg, rgba(37,99,235,0.9) 0%, rgba(29,78,216,0.95) 100%)",
                boxShadow: "0 2px 8px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
                color: "white",
              } : undefined}
            >
              <Icon size={14} className={`shrink-0 ${isActive ? "text-blue-200" : "text-slate-500 group-hover:text-slate-300"}`} />
              <span className={`flex-1 font-medium ${isActive ? "text-white" : "text-slate-400 group-hover:text-white"}`}>
                {label}
              </span>
              {dev && (
                <FlaskConical size={10} className={isActive ? "text-blue-300" : "text-amber-500"} />
              )}
              {id === "alerts" && (
                <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full font-mono shrink-0"
                  style={{ boxShadow: "0 1px 4px rgba(220,38,38,0.5)" }}>{criticalCount}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Dev legend */}
      <div className="px-4 py-2 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-600">
          <FlaskConical size={9} className="text-amber-500" />
          <span>Icon = feature in development</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/[0.07] px-2 py-2 space-y-0.5">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 transition-colors">
          <Settings size={14} /> Settings
        </button>
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300 transition-colors">
          <HelpCircle size={14} /> Help
        </button>
        <div
          className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg cursor-pointer hover:bg-white/[0.06] transition-colors"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)", boxShadow: "0 2px 6px rgba(37,99,235,0.4)" }}
          >
            <User size={12} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-semibold text-slate-300 truncate">Nodal Officer</div>
            <div className="text-[9px] text-slate-600 truncate">Ministry of Statistics</div>
          </div>
          <ChevronRight size={12} className="text-slate-600" />
        </div>
      </div>
    </aside>
  );
}
