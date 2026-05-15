import React from 'react'

function AiAnalysis({ result }) {
    if (!result) return null;

    const { healthScore, complexity, maintainability, issues = [], suggestions = [] } = result;

    const circumference = 28 * 2 * Math.PI;
    const strokeDashoffset = circumference - (healthScore / 100) * circumference;

    return (
        < div className="flex-1 overflow-y-auto px-5 py-4 space-y-6" >

            {/* HEALTH SCORE */}
            < div >
                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Health Score</span>
                    <span className="text-xs text-gray-500">Updated now</span>
                </div>

                <div className="mt-3 flex items-center gap-4">

                    {/* CIRCLE */}
                    <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 rotate-[-90deg]">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="#1f2937"
                                strokeWidth="4"
                                fill="none"
                            />
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke={healthScore > 80 ? "#10b981" : healthScore > 50 ? "#f59e0b" : "#ef4444"}
                                strokeWidth="4"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                fill="none"
                                strokeLinecap="round"
                                className="transition-all duration-1000 ease-out"
                            />
                        </svg>

                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
                            {healthScore}
                        </div>
                    </div>

                    {/* META */}
                    <div className="flex flex-col">
                        <span className="text-sm text-white font-medium">
                            {healthScore > 80 ? "Excellent" : healthScore > 50 ? "Moderate" : "Poor"}
                        </span>
                        <span className="text-xs text-gray-500">
                            Maintainability is {maintainability?.toLowerCase()}
                        </span>
                    </div>
                </div>

                {/* STATS */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500">Complexity</p>
                        <p className="text-sm text-green-400 font-medium">{complexity || "N/A"}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Issues</p>
                        <p className="text-sm text-white font-medium">{issues.length}</p>
                    </div>
                </div>
            </div>

            {/* DIVIDER */}
            < div className="border-t border-white/5" />

            {/* ISSUES */}
            < div >
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs text-gray-400 uppercase tracking-wide">
                        Issues
                    </h3>
                    <span className="text-xs text-gray-500">{issues.length} total</span>
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
                            />
                        ))}
                    </div>

                </div>
            </div >

            {/* SUGGESTIONS */}
            {suggestions && suggestions.length > 0 && (
                <>
                    <div className="border-t border-white/5" />
                    <div>
                        <h3 className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                            Suggestions
                        </h3>
                        <ul className="list-disc pl-4 space-y-2 text-sm text-gray-300">
                            {suggestions.map((sug, i) => (
                                <li key={i}>{sug}</li>
                            ))}
                        </ul>
                    </div>
                </>
            )}

            {/* DIVIDER */}
            < div className="border-t border-white/5" />

            < div >
                <button className="text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded">
                    Generate Report
                </button>
            </div >

        </div >
    )
}

export default AiAnalysis

const IssueCard = ({ severity, title, description, line, hasFix }) => {
    const styles = {
        high: {
            border: "border-red-500/60",

            badge: "bg-red-500 text-white",
        },
        medium: {
            border: "border-gray-400/40",

            badge: "bg-gray-500 text-white",
        },
        low: {
            border: "border-blue-400/40",

            badge: "bg-blue-500 text-white",
        },
    };

    const s = styles[severity];

    return (
        <div
            className={`relative bg-[#0B1220] rounded-lg p-4
      border-l-2 ${s.border} 
      border-l-4 border-[rgba(255,255,255,0.05)]`}
        >
            {/* TOP ROW */}
            <div className="flex items-center justify-between mb-2">
                <span
                    className={`text-[10px] px-2 py-[2px] rounded font-semibold tracking-wide ${s.badge}`}
                >
                    {severity.toUpperCase()} SEVERITY
                </span>

                <span className="text-[11px] text-gray-400">
                    {line || "Global"}
                </span>
            </div>

            {/* TITLE */}
            <p className="text-sm text-white font-medium leading-snug">
                {title}
            </p>

            {/* DESCRIPTION */}
            {description && (
                <p className="text-xs text-gray-400 mt-1">
                    {description}
                </p>
            )}

            {/* ACTION */}
            {hasFix && (
                <button className="text-xs text-blue-400 mt-2 hover:underline">
                    ✨ Quick fix available
                </button>
            )}
        </div>
    );
};