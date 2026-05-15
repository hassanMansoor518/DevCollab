import { RefreshCcw } from "lucide-react";
import React, { useState } from "react";
import AiAnalysis from "./AiAnalysis";
import axios from "axios";

function AiCodeReviewer({ filename, code, language, onApplyFix, projectId }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    const handleRunTestCases = async () => {
        if (!code || !filename) {
            alert("Please select a file to analyze.");
            return;
        }

        setIsAnalyzing(true);
        setLoading(true);
        setError(null);

        try {
            const response = await axios.post(
                "http://localhost:3001/api/ai/analyze-code",
                { code, filename, language },
                { withCredentials: true }
            );
            setAnalysisResult(response.data);
        } catch (err) {
            console.error("Analysis Error:", err);
            setError(err.response?.data?.message || "Failed to analyze code");
        } finally {
            setLoading(false);
        }
    };

    const applyFix = async (issueTitle, issueDescription) => {
        if (!code || !filename) return;

        try {
            const response = await axios.post(
                "http://localhost:3001/api/ai/fix-issue",
                { code, filename, language, issueTitle, issueDescription },
                { withCredentials: true }
            );
            
            if (response.data.fixedCode && onApplyFix) {
                onApplyFix(response.data.fixedCode);
                // Optionally trigger a re-analysis
                handleRunTestCases();
            }
        } catch (err) {
            console.error("Fix Issue Error:", err);
            alert(err.response?.data?.message || "Failed to apply code fix");
            throw err;
        }
    };

    return (
        < div className="w-[360px] bg-[#0A0F1A] border-l border-white/5 flex flex-col" >

            {/* HEADER */}
            < div className="px-5 py-4 border-b border-white/5" >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-white tracking-wide">
                            Code Analysis
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            Real-time insights & issues
                        </p>
                    </div>
                    <button
                        onClick={handleRunTestCases}
                        disabled={loading}
                        className="text-sm text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-3 py-1 rounded disabled:opacity-50">

                        {loading ? "Analyzing..." : "Run test cases"}
                    </button>
                </div>
            </div >

            {isAnalyzing ? (
                loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
                        <p className="text-sm text-gray-400">Analyzing code...</p>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button 
                            onClick={handleRunTestCases}
                            className="text-xs bg-white/5 hover:bg-white/10 px-4 py-2 rounded text-white"
                        >
                            Retry
                        </button>
                    </div>
                ) : analysisResult ? (
                    <AiAnalysis 
                        result={analysisResult} 
                        onApplyFix={applyFix} 
                        projectId={projectId}
                        filename={filename}
                        language={language}
                        code={code}
                    />
                ) : null
            ) : (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">No issues found</p>
                </div>
            )}
        </div >


    )
}


export default AiCodeReviewer;
