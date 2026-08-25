import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopNav from "./components/TopNav";
import Dashboard from "./pages/Dashboard";
import SmartCSVAnalysis from "./pages/SmartCSVAnalysis";
import ProjectMonitoring from "./pages/ProjectMonitoring";
import AnomalyDetection from "./pages/AnomalyDetection";
import RiskIntelligence from "./pages/RiskIntelligence";
import PredictiveAnalytics from "./pages/PredictiveAnalytics";
import GISRiskMap from "./pages/GISRiskMap";
import ContractorIntelligence from "./pages/ContractorIntelligence";
import FieldVerification from "./pages/FieldVerification";
import AlertsEarlyWarnings from "./pages/AlertsEarlyWarnings";
import AIAssistant from "./pages/AIAssistant";
import Administration from "./pages/Administration";

const PAGES: Record<string, React.ComponentType<any>> = {
  dashboard: Dashboard,
  "smart-analysis": SmartCSVAnalysis,
  projects: ProjectMonitoring,
  anomaly: AnomalyDetection,
  risk: RiskIntelligence,
  predictive: PredictiveAnalytics,
  gis: GISRiskMap,
  contractor: ContractorIntelligence,
  field: FieldVerification,
  alerts: AlertsEarlyWarnings,
  ai: AIAssistant,
  admin: Administration,
};

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);

  function handleNavigate(targetPage: string, recordId?: number) {
    if (recordId !== undefined) {
      setSelectedRecordId(recordId);
    }
    setPage(targetPage);
  }

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-[#F1F4F8]">
      <Sidebar active={page} onNavigate={(id) => handleNavigate(id)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopNav onNavigate={handleNavigate} />
        <main className="flex-1 overflow-y-auto">
          <PageComponent onNavigate={handleNavigate} selectedRecordId={selectedRecordId} />
        </main>
      </div>
    </div>
  );
}
