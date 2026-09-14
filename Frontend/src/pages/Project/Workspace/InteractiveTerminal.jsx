import React, { useState, useEffect, useRef } from "react";
import {
  Terminal as TerminalIcon,
  ChevronDown,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RotateCcw,
  Columns,
  ExternalLink,
  Radio,
  XCircle,
  Sparkles
} from "lucide-react";
import { useSocketContext } from "../../../context/SocketContext";
import XTermInstance from "./terminal/XTermInstance";
import VisualDiffReportTab from "./Testing/VisualDiffReportTab";
import { webContainerService, WC_STATUS } from "../../../services/webContainerService";

export default function InteractiveTerminal({
  projectId,
  projectName = "devcollab-webapp",
  onClose,
  onOpenPreview
}) {
  const { socket } = useSocketContext();

  const [activePanelTab, setActivePanelTab] = useState("terminal"); // 'terminal' | 'problems' | 'output' | 'debug'
  const [isMaximized, setIsMaximized] = useState(false);
  const [wcStatus, setWcStatus] = useState(webContainerService.status);

  // Shell detection / default
  const defaultShell = "jsh";

  // Multi-terminal tabs
  const [terminals, setTerminals] = useState([
    {
      id: `term_1_${projectId || "default"}`,
      name: "1: WebContainer",
      shell: "jsh",
    },
  ]);
  const [activeTermId, setActiveTermId] = useState(terminals[0]?.id);
  const [splitTermId, setSplitTermId] = useState(null);

  // New Terminal dropdown menu state
  const [shellDropdownOpen, setShellDropdownOpen] = useState(false);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingTabName, setEditingTabName] = useState("");

  // Dev server detection banner state
  const [detectedDevServer, setDetectedDevServer] = useState(null);

  useEffect(() => {
    // 1. Subscribe to WebContainer serverReady events
    const unsubServer = webContainerService.on("serverReady", (serverInfo) => {
      setDetectedDevServer(serverInfo);
    });

    // 2. Subscribe to WebContainer status events
    const unsubStatus = webContainerService.on("status", ({ status }) => {
      setWcStatus(status);
    });

    return () => {
      unsubServer();
      unsubStatus();
    };
  }, []);

  const handleDevServerDetected = ({ url, port }) => {
    setDetectedDevServer({
      url,
      previewUrl: url,
      port,
      framework: "Vite",
      status: "running"
    });
  };

  // Available shell choices
  const shellOptions = [
    { id: "jsh", label: "Node.js Shell (WebContainer)", desc: "In-Browser WebContainer environment" },
    { id: "bash", label: "Bash Emulation", desc: "Interactive Unix-style shell" },
  ];

  const activeTerminal = terminals.find((t) => t.id === activeTermId) || terminals[0];

  // Problems list for PROBLEMS tab
  const problemsList = [
    {
      id: 1,
      type: "warning",
      file: "src/pages/CodeEditor.jsx",
      line: 25,
      col: 9,
      message: "'error' is defined but never used. (no-unused-vars)",
      source: "eslint",
    },
    {
      id: 2,
      type: "warning",
      file: "src/services/authService.js",
      line: 42,
      col: 15,
      message: "Async function has no 'await' expression. (require-await)",
      source: "eslint",
    },
    {
      id: 3,
      type: "warning",
      file: "backend/middleware/auth.js",
      line: 18,
      col: 7,
      message: "Missing token validation fallback branch.",
      source: "eslint",
    },
  ];

  /* ---------------- TERMINAL TAB MANAGEMENT ---------------- */
  const handleCreateTerminal = (chosenShell = defaultShell) => {
    const nextIdx = terminals.length + 1;
    const shellLabel = chosenShell === "powershell" ? "PowerShell" : chosenShell === "cmd" ? "Command Prompt" : "Bash";
    const newTerm = {
      id: `term_${nextIdx}_${Date.now()}`,
      name: `${nextIdx}: ${shellLabel}`,
      shell: chosenShell,
    };
    setTerminals((prev) => [...prev, newTerm]);
    setActiveTermId(newTerm.id);
    setShellDropdownOpen(false);
  };

  const handleCloseTerminal = (idToClose, e) => {
    if (e) e.stopPropagation();

    // Kill session on backend
    if (socket && socket.connected) {
      socket.emit("terminal:kill", { sessionId: idToClose });
    }

    if (splitTermId === idToClose) setSplitTermId(null);

    const remaining = terminals.filter((t) => t.id !== idToClose);
    if (remaining.length === 0) {
      // Re-create default if all closed
      const newTerm = {
        id: `term_1_${Date.now()}`,
        name: isWindows ? "1: PowerShell" : "1: Bash",
        shell: defaultShell,
      };
      setTerminals([newTerm]);
      setActiveTermId(newTerm.id);
    } else {
      setTerminals(remaining);
      if (activeTermId === idToClose) {
        setActiveTermId(remaining[remaining.length - 1].id);
      }
    }
  };

  const handleToggleSplit = () => {
    if (splitTermId) {
      setSplitTermId(null);
    } else {
      // Find or create a 2nd terminal for split view
      const other = terminals.find((t) => t.id !== activeTermId);
      if (other) {
        setSplitTermId(other.id);
      } else {
        const nextIdx = terminals.length + 1;
        const newTerm = {
          id: `term_${nextIdx}_${Date.now()}`,
          name: `${nextIdx}: ${defaultShell === "powershell" ? "PowerShell" : "Bash"} (Split)`,
          shell: defaultShell,
        };
        setTerminals((prev) => [...prev, newTerm]);
        setSplitTermId(newTerm.id);
      }
    }
  };

  const handleClearActive = () => {
    if (socket && socket.connected && activeTerminal) {
      socket.emit("terminal:input", { sessionId: activeTerminal.id, data: "\x0c" }); // Ctrl+L
    }
  };

  const handleRestartActive = () => {
    if (socket && socket.connected && activeTerminal) {
      socket.emit("terminal:restart", { sessionId: activeTerminal.id });
    }
  };

  const handleKillActive = () => {
    if (socket && socket.connected && activeTerminal) {
      socket.emit("terminal:input", { sessionId: activeTerminal.id, data: "\x03" }); // Ctrl+C SIGINT
    }
  };

  const startRenameTab = (term) => {
    setEditingTabId(term.id);
    setEditingTabName(term.name);
  };

  const saveRenameTab = () => {
    if (editingTabId && editingTabName.trim()) {
      setTerminals((prev) =>
        prev.map((t) => (t.id === editingTabId ? { ...t, name: editingTabName.trim() } : t))
      );
    }
    setEditingTabId(null);
  };

  return (
    <div
      className={`bg-[#0B1220] border-t border-[#1E293B] flex flex-col font-mono text-xs select-none shrink-0 transition-all ${
        isMaximized ? "h-[32rem]" : "h-64"
      }`}
    >
      {/* 1. TOP PANEL HEADER BAR */}
      <div className="h-9 bg-[#080D17] border-b border-[#172033] px-3 flex items-center justify-between select-none shrink-0 font-sans">
        {/* Left Navigation Tabs */}
        <div className="flex items-center gap-4 text-[11px] font-semibold tracking-wide">
          <button
            onClick={() => setActivePanelTab("terminal")}
            className={`h-9 flex items-center gap-1.5 border-b-2 transition-colors uppercase ${
              activePanelTab === "terminal"
                ? "text-[#38BDF8] border-[#38BDF8]"
                : "text-[#8B949E] border-transparent hover:text-[#E6EDF3]"
            }`}
          >
            <TerminalIcon size={12} className="text-[#38BDF8]" />
            <span>TERMINAL</span>
            {terminals.length > 1 && (
              <span className="bg-[#38BDF8]/20 text-[#38BDF8] text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {terminals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActivePanelTab("problems")}
            className={`h-9 flex items-center gap-1.5 border-b-2 transition-colors uppercase ${
              activePanelTab === "problems"
                ? "text-[#E6EDF3] border-[#38BDF8]"
                : "text-[#8B949E] border-transparent hover:text-[#E6EDF3]"
            }`}
          >
            <span>PROBLEMS</span>
            <span className="bg-[#D29922]/20 text-[#D29922] text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold">
              3
            </span>
          </button>

          <button
            onClick={() => setActivePanelTab("output")}
            className={`h-9 flex items-center gap-1.5 border-b-2 transition-colors uppercase ${
              activePanelTab === "output"
                ? "text-[#E6EDF3] border-[#38BDF8]"
                : "text-[#8B949E] border-transparent hover:text-[#E6EDF3]"
            }`}
          >
            <span>OUTPUT</span>
          </button>

          <button
            onClick={() => setActivePanelTab("debug")}
            className={`h-9 flex items-center gap-1.5 border-b-2 transition-colors uppercase ${
              activePanelTab === "debug"
                ? "text-[#E6EDF3] border-[#38BDF8]"
                : "text-[#8B949E] border-transparent hover:text-[#E6EDF3]"
            }`}
          >
            <span>DEBUG CONSOLE</span>
          </button>

          <button
            onClick={() => setActivePanelTab("visualDiff")}
            className={`h-9 flex items-center gap-1.5 border-b-2 transition-colors uppercase ${
              activePanelTab === "visualDiff"
                ? "text-[#E6EDF3] border-[#A855F7]"
                : "text-[#8B949E] border-transparent hover:text-[#E6EDF3]"
            }`}
          >
            <span>VISUAL DIFF REPORT</span>
          </button>
        </div>

        {/* Right Controls & Toolbar */}
        <div className="flex items-center gap-1.5 text-[#8B949E]">
          {/* WebContainer Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#131C2D] border border-[#202E44] px-2 py-0.5 rounded text-[11px] font-mono text-[#94A3B8]">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                wcStatus === WC_STATUS.READY
                  ? "bg-[#4ADE80] animate-pulse"
                  : wcStatus === WC_STATUS.ERROR
                  ? "bg-[#F87171]"
                  : "bg-[#FBBF24] animate-spin"
              }`}
            />
            <span className="capitalize">
              {wcStatus === WC_STATUS.READY
                ? "WebContainer Ready"
                : wcStatus === WC_STATUS.ERROR
                ? "Environment Error"
                : "Starting Environment..."}
            </span>
          </div>

          {/* New Terminal Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setShellDropdownOpen(!shellDropdownOpen)}
              title="New Terminal with Shell..."
              className="flex items-center gap-0.5 p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
            >
              <Plus size={14} className="text-[#38BDF8]" />
              <ChevronDown size={10} className="text-[#64748B]" />
            </button>

            {shellDropdownOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-[#161F30] border border-[#2A374E] rounded-lg shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 font-sans text-xs">
                <div className="px-3 py-1 text-[10px] text-[#64748B] font-semibold tracking-wider uppercase">
                  Select Shell
                </div>
                {shellOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleCreateTerminal(opt.id)}
                    className="w-full px-3 py-1.5 text-left hover:bg-[#202D44] transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[#E6EDF3] font-medium">{opt.label}</div>
                      <div className="text-[10px] text-[#64748B]">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Split Terminal Button */}
          <button
            onClick={handleToggleSplit}
            title={splitTermId ? "Unsplit Terminal" : "Split Terminal Pane"}
            className={`p-1 rounded transition-colors ${
              splitTermId
                ? "text-[#38BDF8] bg-[#38BDF8]/20"
                : "hover:text-[#E6EDF3] hover:bg-[#151E2D]"
            }`}
          >
            <Columns size={13} />
          </button>

          {/* Clear Terminal Buffer */}
          <button
            onClick={handleClearActive}
            title="Clear Terminal Buffer"
            className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
          >
            <Trash2 size={13} />
          </button>

          {/* Restart Active Terminal */}
          <button
            onClick={handleRestartActive}
            title="Restart Terminal Session"
            className="p-1 hover:text-[#FBBF24] hover:bg-[#151E2D] rounded transition-colors"
          >
            <RotateCcw size={13} />
          </button>

          {/* Kill Active Process */}
          <button
            onClick={handleKillActive}
            title="Send Ctrl+C (Interrupt Process)"
            className="p-1 text-[#F87171]/80 hover:text-[#F87171] hover:bg-[#3B1824] rounded transition-colors"
          >
            <XCircle size={13} />
          </button>

          <div className="w-px h-3.5 bg-[#202E44] mx-1" />

          {/* Maximize / Restore */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? "Restore Height" : "Maximize Panel"}
            className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>

          {/* Close Panel */}
          {onClose && (
            <button
              onClick={onClose}
              title="Close Terminal Panel"
              className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 2. TERMINAL SUB-TAB BAR (When terminal tab is active & multiple terminals exist) */}
      {activePanelTab === "terminal" && (
        <div className="h-7 bg-[#0B1220] border-b border-[#182337] px-2 flex items-center gap-1 overflow-x-auto select-none shrink-0 font-sans text-xs scrollbar-none">
          {terminals.map((term) => {
            const isActive = term.id === activeTermId;
            const isSplit = term.id === splitTermId;
            const isEditing = editingTabId === term.id;

            return (
              <div
                key={term.id}
                onClick={() => setActiveTermId(term.id)}
                onDoubleClick={() => startRenameTab(term)}
                className={`group h-6 px-2.5 rounded flex items-center gap-1.5 text-[11px] cursor-pointer transition-all ${
                  isActive
                    ? "bg-[#1A263C] text-[#E6EDF3] font-semibold border-b border-[#38BDF8]"
                    : isSplit
                    ? "bg-[#131D2E] text-[#38BDF8] border border-[#38BDF8]/40"
                    : "text-[#8B949E] hover:bg-[#121B2B] hover:text-[#CBD5E1]"
                }`}
              >
                <TerminalIcon
                  size={11}
                  className={isActive ? "text-[#38BDF8]" : "text-[#64748B]"}
                />

                {isEditing ? (
                  <input
                    type="text"
                    value={editingTabName}
                    onChange={(e) => setEditingTabName(e.target.value)}
                    onBlur={saveRenameTab}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveRenameTab();
                      if (e.key === "Escape") setEditingTabId(null);
                    }}
                    autoFocus
                    className="bg-[#0B1220] text-[#E6EDF3] px-1 py-0.5 rounded outline-none border border-[#38BDF8] text-[10px] w-24"
                  />
                ) : (
                  <span className="truncate max-w-[120px]">{term.name}</span>
                )}

                {isSplit && (
                  <span className="text-[9px] bg-[#38BDF8]/20 text-[#38BDF8] px-1 rounded">
                    SPLIT
                  </span>
                )}

                <button
                  onClick={(e) => handleCloseTerminal(term.id, e)}
                  title="Close Terminal"
                  className="opacity-0 group-hover:opacity-100 hover:text-[#F87171] p-0.5 rounded transition-all ml-0.5"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => handleCreateTerminal(defaultShell)}
            title="Add Terminal"
            className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors ml-1 text-[#8B949E]"
          >
            <Plus size={12} />
          </button>
        </div>
      )}

      {/* 3. DEV SERVER DETECTION FLOATING CHIP */}
      {detectedDevServer && activePanelTab === "terminal" && (
        <div className="bg-[#0A2239] border-b border-[#1A4B75] px-3 py-1.5 flex items-center justify-between text-xs text-[#7DD3FC] shrink-0 font-sans animate-in slide-in-from-top-1">
          <div className="flex items-center gap-2">
            <Radio size={13} className="text-[#4ADE80] animate-pulse" />
            <span>
              <strong className="text-white font-semibold">{detectedDevServer.framework} Dev Server</strong> is running on port{" "}
              <strong className="text-[#38BDF8] font-mono">{detectedDevServer.port}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Live in-workspace preview modal button */}
            <button
              onClick={() => onOpenPreview && onOpenPreview(detectedDevServer)}
              className="flex items-center gap-1 bg-[#0284C7] hover:bg-[#0369A1] text-white px-2.5 py-1 rounded font-medium text-[11px] shadow-sm transition-colors"
            >
              <span>Live Preview</span>
              <Sparkles size={11} className="text-yellow-300" />
            </button>

            {/* Open in external browser tab */}
            <a
              href={detectedDevServer.previewUrl || detectedDevServer.url}
              target="_blank"
              rel="noreferrer"
              title="Open in External Browser Tab"
              className="flex items-center gap-1 bg-[#13283E] hover:bg-[#1E3B5C] border border-[#204A75] text-[#93C5FD] px-2 py-1 rounded font-medium text-[11px] transition-colors"
            >
              <span>Open in Tab</span>
              <ExternalLink size={11} />
            </a>

            {/* Restart Server */}
            <button
              onClick={handleRestartActive}
              title="Restart Dev Server"
              className="p-1 hover:text-[#FBBF24] hover:bg-[#13283E] rounded transition-colors text-[#94A3B8]"
            >
              <RotateCcw size={12} />
            </button>

            {/* Stop Server (Ctrl+C) */}
            <button
              onClick={handleKillActive}
              title="Stop Dev Server (Ctrl+C)"
              className="p-1 text-[#F87171]/80 hover:text-[#F87171] hover:bg-[#3B1824] rounded transition-colors"
            >
              <XCircle size={13} />
            </button>
          </div>
        </div>
      )}

      {/* 4. MAIN PANEL BODY */}
      <div className="flex-1 w-full h-full min-h-0 relative overflow-hidden">
        {/* TAB: REAL INTEGRATED TERMINAL */}
        {activePanelTab === "terminal" && (
          <div className="w-full h-full flex flex-row divide-x divide-[#172033]">
            {/* Primary Terminal Instance */}
            {terminals.map((term) => {
              const isCurrentActive = term.id === activeTermId;
              const isSplitActive = term.id === splitTermId;
              const shouldRender = isCurrentActive || isSplitActive;

              if (!shouldRender) return null;

              return (
                <div
                  key={term.id}
                  className={`h-full ${
                    splitTermId ? "w-1/2 flex-1" : "w-full"
                  }`}
                >
                  <XTermInstance
                    sessionId={term.id}
                    projectId={projectId}
                    socket={socket}
                    shellType={term.shell}
                    isActive={isCurrentActive || isSplitActive}
                    onDevServerDetected={handleDevServerDetected}
                    onNewTerminal={() => handleCreateTerminal(defaultShell)}
                    onSplitTerminal={handleToggleSplit}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: PROBLEMS */}
        {activePanelTab === "problems" && (
          <div className="h-full overflow-y-auto p-3 space-y-1.5 font-sans text-xs">
            <div className="text-[#8B949E] text-[11px] mb-2 font-medium">
              3 problems in 3 files
            </div>
            {problemsList.map((prob) => (
              <div
                key={prob.id}
                className="flex items-center gap-2 p-1.5 hover:bg-[#151E2D] rounded text-xs transition-colors cursor-pointer"
              >
                <AlertTriangle size={14} className="text-[#D29922] shrink-0" />
                <span className="text-[#E6EDF3] truncate">{prob.message}</span>
                <span className="font-mono text-[11px] text-[#6E7681] ml-auto shrink-0">
                  {prob.file} [{prob.line}, {prob.col}]
                </span>
              </div>
            ))}
          </div>
        )}

        {/* TAB: OUTPUT */}
        {activePanelTab === "output" && (
          <div className="h-full overflow-y-auto p-3 font-mono text-[12px] text-[#8B949E] space-y-1">
            <div>[DevCollab Engine] Workspace initialized in sandbox container.</div>
            <div>[Build System] Loaded project configuration from vite.config.js</div>
            <div>[Build System] Transpiling modules for live workspace preview...</div>
            <div className="text-[#4ADE80]">[Build System] Bundle ready for interactive development.</div>
          </div>
        )}

        {/* TAB: DEBUG CONSOLE */}
        {activePanelTab === "debug" && (
          <div className="h-full overflow-y-auto p-3 font-sans text-xs text-[#6E7681] italic">
            Debug session not active. Launch application or attach debugger to start session.
          </div>
        )}

        {/* TAB: VISUAL DIFF REPORT */}
        {activePanelTab === "visualDiff" && (
          <VisualDiffReportTab />
        )}
      </div>
    </div>
  );
}
