import { useState } from "react";
import { Check, X } from "lucide-react";

const ROLES = [
  { name: "MP", desc: "Member of Parliament", perms: { view: true, export: false, flag: false, manage: false, admin: false } },
  { name: "District Authority", desc: "District Implementation Officer", perms: { view: true, export: true, flag: true, manage: false, admin: false } },
  { name: "State Nodal Authority", desc: "State-level coordinator", perms: { view: true, export: true, flag: true, manage: true, admin: false } },
  { name: "Implementing Agency", desc: "Project executing agency", perms: { view: true, export: false, flag: false, manage: false, admin: false } },
  { name: "Ministry (MoSPI)", desc: "Central oversight authority", perms: { view: true, export: true, flag: true, manage: true, admin: true } },
];

const USERS = [
  { name: "Nodal Officer", email: "nodal@mospi.gov.in", role: "Ministry (MoSPI)", status: "Active", last: "Today" },
  { name: "District Collector", email: "dc.yavatmal@maha.gov.in", role: "District Authority", status: "Active", last: "2d ago" },
  { name: "State Coordinator", email: "state.coord@maha.gov.in", role: "State Nodal Authority", status: "Active", last: "1d ago" },
  { name: "Field Officer", email: "field01@mospi.gov.in", role: "Implementing Agency", status: "Inactive", last: "5d ago" },
];

const TABS = ["Users", "Roles", "Data Sources", "System Health", "Audit Log"];

export default function Administration() {
  const [tab, setTab] = useState("Users");

  return (
    <div className="p-6 space-y-4 max-w-screen-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Administration</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage users, roles, data sources, and system configuration.</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded text-[11px] font-semibold transition-colors ${tab === t ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Users" && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-800">System Users</h3>
            <button className="text-[11px] font-semibold bg-[#1B3A6B] text-white px-3 py-1.5 rounded hover:bg-[#112240] transition-colors">+ Add User</button>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              {["Name", "Email", "Role", "Status", "Last Active", "Action"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {USERS.map((u, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                  <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">{u.email}</td>
                  <td className="px-4 py-3 text-slate-600">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${u.status === "Active" ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{u.last}</td>
                  <td className="px-4 py-3">
                    <button className="text-[11px] text-blue-600 border border-blue-200 hover:border-blue-400 rounded px-2 py-0.5">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Roles" && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">Role Permissions Matrix</h3>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-50">
              <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              {["View Data", "Export", "Flag Records", "Manage Projects", "Admin Access"].map(p => (
                <th key={p} className="text-center px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">{p}</th>
              ))}
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {ROLES.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{r.name}</div>
                    <div className="text-[10px] text-slate-400">{r.desc}</div>
                  </td>
                  {Object.values(r.perms).map((has, pi) => (
                    <td key={pi} className="text-center px-4 py-3">
                      {has ? <Check size={14} className="text-green-600 mx-auto" /> : <X size={14} className="text-slate-200 mx-auto" />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Data Sources" && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: "MPLADS Portal (MoSPI)", status: "Connected", records: "544", updated: "2024-08-22", color: "green" },
            { name: "State Treasury Integration", status: "Pending Configuration", records: "—", updated: "—", color: "amber" },
            { name: "PFMS (Public Financial Mgmt)", status: "Connected", records: "512", updated: "2024-08-20", color: "green" },
            { name: "GeM Portal", status: "Disconnected", records: "—", updated: "—", color: "red" },
          ].map((ds, i) => (
            <div key={i} className={`bg-white rounded border-l-4 border border-slate-200 p-5 ${ds.color === "green" ? "border-l-green-500" : ds.color === "amber" ? "border-l-amber-500" : "border-l-red-500"}`}>
              <h4 className="text-[13px] font-semibold text-slate-800">{ds.name}</h4>
              <div className="mt-2 space-y-1">
                <div className="flex gap-2"><span className="text-[11px] text-slate-400">Status:</span><span className={`text-[11px] font-medium ${ds.color === "green" ? "text-green-600" : ds.color === "amber" ? "text-amber-600" : "text-red-600"}`}>{ds.status}</span></div>
                <div className="flex gap-2"><span className="text-[11px] text-slate-400">Records:</span><span className="text-[11px] font-mono text-slate-700">{ds.records}</span></div>
                <div className="flex gap-2"><span className="text-[11px] text-slate-400">Last Sync:</span><span className="text-[11px] font-mono text-slate-700">{ds.updated}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "System Health" && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "API Response Time", value: "142ms", status: "Normal" },
            { label: "Database Load", value: "23%", status: "Normal" },
            { label: "ML Model Status", value: "Active", status: "Normal" },
            { label: "Data Pipeline", value: "Running", status: "Normal" },
            { label: "Alert Engine", value: "Running", status: "Normal" },
            { label: "Last Model Retrain", value: "7 days ago", status: "Due Soon" },
          ].map(({ label, value, status }) => (
            <div key={label} className="bg-white rounded border border-slate-200 p-4">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">{label}</div>
              <div className="text-xl font-bold font-mono text-slate-800">{value}</div>
              <div className={`text-[10px] mt-1 font-medium ${status === "Normal" ? "text-green-600" : "text-amber-600"}`}>{status}</div>
            </div>
          ))}
        </div>
      )}

      {tab === "Audit Log" && (
        <div className="bg-white rounded border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-800">System Audit Log</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {[
              { action: "Risk analysis run", user: "System", time: "2024-08-22 09:30", detail: "544 records analyzed" },
              { action: "Alert created", user: "System", time: "2024-08-22 09:31", detail: "CRITICAL alert — YAVATMAL-WASHIM" },
              { action: "Record reviewed", user: "Nodal Officer", time: "2024-08-22 10:15", detail: "YAVATMAL-WASHIM marked Under Review" },
              { action: "Export generated", user: "State Coordinator", time: "2024-08-21 15:42", detail: "Risk report — Maharashtra" },
              { action: "User login", user: "District Collector", time: "2024-08-21 09:08", detail: "Login from 10.0.1.42" },
            ].map((log, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <div className="font-mono text-[10px] text-slate-400 w-36 shrink-0">{log.time}</div>
                <div className="flex-1">
                  <span className="text-[12px] font-medium text-slate-800">{log.action}</span>
                  <span className="text-[11px] text-slate-400 ml-2">— {log.detail}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-500">{log.user}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
