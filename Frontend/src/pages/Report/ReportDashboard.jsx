import React, { useState, useEffect } from "react";
import DashboardHeader from "../../component/DashboardHeader";
import DashboardLeftSide from "../Dashboard/DashboardLeftSide";
import axios from "axios";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://ai-powered-chat-application-production.up.railway.app");

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);

  const authUser = JSON.parse(localStorage.getItem("ChatApp"));
  const user = authUser?.user;
  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/report`, { withCredentials: true });
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
      await axios.delete(`${API_URL}/api/report/${reportId}`, { withCredentials: true });
      setReports(reports.filter(r => r._id !== reportId));
    } catch (err) {
      console.error("Error deleting report:", err);
    }
  };

  const downloadReport = async (reportId, filename) => {
    try {
      const response = await axios.get(`${API_URL}/api/report/${reportId}/download`, {
        withCredentials: true,
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const safeFilename = filename || 'Report';
      link.setAttribute('download', `Report_${safeFilename.split('/').pop()}_${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error downloading report:", err);
      alert("Failed to download report.");
    }
  };

  const openViewModal = (report) => {
    setAutoDownload(false);
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  const handleDirectDownload = (report) => {
    setAutoDownload(true);
    setSelectedReport(report);
    setIsViewModalOpen(true);
  };

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&family=Inter:wght@400;500;600&family=Material+Symbols+Outlined" rel="stylesheet" />

      <DashboardLeftSide />

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 sm:py-6 bg-background">
        <div className="max-w-[1400px] w-full mx-auto">
          <DashboardHeader user={user} />

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mt-6 sm:mt-8 mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
              <p className="text-[10px] sm:text-xs text-info font-bold tracking-widest mb-1 sm:mb-2">
                ANALYZER • REPORTS OVERVIEW
              </p>
              <h1 className="text-2xl sm:text-4xl font-[Manrope] font-extrabold text-text-primary">
                Reports Overview
              </h1>
              <p className="text-text-secondary text-xs sm:text-sm mt-1">
                Audit and performance metrics across your connected repositories.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-surface p-4 rounded-md border border-border-default mb-6">
            <div className="flex items-center gap-2 flex-1">
              <span className="material-symbols-outlined text-text-muted">search</span>
              <input
                placeholder="Search reports..."
                className="bg-transparent outline-none text-sm w-full text-text-primary placeholder:text-text-muted"
              />
            </div>
            <button className="flex items-center gap-1 bg-background border border-border-subtle px-3 py-2 rounded text-sm text-text-secondary hover:bg-hover-bg transition">
              <span className="material-symbols-outlined text-sm">tune</span>
              Status
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
              <p className="text-text-muted">Loading reports...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-card p-12 rounded-lg border border-border-subtle text-center">
              <span className="material-symbols-outlined text-5xl text-text-muted mb-4">analytics</span>
              <h3 className="text-xl font-bold text-text-primary">No Reports Yet</h3>
              <p className="text-text-secondary mt-2">Generate your first AI code audit from the Project view.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map((report) => (
                <ReportCard
                  key={report._id}
                  report={report}
                  onView={() => openViewModal(report)}
                  onDelete={() => deleteReport(report._id)}
                  onDownload={() => handleDirectDownload(report)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isViewModalOpen && selectedReport && (
        <ReportViewModal
          report={selectedReport}
          onClose={() => { setIsViewModalOpen(false); setAutoDownload(false); }}
          autoDownload={autoDownload}
        />
      )}
    </div>
  );
}

function ReportCard({ report, onView, onDelete, onDownload }) {
  const isCritical = report.riskLevel === "Critical" || report.healthScore < 50;
  const isHealthy = report.healthScore > 80;

  const borderColor = isCritical ? "border-error" : isHealthy ? "border-success" : "border-warning";
  const badgeColor = isCritical ? "text-error" : isHealthy ? "text-success" : "text-warning";
  const badgeText = isCritical ? "CRITICAL" : isHealthy ? "HEALTHY" : "STABLE";

  return (
    <div className={`bg-card p-5 sm:p-6 rounded-lg border-l-4 border-y border-r border-y-border-subtle border-r-border-subtle ${borderColor} hover:bg-hover-bg transition-colors group`}>
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 sm:gap-0">
        <div className="w-full sm:w-auto">
          <h3 className="font-bold text-lg text-text-primary">{report.title}</h3>
          <div className="text-text-secondary text-xs mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>{new Date(report.createdAt).toLocaleDateString()}</span>
            <span className="capitalize">{report.language}</span>
            <span className="text-text-muted italic truncate max-w-[200px] sm:max-w-none">{report.filename}</span>
          </div>
          <p className={`text-xs mt-3 sm:mt-4 font-semibold ${badgeColor}`}>
            {badgeText}
          </p>
        </div>

        <div className="text-left sm:text-right w-full sm:w-auto">
          <div className="flex sm:block items-center justify-between">
            <p className={`text-sm font-bold ${badgeColor}`}>
              Health: {report.healthScore}/100
            </p>
            <p className="text-xs text-text-muted sm:mt-0.5">{report.totalIssues} Issues Found</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-3 mt-5 sm:mt-3 w-full sm:w-auto sm:justify-end">
            <div className="flex items-center gap-6 sm:gap-3 w-full sm:w-auto justify-start">
              <button
                onClick={onDownload}
                className="text-text-secondary hover:text-primary text-sm sm:text-xs flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-base sm:text-sm">download</span>
                Download
              </button>
              <button
                onClick={onDelete}
                className="text-error/80 hover:text-error text-sm sm:text-xs flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-base sm:text-sm">delete</span>
                Delete
              </button>
            </div>
            <button
              onClick={onView}
              className="w-full sm:w-auto bg-primary-soft text-primary border border-primary/30 px-4 py-2.5 sm:py-2 rounded-lg sm:rounded text-sm sm:text-xs hover:bg-primary/20 transition-colors font-bold flex justify-center items-center"
            >
              View Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReportViewModal({ report, onClose, autoDownload = false }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const isCritical = report.riskLevel === "Critical" || report.healthScore < 50;
  const isHealthy = report.healthScore > 80;
  const statusText = isCritical ? "CRITICAL" : isHealthy ? "HEALTHY" : "STABLE";
  const statusColor = isCritical ? "text-error" : isHealthy ? "text-success" : "text-warning";
  const statusBg = isCritical ? "bg-error" : isHealthy ? "bg-success" : "bg-warning";

  const handleDownloadPDF = () => {
    window.print();
  };

  // Auto-trigger print when opened via card's Download button
  useEffect(() => {
    if (autoDownload) {
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [autoDownload]);

  // Health score ring
  const score = report.healthScore || 0;
  const circumference = 2 * Math.PI * 40;
  const dashOffset = circumference - (score / 100) * circumference;
  const ringColor = isCritical ? "#ef4444" : isHealthy ? "#22c55e" : "#f59e0b";

  return (
    <div id="report-modal-wrapper-outer" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm dark:bg-black/80">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #report-modal-wrapper, #report-modal-wrapper * { visibility: visible; }
          #report-modal-wrapper-outer {
            position: static !important; display: block !important;
            padding: 0 !important; background: none !important;
            -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
          }
          #report-modal-wrapper {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 100% !important; max-width: none !important; max-height: none !important;
            height: auto !important; overflow: visible !important; border-radius: 0 !important;
            box-shadow: none !important; border: none !important; display: block !important;
            margin: 0 !important;
          }
          #report-modal-scroll-container {
            overflow: visible !important; max-height: none !important;
            height: auto !important; flex: none !important;
          }
          .print-hide { display: none !important; }
          .print-show { display: flex !important; }
          .report-section-card, .severity-card { break-inside: avoid; }
        }
      `}</style>

      <div id="report-modal-wrapper" className="bg-background w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-xl sm:rounded-2xl border border-border-default shadow-popover flex flex-col">

        {/* ═══ MODAL HEADER (hidden in print) ═══ */}
        <div className="px-5 sm:px-8 py-4 sm:py-5 border-b border-border-subtle flex justify-between items-center bg-surface/80 backdrop-blur-sm print-hide">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full ${statusBg} animate-pulse`} />
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-text-primary truncate">{report.title}</h2>
              <p className="text-[10px] sm:text-xs text-text-muted truncate font-mono">{report.filename}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition shadow-sm"
              title="Save as PDF"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              <span className="hidden sm:inline">Save as PDF</span>
            </button>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-hover-bg transition">
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        </div>

        {/* ═══ SCROLLABLE CONTENT ═══ */}
        <div id="report-modal-scroll-container" className="flex-1 overflow-y-auto scrollbar-hide">

          {/* ───── HERO BANNER ───── */}
          <div className="relative px-5 sm:px-8 py-6 sm:py-8 bg-gradient-to-br from-primary/10 via-surface to-info/5 border-b border-border-subtle">
            {/* Print-only header */}
            <div className="hidden print-show items-center gap-2 mb-4">
              <span className="text-primary text-xl font-bold">DevCollab</span>
              <span className="text-text-muted text-xs">• AI Code Audit Report</span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8">
              {/* Health Score Ring */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="6" className="text-border-subtle" />
                  <circle
                    cx="50" cy="50" r="40" fill="none"
                    stroke={ringColor} strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className={`text-2xl font-extrabold ${statusColor}`}>{score}</span>
                  <span className="text-[9px] text-text-muted uppercase tracking-widest">Score</span>
                </div>
              </div>

              {/* Report Metadata */}
              <div className="flex-1 min-w-0 space-y-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary leading-tight">{report.title}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">folder</span>
                    {report.projectName || "N/A"}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">code</span>
                    <span className="capitalize">{report.language}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">calendar_today</span>
                    {new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-text-muted truncate max-w-full">{report.filename}</p>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <QuickStat icon="monitoring" label="Health" value={`${score}/100`} color={statusColor} />
              <QuickStat icon="verified" label="Status" value={statusText} color={statusColor} />
              <QuickStat icon="bug_report" label="Issues" value={report.totalIssues} />
              <QuickStat icon="warning" label="Risk" value={report.riskLevel || "N/A"} color={isCritical ? "text-error" : "text-text-primary"} />
            </div>
          </div>

          {/* ───── REPORT BODY ───── */}
          <div className="px-5 sm:px-8 py-6 sm:py-8 space-y-8">

            <Section icon="summarize" title="Executive Summary" content={report.executiveSummary} />
            <Section icon="code" title="Code Quality Overview" content={report.codeQualityOverview} />

            {/* Security & Performance side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ListSection title="Security Issues" items={report.securityIssues} icon="shield" iconColor="text-error" accentColor="border-error/30" />
              <ListSection title="Performance Concerns" items={report.performanceConcerns} icon="speed" iconColor="text-warning" accentColor="border-warning/30" />
            </div>

            <Section icon="build_circle" title="Maintainability Analysis" content={report.maintainabilityAnalysis} />

            {/* ─── BUG SEVERITY BREAKDOWN ─── */}
            <div className="report-section-card">
              <SectionHeader icon="bug_report" title="Bug Severity Breakdown" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                <SeverityCard label="Critical" count={report.bugSeverityBreakdown?.critical || 0} total={report.totalIssues} color="#ef4444" icon="error" />
                <SeverityCard label="High" count={report.bugSeverityBreakdown?.high || 0} total={report.totalIssues} color="#f59e0b" icon="warning" />
                <SeverityCard label="Medium" count={report.bugSeverityBreakdown?.medium || 0} total={report.totalIssues} color="#3b82f6" icon="info" />
                <SeverityCard label="Low" count={report.bugSeverityBreakdown?.low || 0} total={report.totalIssues} color="#22c55e" icon="check_circle" />
              </div>
            </div>

            <ListSection title="Suggested Fixes" items={report.suggestedFixes} icon="build" iconColor="text-primary" accentColor="border-primary/30" />
            <ListSection title="AI Recommendations" items={report.aiRecommendations} icon="lightbulb" iconColor="text-info" accentColor="border-info/30" />

            <Section icon="assessment" title="Final Risk Assessment" content={report.finalRiskAssessment} />

            {/* ─── FOOTER ─── */}
            <div className="pt-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-text-muted">
              <span>Generated by DevCollab AI Code Analyzer</span>
              <span>{new Date(report.createdAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HELPER COMPONENTS
   ═══════════════════════════════════════════ */

function QuickStat({ icon, label, value, color = "text-text-primary" }) {
  return (
    <div className="bg-surface/60 backdrop-blur-sm border border-border-subtle rounded-xl px-4 py-3 flex items-center gap-3">
      <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-text-muted uppercase tracking-wider font-medium">{label}</p>
        <p className={`text-sm font-bold truncate ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <h3 className="flex items-center gap-2.5 text-base sm:text-lg font-bold text-text-primary">
      <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary text-base">{icon}</span>
      </span>
      {title}
    </h3>
  );
}

function Section({ icon, title, content }) {
  return (
    <div className="report-section-card">
      <SectionHeader icon={icon} title={title} />
      <div className="mt-3 bg-surface/50 border border-border-subtle rounded-xl p-4 sm:p-5">
        <p className="text-text-secondary text-sm leading-relaxed whitespace-pre-line">
          {content || "No data available."}
        </p>
      </div>
    </div>
  );
}

function SeverityCard({ label, count, total, color, icon }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="severity-card bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg" style={{ color }}>{icon}</span>
          <span className="text-sm font-semibold text-text-primary">{label}</span>
        </div>
        <span className="text-xl font-extrabold text-text-primary">{count}</span>
      </div>
      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full bg-border-subtle overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] text-text-muted text-right">{pct}% of total</span>
    </div>
  );
}

function ListSection({ title, items, icon, iconColor = "text-primary", accentColor = "border-primary/30" }) {
  return (
    <div className="report-section-card">
      <SectionHeader icon={icon} title={title} />
      <ul className="mt-3 space-y-2">
        {items && items.length > 0 ? items.map((item, i) => (
          <li key={i} className={`flex gap-3 items-start text-sm text-text-secondary bg-surface/50 p-3.5 rounded-xl border-l-[3px] ${accentColor} border border-border-subtle`}>
            <span className={`${iconColor} text-xs mt-0.5 shrink-0`}>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        )) : (
          <li className="text-text-muted text-sm italic bg-surface/30 p-3 rounded-xl border border-border-subtle">
            None identified.
          </li>
        )}
      </ul>
    </div>
  );
}