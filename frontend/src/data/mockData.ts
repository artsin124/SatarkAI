export const RISK_COUNTS = {
  total: 544,
  low: 111,
  medium: 408,
  high: 22,
  critical: 3,
};

export const TOP_RISK_RECORDS = [
  { name: "Sanjay Uttamrao Deshmukh", constituency: "YAVATMAL-WASHIM", score: 88.10, level: "CRITICAL" },
  { name: "Appalanaidu Kalisetti", constituency: "VIZIANAGARAM", score: 79.08, level: "CRITICAL" },
  { name: "VISHAL", constituency: "SANGLI", score: 78.01, level: "CRITICAL" },
  { name: "Ramesh Bidhuri", constituency: "SOUTH DELHI", score: 67.40, level: "HIGH" },
  { name: "Kiran Maheshwari", constituency: "RAJSAMAND", score: 61.22, level: "HIGH" },
];

export const PROJECTS = [
  { id: "MPLADS-MH-001", title: "Rural Road Connectivity Phase II", district: "Yavatmal", category: "Roads & Bridges", sanctioned: 1850000, expenditure: 925000, utilization: 50, progress: 48, delay: 168, riskScore: 88.1, riskLevel: "CRITICAL", status: "Ongoing" },
  { id: "MPLADS-AP-002", title: "Drinking Water Supply Scheme", district: "Vizianagaram", category: "Drinking Water", sanctioned: 2200000, expenditure: 1540000, utilization: 70, progress: 65, delay: 132, riskScore: 79.08, riskLevel: "CRITICAL", status: "Ongoing" },
  { id: "MPLADS-MH-003", title: "Community Hall Construction", district: "Sangli", category: "Community Assets", sanctioned: 1500000, expenditure: 450000, utilization: 30, progress: 25, delay: 94, riskScore: 78.01, riskLevel: "CRITICAL", status: "Pending" },
  { id: "MPLADS-DL-004", title: "Street Lighting Installation", district: "South Delhi", category: "Electrification", sanctioned: 980000, expenditure: 720000, utilization: 73, progress: 71, delay: 45, riskScore: 67.40, riskLevel: "HIGH", status: "Ongoing" },
  { id: "MPLADS-RJ-005", title: "School Building Renovation", district: "Rajsamand", category: "Education", sanctioned: 1200000, expenditure: 900000, utilization: 75, progress: 72, delay: 38, riskScore: 61.22, riskLevel: "HIGH", status: "Ongoing" },
  { id: "MPLADS-GJ-006", title: "Anganwadi Centre Development", district: "Surat", category: "Health & Welfare", sanctioned: 650000, expenditure: 600000, utilization: 92, progress: 90, delay: 5, riskScore: 22.10, riskLevel: "LOW", status: "Completed" },
  { id: "MPLADS-KA-007", title: "Footpath & Drain Construction", district: "Belagavi", category: "Urban Dev", sanctioned: 870000, expenditure: 540000, utilization: 62, progress: 60, delay: 62, riskScore: 44.30, riskLevel: "MEDIUM", status: "Ongoing" },
  { id: "MPLADS-TN-008", title: "Solar Pumps for Agriculture", district: "Coimbatore", category: "Agriculture", sanctioned: 1100000, expenditure: 880000, utilization: 80, progress: 78, delay: 12, riskScore: 18.60, riskLevel: "LOW", status: "Completed" },
  { id: "MPLADS-WB-009", title: "Flood Protection Embankment", district: "Murshidabad", category: "Irrigation", sanctioned: 3200000, expenditure: 1600000, utilization: 50, progress: 42, delay: 88, riskScore: 55.70, riskLevel: "MEDIUM", status: "Ongoing" },
  { id: "MPLADS-MP-010", title: "Village Road Metalling", district: "Shivpuri", category: "Roads & Bridges", sanctioned: 750000, expenditure: 600000, utilization: 80, progress: 77, delay: 20, riskScore: 24.50, riskLevel: "LOW", status: "Ongoing" },
];

export const ANOMALIES = [
  { mp: "Sanjay Uttamrao Deshmukh", constituency: "YAVATMAL-WASHIM", score: 88.10, level: "CRITICAL", reason: "High cancellation & pending ratio", indicators: ["Cost Outlier", "High Cancellation", "High Pending Work"] },
  { mp: "Appalanaidu Kalisetti", constituency: "VIZIANAGARAM", score: 79.08, level: "CRITICAL", reason: "Unusual expenditure pattern", indicators: ["Cost Outlier", "High Delay"] },
  { mp: "VISHAL", constituency: "SANGLI", score: 78.01, level: "CRITICAL", reason: "High pending-work ratio with delay", indicators: ["High Pending Work", "High Delay", "Low Utilization"] },
  { mp: "Ramesh Bidhuri", constituency: "SOUTH DELHI", score: 67.40, level: "HIGH", reason: "Potential tender splitting detected", indicators: ["Tender Splitting", "Cost Outlier"] },
  { mp: "Kiran Maheshwari", constituency: "RAJSAMAND", score: 61.22, level: "HIGH", reason: "High delay with low utilization", indicators: ["High Delay", "Low Utilization"] },
  { mp: "Hemant Soren", constituency: "DUMKA", score: 58.90, level: "MEDIUM", reason: "Possible duplicate works identified", indicators: ["Duplicate Work"] },
  { mp: "Priya Sharma", constituency: "WARDHA", score: 47.30, level: "MEDIUM", reason: "Cost escalation above threshold", indicators: ["Cost Outlier"] },
  { mp: "Dilip Kumar", constituency: "PATNA SAHIB", score: 39.10, level: "MEDIUM", reason: "Pending work ratio above threshold", indicators: ["High Pending Work"] },
];

export const ALERTS = [
  { id: 1, severity: "CRITICAL", constituency: "YAVATMAL-WASHIM", reason: "High cancellation ratio detected — 50% of sanctioned works cancelled", score: 88.10, date: "2024-08-22", status: "Under Review", action: "Review" },
  { id: 2, severity: "CRITICAL", constituency: "VIZIANAGARAM", reason: "Potentially unusual expenditure pattern — cost outlier detected", score: 79.08, date: "2024-08-21", status: "New", action: "Review" },
  { id: 3, severity: "CRITICAL", constituency: "SANGLI", reason: "High pending-work ratio with extended implementation delay", score: 78.01, date: "2024-08-20", status: "New", action: "Review" },
  { id: 4, severity: "HIGH", constituency: "SOUTH DELHI", reason: "Potential tender splitting — multiple small works to same contractor", score: 67.40, date: "2024-08-19", status: "Under Review", action: "Review" },
  { id: 5, severity: "HIGH", constituency: "RAJSAMAND", reason: "Unusually high project delay: avg 38 days above normal", score: 61.22, date: "2024-08-18", status: "Verified", action: "Escalate" },
  { id: 6, severity: "MEDIUM", constituency: "DUMKA", reason: "Possible duplicate or overlapping works identified", score: 58.90, date: "2024-08-17", status: "New", action: "Review" },
  { id: 7, severity: "MEDIUM", constituency: "WARDHA", reason: "Project cost significantly above district average", score: 47.30, date: "2024-08-16", status: "Resolved", action: "Closed" },
];

export const CONTRACTORS = [
  { id: "CONT-999", name: "S.K. Infrastructure Pvt. Ltd.", projects: 18, totalValue: 27400000, avgDelay: 94, cancellationRate: 22, highRiskProjects: 5, anomalies: 3, riskLevel: "HIGH" },
  { id: "CONT-441", name: "Bharat Construction Co.", projects: 12, totalValue: 14800000, avgDelay: 47, cancellationRate: 8, highRiskProjects: 2, anomalies: 1, riskLevel: "MEDIUM" },
  { id: "CONT-213", name: "Janpath Builders Ltd.", projects: 24, totalValue: 36200000, avgDelay: 18, cancellationRate: 3, highRiskProjects: 0, anomalies: 0, riskLevel: "LOW" },
  { id: "CONT-567", name: "National Road Dev. Corp.", projects: 9, totalValue: 18900000, avgDelay: 112, cancellationRate: 33, highRiskProjects: 4, anomalies: 2, riskLevel: "CRITICAL" },
  { id: "CONT-788", name: "Sarvajan Civil Works", projects: 15, totalValue: 9800000, avgDelay: 31, cancellationRate: 6, highRiskProjects: 1, anomalies: 0, riskLevel: "LOW" },
];

export const CHAT_MESSAGES = [
  { role: "assistant", content: "Namaste. I am the Satark AI Intelligence Assistant. I can help you analyse risk patterns, investigate flagged records, and answer questions about MPLADS implementation data.\n\nWhat would you like to explore?", suggestions: ["Show all critical-risk constituencies", "Why is YAVATMAL-WASHIM critical?", "Highest cancellation ratios"] },
  { role: "user", content: "Why is YAVATMAL-WASHIM classified as critical?" },
  { role: "assistant", content: "YAVATMAL-WASHIM has been assigned a **Risk Score of 88.10 (CRITICAL)** based on the following detected risk indicators:\n\n**1. High Cancellation Ratio — 50.0%**\nHalf of all sanctioned works have been cancelled. This is significantly above the dataset average and warrants investigation into the reasons for cancellation.\n\n**2. High Pending-Work Ratio — 50.0%**\nA substantial proportion of works remain incomplete or pending, indicating potential implementation bottlenecks.\n\n**3. High Average Project Cost — ₹1,52,06,600**\nAverage project cost is an outlier relative to comparable constituencies, which may indicate cost inflation or scope expansion.\n\n**4. High Average Delay — 168 days**\nProjects are delayed by an average of 168 days, well above the expected completion timeline.\n\n> **Note:** These are potential risk indicators flagged by the system. They require review by authorized officials and do not constitute a finding of confirmed irregularity.", suggestions: ["Show YAVATMAL-WASHIM projects", "Compare with similar constituencies", "What action is recommended?"] },
];
