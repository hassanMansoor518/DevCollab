import React, { useState } from "react";
import { GitBranch, GitCommit, FileCode, ArrowUpRight, RotateCcw, Sparkles } from "lucide-react";
import axios from "axios";

const API_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_URL || "https://devcollab-production-f16f.up.railway.app";

export default function SourceControlPanel({
  projectId,
  modifiedFiles = {},
  fileContents = {},
  onOpenDiff,
  onCommitAndPush,
  isPushing = false,
}) {
  const [commitMsg, setCommitMsg] = useState("");
  const [isSuggesting, setIsSuggesting] = useState(false);

  const fileList = Object.entries(modifiedFiles).map(([path, status]) => ({
    path,
    name: path.split("/").pop(),
    status: status || "M",
  }));

  const handleCommit = (e) => {
    e.preventDefault();
    if (!commitMsg.trim()) return;
    onCommitAndPush(commitMsg);
    setCommitMsg("");
  };

  const handleSuggestMessage = async () => {
    if (fileList.length === 0 || isSuggesting) return;
    setIsSuggesting(true);
    try {
      const res = await axios.post(`${API_URL}/api/project/${projectId}/suggest-commit-message`, {
        files: fileList.map((f) => ({ path: f.path, status: f.status })),
      });
      if (res.data?.suggestion) {
        setCommitMsg(res.data.suggestion);
      }
    } catch (_) {
      // Silently ignore — user can always type manually
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <div className="w-56 sm:w-64 bg-[#0B111B] border-r border-[#1E293B] flex flex-col h-full shrink-0 select-none font-sans text-xs">
      {/* Header */}
      <div className="h-8 px-3 border-b border-[#172033] flex items-center justify-between text-[#8B949E]">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#E6EDF3]">
          <GitBranch size={13} className="text-[#3794FF]" />
          <span>Source Control</span>
        </div>
        <span className="text-[10px] font-mono text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded border border-[#3FB950]/20">
          main
        </span>
      </div>

      {/* Commit Input Box */}
      <form onSubmit={handleCommit} className="p-2.5 border-b border-[#172033] space-y-2">
        <div className="relative">
          <textarea
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit)"
            rows={3}
            className="w-full bg-[#0D1522] text-[#E6EDF3] text-xs p-2 rounded border border-[#1E293B] focus:border-[#3794FF] outline-none placeholder-[#6E7681] resize-none font-mono"
          />
          {/* AI Suggest button — bottom-right corner of textarea */}
          <button
            type="button"
            onClick={handleSuggestMessage}
            disabled={isSuggesting || fileList.length === 0}
            title="AI: Suggest commit message"
            className="absolute bottom-2 right-2 flex items-center gap-0.5 text-[9px] font-medium text-[#A371F7] hover:text-[#C084FC] disabled:opacity-30 transition-colors"
          >
            {isSuggesting ? (
              <RotateCcw size={10} className="animate-spin" />
            ) : (
              <Sparkles size={10} />
            )}
            <span>AI</span>
          </button>
        </div>

        <button
          type="submit"
          disabled={isPushing || fileList.length === 0 || !commitMsg.trim()}
          className="w-full flex items-center justify-center gap-1.5 bg-[#007ACC] hover:bg-[#0062A3] disabled:opacity-40 text-white text-xs font-medium py-1.5 px-2.5 rounded transition-colors"
        >
          {isPushing ? (
            <>
              <RotateCcw size={13} className="animate-spin" />
              <span>Pushing to GitHub...</span>
            </>
          ) : (
            <>
              <GitCommit size={13} />
              <span>Commit &amp; Push</span>
            </>
          )}
        </button>
      </form>

      {/* Changes List */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex items-center justify-between text-[11px] text-[#8B949E] font-bold px-1 mb-1">
          <span>CHANGES ({fileList.length})</span>
        </div>

        {fileList.length === 0 ? (
          <div className="text-center text-[#6E7681] text-xs py-8 font-mono">
            No changes detected.
          </div>
        ) : (
          <div className="space-y-0.5">
            {fileList.map((file) => (
              <div
                key={file.path}
                onClick={() => onOpenDiff(file.path)}
                className="group flex items-center justify-between px-2 py-1 rounded hover:bg-[#151E2D] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <FileCode size={13} className="text-[#3794FF] shrink-0" />
                  <span className="text-[#E6EDF3] truncate">{file.name}</span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-mono font-semibold text-[#D29922]">
                    {file.status}
                  </span>
                  <ArrowUpRight size={12} className="text-[#6E7681] group-hover:text-[#3794FF]" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
