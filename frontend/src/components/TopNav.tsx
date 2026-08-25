import { useState, useEffect, useRef } from "react";
import { Search, Bell, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { api } from "../services/api";
import RiskBadge from "./RiskBadge";
import type { AnomalyRecord } from "../types/api";

interface TopNavProps {
  onNavigate: (id: string, recordId?: number) => void;
}

export default function TopNav({ onNavigate }: TopNavProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnomalyRecord[]>([]);
  const [searching, setSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [criticalCount, setCriticalCount] = useState<number>(3);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await api.getStatistics();
        setCriticalCount(stats.critical_count);
      } catch (err) {
        console.warn("Could not fetch stats for TopNav badge:", err);
      }
    }
    loadStats();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.searchAnomalies(query.trim());
        setResults(res.data);
        setIsOpen(true);
      } catch (err) {
        console.error("Search error in TopNav:", err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside listener to close search dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className="h-13 flex items-center px-5 gap-4 shrink-0"
      style={{
        height: "52px",
        background: "rgba(255,255,255,0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(226,232,240,0.7)",
        boxShadow: "0 1px 3px rgba(15,23,42,0.06), 0 4px 12px rgba(15,23,42,0.04)",
        zIndex: 30,
        position: "relative",
      }}
    >
      {/* Search Bar with Autocomplete Dropdown */}
      <div ref={searchRef} className="relative flex-1 max-w-sm">
        <div
          className="flex items-center gap-2 rounded-lg px-3 py-1.5"
          style={{
            background: "#F1F5F9",
            border: "1px solid rgba(226,232,240,0.8)",
            boxShadow: "inset 0 1px 3px rgba(15,23,42,0.06)",
          }}
        >
          {searching ? (
            <Loader2 size={13} className="text-blue-600 animate-spin shrink-0" />
          ) : (
            <Search size={13} className="text-slate-400 shrink-0" />
          )}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (results.length > 0) setIsOpen(true);
            }}
            placeholder="Search MPs or constituencies..."
            className="bg-transparent text-xs text-slate-700 placeholder-slate-400 outline-none w-full"
          />
        </div>

        {/* Dropdown Results */}
        {isOpen && (
          <div
            className="absolute top-full left-0 mt-1 w-full bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-80 overflow-y-auto"
            style={{ boxShadow: "0 10px 25px -5px rgba(15,23,42,0.15)" }}
          >
            {results.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching records found for "{query}".
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                <div className="px-3 py-2 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Found {results.length} Matching Constituencies
                </div>
                {results.slice(0, 8).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setIsOpen(false);
                      setQuery("");
                      onNavigate("risk", r.id);
                    }}
                    className="p-3 hover:bg-blue-50/60 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {r.hon_ble_members_of_parliaments}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">
                        {r.constituency}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-700">
                        {r.final_risk_score.toFixed(1)}
                      </span>
                      <RiskBadge level={r.final_risk_level} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1" />

      {/* Data status */}
      <div
        className="flex items-center gap-1.5 text-[11px] rounded-lg px-3 py-1.5"
        style={{
          background: "#F8FAFC",
          border: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <RefreshCw size={11} className="text-green-500" />
        <span className="text-slate-400">
          Connected: <span className="text-slate-600 font-semibold">FastAPI Live Backend (544 MPs)</span>
        </span>
      </div>

      {/* Role */}
      <div
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-slate-50 transition-colors"
        style={{
          border: "1px solid rgba(226,232,240,0.8)",
          boxShadow: "0 1px 2px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.8)",
        }}
      >
        <div className="w-1.5 h-1.5 rounded-full bg-green-500" style={{ boxShadow: "0 0 4px rgba(22,163,74,0.6)" }} />
        <span className="text-[11px] text-slate-600 font-semibold">Nodal Officer</span>
        <ChevronDown size={11} className="text-slate-400" />
      </div>

      {/* Alerts */}
      <button
        onClick={() => onNavigate("alerts")}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
        style={{ border: "1px solid rgba(226,232,240,0.6)", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
      >
        <Bell size={15} className="text-slate-500" />
        <span
          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full text-[8px] text-white flex items-center justify-center font-bold font-mono"
          style={{ background: "linear-gradient(135deg,#ef4444,#dc2626)", boxShadow: "0 1px 4px rgba(220,38,38,0.5)" }}
        >
          {criticalCount}
        </span>
      </button>
    </header>
  );
}
