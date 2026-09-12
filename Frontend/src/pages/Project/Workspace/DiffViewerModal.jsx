import React from "react";
import { DiffEditor } from "@monaco-editor/react";
import { X, Check, XCircle } from "lucide-react";

export default function DiffViewerModal({
  isOpen,
  onClose,
  filePath,
  originalCode,
  modifiedCode,
  onAccept,
  onReject
}) {
  if (!isOpen) return null;

  const getLanguage = (path = "") => {
    const ext = path.split(".").pop().toLowerCase();
    const map = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      css: "css",
      html: "html",
      py: "python"
    };
    return map[ext] || "javascript";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans text-xs">
      <div className="bg-[#0B111B] border border-[#1E293B] rounded shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-10 px-3 bg-[#0D1522] border-b border-[#172033] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#8B949E]">Diff View:</span>
            <span className="font-mono text-[#E6EDF3] bg-[#0B111B] px-2 py-0.5 rounded border border-[#1E293B]">
              {filePath}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onReject && (
              <button
                onClick={onReject}
                className="flex items-center gap-1 text-[#F85149] hover:bg-[#F85149]/10 border border-[#F85149]/30 px-2.5 py-1 rounded transition-colors"
              >
                <XCircle size={13} />
                <span>Reject</span>
              </button>
            )}

            {onAccept && (
              <button
                onClick={onAccept}
                className="flex items-center gap-1 text-white bg-[#007ACC] hover:bg-[#0062A3] px-3 py-1 rounded font-medium transition-colors"
              >
                <Check size={13} />
                <span>Accept Changes</span>
              </button>
            )}

            <button onClick={onClose} className="p-1 text-[#6E7681] hover:text-[#E6EDF3] ml-1">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Diff Editor */}
        <div className="flex-1 relative bg-[#0B1220]">
          <DiffEditor
            height="100%"
            original={originalCode || ""}
            modified={modifiedCode || ""}
            language={getLanguage(filePath)}
            theme="vs-dark"
            options={{
              renderSideBySide: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              fontSize: 12,
              fontFamily: "'Fira Code', Consolas, monospace",
            }}
          />
        </div>
      </div>
    </div>
  );
}
