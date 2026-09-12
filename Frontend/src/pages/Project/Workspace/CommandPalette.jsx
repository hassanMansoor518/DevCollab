import React, { useState, useEffect } from "react";
import { Search, FileCode, Terminal, Bot, Save, X } from "lucide-react";

export default function CommandPalette({
  isOpen,
  onClose,
  fileItems = [],
  onSelectFile,
  onSaveActiveFile,
  onToggleTerminal,
  onToggleAIAgent
}) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: "save", label: "File: Save (Ctrl+S)", icon: Save, action: onSaveActiveFile },
    { id: "terminal", label: "View: Toggle Integrated Terminal", icon: Terminal, action: onToggleTerminal },
    { id: "ai", label: "DevCollab: Focus AI Agent", icon: Bot, action: onToggleAIAgent },
  ];

  const matchingFiles = fileItems.filter((f) =>
    (f.path || f.name || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 p-4">
      <div className="bg-[#0B111B] border border-[#1E293B] rounded shadow-2xl w-full max-w-xl overflow-hidden flex flex-col font-sans text-xs">
        {/* Search Bar */}
        <div className="px-3 py-2 border-b border-[#172033] flex items-center gap-2 bg-[#0D1522]">
          <Search size={14} className="text-[#3794FF]" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search files by name (e.g. > or file name)..."
            className="flex-1 bg-transparent text-[#E6EDF3] text-xs outline-none placeholder-[#6E7681] font-mono"
          />
          <button onClick={onClose} className="p-0.5 text-[#6E7681] hover:text-[#E6EDF3]">
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-72 overflow-y-auto p-1 space-y-0.5 select-none">
          {!query && (
            <div className="px-2 py-1 text-[10px] font-bold text-[#6E7681] uppercase tracking-wider">
              Commands
            </div>
          )}

          {commands.map((cmd) => {
            const Icon = cmd.icon;
            return (
              <div
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[#E6EDF3] hover:bg-[#18233A] cursor-pointer transition-colors"
              >
                <Icon size={14} className="text-[#3794FF] shrink-0" />
                <span>{cmd.label}</span>
              </div>
            );
          })}

          {matchingFiles.length > 0 && (
            <>
              <div className="px-2 py-1 text-[10px] font-bold text-[#6E7681] uppercase tracking-wider mt-1">
                Files
              </div>
              {matchingFiles.slice(0, 8).map((file) => (
                <div
                  key={file.path}
                  onClick={() => {
                    onSelectFile(file.path);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#18233A] cursor-pointer transition-colors font-mono"
                >
                  <FileCode size={13} className="text-[#E5C07B] shrink-0" />
                  <span className="truncate">{file.path || file.name}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
