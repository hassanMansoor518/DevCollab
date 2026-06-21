import React, { useState } from "react";
import axios from "axios";
import AiAnalysis from "./AiAnalysis";
import { RefreshCcw } from "lucide-react";

function AiCodeReviewer({ filename, code, language, onApplyFix, projectId }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    // ✅ Diff states
    const [diffMode, setDiffMode] = useState(false);
    const [originalCode, setOriginalCode] = useState("");

    const handleRunTestCases = async () => {
        if (!code || !filename) {
            alert("Please select a file to analyze.");
            return;
        }

        setIsAnalyzing(true);
        setLoading(true);
        setError(null);
        setAnalysisResult(null);
        setDiffMode(false); // reset diff mode

        try {
            const response = await axios.post(
                "/api/ai/analyze-code",
                { code, filename, language },
                { withCredentials: true }
            );

            setAnalysisResult(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error?.message || err.response?.data?.message || "Failed to analyze code");
        } finally {
            setLoading(false);
        }
    };

    const applyFix = async (issueTitle, issueDescription) => {
        try {
            const response = await axios.post(
                "/api/ai/fix-issue",
                { code, filename, language, issueTitle, issueDescription },
                { withCredentials: true }
            );

            if (response.data.fixedCode && onApplyFix) {

                // ✅ SAVE BEFORE & AFTER
                setOriginalCode(code);               // before fix
                setCodeState(response.data.fixedCode); // after fix
                setDiffMode(true);                   // enable diff view

                onApplyFix(response.data.fixedCode);

                handleRunTestCases();
            }
        } catch (err) {
            alert(err.response?.data?.error?.message || err.response?.data?.message || "Failed to apply fix");
        }
    };

    // local copy state for safe update
    const [codeState, setCodeState] = useState(code);

    React.useEffect(() => {
        setCodeState(code);
    }, [code]);

    const isEmpty = !loading && !analysisResult && !error;

    return (
        <div className="w-full lg:w-[380px] h-[500px] lg:h-full bg-gradient-to-b from-surface to-surface/80 border-t lg:border-t-0 lg:border-l border-border-subtle flex flex-col shadow-lg shrink-0">

            {/* HEADER */}
            <div className="px-5 py-4 border-b border-border-subtle bg-surface/60 backdrop-blur">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                            AI Code Reviewer
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                Beta
                            </span>
                        </h2>
                        <p className="text-xs text-text-muted mt-1">
                            {filename || "No file selected"}
                        </p>
                    </div>

                    <button
                        onClick={handleRunTestCases}
                        disabled={loading}
                        className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md 
                        bg-primary text-white hover:opacity-90 disabled:opacity-50 transition"
                    >
                        {loading ? (
                            <>
                                <RefreshCcw className="w-3 h-3 animate-spin" />
                                Analyzing
                            </>
                        ) : (
                            "Run Analysis"
                        )}
                    </button>
                </div>
            </div>

            {/* BODY */}
            <div className="flex-1 overflow-auto">

                {/* LOADING */}
                {loading && (
                    <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-text-muted">
                            AI is analyzing your code...
                        </p>
                    </div>
                )}

                {/* ERROR */}
                {error && !loading && (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-3">
                        <div className="text-error text-sm font-medium">
                            {error}
                        </div>
                        <button
                            onClick={handleRunTestCases}
                            className="px-4 py-2 text-xs rounded-md border border-border-subtle hover:bg-hover-bg transition"
                        >
                            Retry Analysis
                        </button>
                    </div>
                )}

                {/* RESULT (AI ANALYSIS VIEW) */}
                {!loading && analysisResult && !diffMode && (
                    <AiAnalysis
                        result={analysisResult}
                        onApplyFix={applyFix}
                        projectId={projectId}
                        filename={filename}
                        language={language}
                        code={codeState}
                    />
                )}

                {/* 🔥 DIFF VIEW */}
                {!loading && diffMode && (
                    <div className="h-full flex flex-col">

                        {/* TOP BAR */}
                        <div className="flex justify-between items-center p-2 border-b border-border-subtle">
                            <p className="text-xs text-text-muted">
                                Before vs After Fix
                            </p>

                            <button
                                onClick={() => setDiffMode(false)}
                                className="text-xs px-2 py-1 border rounded hover:bg-hover-bg"
                            >
                                Back to Analysis
                            </button>
                        </div>

                        {/* DIFF */}
                        <div className="flex-1 grid grid-cols-2 overflow-auto">

                            {/* BEFORE */}
                            <pre className="p-3 text-xs overflow-auto border-r border-border-subtle bg-[#0f0f0f] text-red-300">
                                {originalCode}
                            </pre>

                            {/* AFTER */}
                            <pre className="p-3 text-xs overflow-auto bg-[#0f0f0f] text-green-300">
                                {codeState}
                            </pre>
                        </div>
                    </div>
                )}

                {/* EMPTY STATE */}
                {isEmpty && (
                    <div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                            <RefreshCcw className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-sm font-medium text-text-primary">
                            Ready to analyze your code
                        </p>
                        <p className="text-xs text-text-muted">
                            Run AI analysis to detect bugs, performance issues, and improvements
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AiCodeReviewer;