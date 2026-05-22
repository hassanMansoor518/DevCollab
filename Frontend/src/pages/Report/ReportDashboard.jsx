import React, { useState, useEffect } from "react";
import DashboardHeader from "../../component/DashboardHeader";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import axios from "axios";

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

   const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const user = authUser?.user;
  const token = authUser?.token;
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3001/api/report", { withCredentials: true });
      setReports(response.data.reports || []);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/report/${reportId}`, { withCredentials: true });
      setReports(reports.filter(r => r._id !== reportId));
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  const downloadReport = async (reportId, filename) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/report/${reportId}/download`, {
        withCredentials: true,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Report_${filename.split('/').pop()}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report.");
    }
  };

  const openViewModal = (report) => {
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-[#0B1220] text-white font-[Inter] overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined" rel="stylesheet" />

      <DashboardLeftSide />

      <div className="flex-1 overflow-y-auto px-8 py-6 bg-[#0B1220]">
        <DashboardHeader user={user} />

        <div className="flex justify-between items-end mt-8 mb-8">
          <div>
            <p className="text-xs text-blue-400 tracking-widest mb-2">
              ANALYZER • REPORTS OVERVIEW
            </p>
            <h1 className="text-4xl font-[Manrope] font-extrabold">
              Reports Overview
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Audit and performance metrics across your connected repositories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-[#0e1625] p-4 rounded-md border border-[#1f2a44] mb-6">
          <div className="flex items-center gap-2 flex-1">
            <span className="material-symbols-outlined text-gray-400">search</span>
            <input
              placeholder="Search reports..."
              className="bg-transparent outline-none text-sm w-full"
            />
          </div>
          <button className="flex items-center gap-1 bg-[#0b1220] px-3 py-2 rounded text-sm text-gray-300">
            <span className="material-symbols-outlined text-sm">tune</span>
            Status
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-gray-400">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="bg-[#0B1220] p-12 rounded-lg border border-[#1f2a44] text-center">
            <span className="material-symbols-outlined text-5xl text-gray-600 mb-4">analytics</span>
            <h3 className="text-xl font-bold">No Reports Yet</h3>
            <p className="text-gray-400 mt-2">Generate your first AI code audit from the Project view.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onView={() => openViewModal(report)}
                onDelete={() => deleteReport(report._id)}
                onDownload={() => downloadReport(report._id, report.filename)}
              />
            ))}
          </div>
        )}
      </div>

      {isViewModalOpen && selectedReport && (
        <ReportViewModal
          report={selectedReport}
          onClose={() => setIsViewModalOpen(false)}
          onDownload={() => downloadReport(selectedReport._id, selectedReport.filename)}
        />
      )}
    </div>
  );
}

function ReportCard({ report, onView, onDelete, onDownload }) {
  const isCritical = report.riskLevel === "Critical" || report.healthScore < 50;
  const isHealthy = report.healthScore > 80;

  const borderColor = isCritical ? "border-red-500" : isHealthy ? "border-[#00e5ff]" : "border-yellow-500";
  const badgeColor = isCritical ? "text-red-400" : isHealthy ? "text-[#00e5ff]" : "text-yellow-400";
  const badgeText = isCritical ? "CRITICAL" : isHealthy ? "HEALTHY" : "STABLE";

  return (
    <div className={`bg-[#0e1625] p-6 rounded-lg border-l-4 ${borderColor} hover:bg-[#121b2d] transition-colors group`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{report.title}</h3>
          <div className="text-gray-400 text-xs mt-1 flex gap-4">
            <span>{new Date(report.createdAt).toLocaleString()}</span>
            <span>{report.language}</span>
            <span className="text-gray-500 italic">{report.filename}</span>
          </div>
          <p className={`text-xs mt-3 font-semibold ${badgeColor}`}>
            {badgeText}
          </p>
        </div>

        <div className="text-right">
          <p className={`text-sm font-bold ${badgeColor}`}>
            Health: {report.healthScore}/100
          </p>
          <p className="text-xs text-gray-400">{report.totalIssues} Issues Found</p>

          <div className="flex gap-3 mt-3 justify-end">
            <button
              onClick={onDownload}
              className="text-gray-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download
            </button>
            <button
              onClick={onDelete}
              className="text-red-400/70 hover:text-red-400 text-xs flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
              Delete
            </button>
            <button
              onClick={onView}
              className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded text-xs hover:bg-indigo-600/40 transition-colors"
            >
              View Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportViewModal({ report, onClose, onDownload }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b1220] w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/10 shadow-2xl flex flex-col">
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#0e1625]">
          <div>
            <h2 className="text-xl font-bold">{report.title}</h2>
            <p className="text-xs text-gray-400">{report.filename}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDownload}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-xs font-semibold transition"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* MODAL CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide">

          {/* TOP GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatBox label="Project" value={report.projectName || "N/A"} />
            <StatBox label="Health Score" value={`${report.healthScore}/100`} color={report.healthScore > 80 ? "text-green-400" : "text-red-400"} />
            <StatBox label="Risk Level" value={report.riskLevel} color={report.riskLevel === "Critical" ? "text-red-400" : "text-yellow-400"} />
            <StatBox label="Total Issues" value={report.totalIssues} />
          </div>

          <Section title="Executive Summary" content={report.executiveSummary} />
          <Section title="Code Quality Overview" content={report.codeQualityOverview} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <ListSection title="Security Issues" items={report.securityIssues} icon="shield" iconColor="text-red-400" />
            <ListSection title="Performance Concerns" items={report.performanceConcerns} icon="speed" iconColor="text-yellow-400" />
          </div>

          <Section title="Maintainability Analysis" content={report.maintainabilityAnalysis} />

          {/* BUG BREAKDOWN */}
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-indigo-400">bug_report</span>
              Bug Severity Breakdown
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <SeverityBox label="Critical" count={report.bugSeverityBreakdown.critical} color="bg-red-500" />
              <SeverityBox label="High" count={report.bugSeverityBreakdown.high} color="bg-orange-500" />
              <SeverityBox label="Medium" count={report.bugSeverityBreakdown.medium} color="bg-yellow-500" />
              <SeverityBox label="Low" count={report.bugSeverityBreakdown.low} color="bg-blue-500" />
            </div>
          </div>

          <ListSection title="Suggested Fixes" items={report.suggestedFixes} icon="build" />
          <ListSection title="AI Recommendations" items={report.aiRecommendations} icon="lightbulb" />

          <Section title="Final Risk Assessment" content={report.finalRiskAssessment} />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color = "text-white" }) {
  return (
    <div className="bg-[#0e1625] p-4 rounded-xl border border-white/5">
      <p className="text-gray-500 text-xs uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  );
}

function SeverityBox({ label, count, color }) {
  return (
    <div className="bg-[#0e1625] p-3 rounded-lg border border-white/5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-xs text-gray-400">{label}</span>
      </div>
      <span className="font-bold">{count}</span>
    </div>
  );
}

function Section({ title, content }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
        <span className="material-symbols-outlined text-indigo-400">segment</span>
        {title}
      </h3>
      <p className="text-gray-300 text-sm leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
        {content || "No data available."}
      </p>
    </div>
  );
}

function ListSection({ title, items, icon, iconColor = "text-indigo-400" }) {
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
        <span className={`material-symbols-outlined ${iconColor}`}>{icon}</span>
        {title}
      </h3>
      <ul className="space-y-2">
        {items && items.length > 0 ? items.map((item, i) => (
          <li key={i} className="flex gap-3 text-sm text-gray-300 bg-white/5 p-3 rounded-lg border border-white/5">
            <span className="text-indigo-400 font-bold">•</span>
            {item}
          </li>
        )) : (
          <li className="text-gray-500 text-sm italic">None identified.</li>
        )}
      </ul>
    </div>
  );
}