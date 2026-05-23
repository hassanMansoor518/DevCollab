import React, { useState } from 'react';
import axios from 'axios';

function AiAnalysis({ result, onApplyFix, projectId, filename, language, code }) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportStatus, setReportStatus] = useState(null);

    if (!result) return null;

    const { healthScore, complexity, maintainability, issues = [], suggestions = [] } = result;

    const circumference = 28 * 2 * Math.PI;
    const strokeDashoffset = circumference - (healthScore / 100) * circumference;

    const handleGenerateReport = async () => {
        if (!projectId) {
            alert("Project context missing. Cannot generate report.");
            return;
        }

        setIsGenerating(true);
        setReportStatus(null);

        try {
            const response = await axios.post(
                `/api/report/${projectId}/generate`,
                {
                    filename,
                    language,
                    code,
                    analysisResult: result
                },
                { withCredentials: true }
            );

            setReportStatus({ success: true, message: "Report saved to dashboard!" });
            alert("Professional report generated and saved to Dashboard!");
        } catch (err) {
            console.error("Report Generation Error:", err);
            setReportStatus({ success: false, message: err.response?.data?.message || "Failed to generate report" });
            alert("Failed to generate report. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

            {/* HEALTH SCORE */}
            <div>
                <div className="flex items-center justify-between">
                    <span className="text-xs text-text-secondary">Health Score</span>
                    <span className="text-xs text-text-muted">Updated now</span>
                </div>

                <div className="mt-3 flex items-center gap-4">

                    {/* CIRCLE */}
                    <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 rotate-[-90deg]">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                className="text-border-default"
                                strokeWidth="4"
                                fill="none"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke={healthScore > 80 ? "var(--color-success)" : healthScore > 50 ? "var(--color-warning)" : "var(--color-error)"}
                                strokeWidth="4"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                fill="none"
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-text-primary">
                            {healthScore}
                        </div>
                    </div>

                    {/* META */}
                    <div className="flex flex-col">
                        <span className="text-sm text-text-primary font-medium">
                            {healthScore > 80 ? "Excellent" : healthScore > 50 ? "Moderate" : "Poor"}
                        </span>
                        <span className="text-xs text-text-muted">
                            Maintainability is {maintainability?.toLowerCase()}
                        </span>
                    </div>
                </div>

                {/* STATS */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-text-muted">Complexity</p>
                        <p className="text-sm text-success font-medium">{complexity || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-text-muted">Issues</p>
                        <p className="text-sm text-text-primary font-medium">{issues.length}</p>
                    </div>
                </div>
            </div>

            {/* DIVIDER */}
            <div className="border-t border-border-subtle" />

            {/* ISSUES */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs text-text-secondary uppercase tracking-wide">
                        Issues
                    </h3>
                    <span className="text-xs text-text-muted">{issues.length} total</span>
                </div>

                <div className="space-y-3">

                    <div className="space-y-3">
                        {issues.map((issue, idx) => (
                            <IssueCard
                                key={idx}
                                severity={issue.severity || "medium"}
                                title={issue.title}
                                description={issue.description}
                                line={issue.line}
                                hasFix={issue.hasFix}
                                onFix={() => onApplyFix(issue.title, issue.description)}
                            />
                        ))}
                    </div>

                </div>
            </div>

            {/* SUGGESTIONS */}
            {suggestions && suggestions.length > 0 && (
                <>
                    <div className="border-t border-border-subtle" />
                    <div>
                        <h3 className="text-xs text-text-secondary uppercase tracking-wide mb-3">
                            Suggestions
                        </h3>
                        <ul className="list-disc pl-4 space-y-2 text-sm text-text-primary">
                            {suggestions.map((sug, i) => (
                                <li key={i}>{sug}</li>
                            ))}
                        </ul>
                    </div>
                </>
            )}

            {/* DIVIDER */}
            <div className="border-t border-border-subtle" />

            <div>
                <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className="text-sm text-primary hover:bg-primary-soft bg-transparent border border-primary/20 px-3 py-1 rounded disabled:opacity-50 flex items-center gap-2 transition"
                >
                    {isGenerating ? (
                        <>
                            <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full"></div>
                            Generating...
                        </>
                    ) : (
                        "Generate Report"
                    )}
                </button>
                {reportStatus && (
                    <p className={`text-[10px] mt-2 ${reportStatus.success ? 'text-success' : 'text-error'}`}>
                        {reportStatus.message}
                    </p>
                )}
            </div>

        </div>
    )
}

export default AiAnalysis

const IssueCard = ({ severity, title, description, line, hasFix, onFix }) => {
    const [isFixing, setIsFixing] = useState(false);

    const handleFix = async () => {
        setIsFixing(true);
        try {
            await onFix();
        } catch (error) {
            console.error(error);
        } finally {
            setIsFixing(false);
        }
    };

    const styles = {
        high: {
            border: "border-error/60",
            badge: "bg-error text-white",
        },
        medium: {
            border: "border-warning/60",
            badge: "bg-warning text-white",
        },
        low: {
            border: "border-info/60",
            badge: "bg-info text-white",
        },
    };

    const s = styles[severity] || styles.medium;

    return (
        <div
            className={`relative bg-surface rounded-lg p-4
      border-l-2 ${s.border} 
      border border-border-subtle shadow-md`}
        >
            {/* TOP ROW */}
            <div className="flex items-center justify-between mb-2">
                <span
                    className={`text-[10px] px-2 py-[2px] rounded font-semibold tracking-wide ${s.badge}`}
                >
                    {severity.toUpperCase()} SEVERITY
                </span>

                <span className="text-[11px] text-text-secondary">
                    {line || "Global"}
                </span>
            </div>

            {/* TITLE */}
            <p className="text-sm text-text-primary font-medium leading-snug">
                {title}
            </p>

            {/* DESCRIPTION */}
            {description && (
                <p className="text-xs text-text-secondary mt-1">
                    {description}
                </p>
            )}

            {/* ACTION */}
            {hasFix && (
                <button
                    onClick={handleFix}
                    disabled={isFixing}
                    className="flex items-center gap-1 text-xs text-primary mt-2 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                    {isFixing ? (
                        <>
                            <div className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full"></div>
                            Applying fix...
                        </>
                    ) : (
                        "✨ Quick fix available"
                    )}
                </button>
            )}
        </div>
    );
};