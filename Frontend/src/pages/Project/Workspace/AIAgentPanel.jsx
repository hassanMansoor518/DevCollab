import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  RotateCcw, X, CheckCircle2, Circle, FileCode, Eye, Bot, Terminal,
  Send, Sparkles, AtSign, PlaySquare, Loader2, Square, Pause, Play,
  Undo2, Redo2, Check, Ban, AlertCircle, Zap, Code2, GitBranch,
  ChevronRight, Clock, BarChart2, Wrench, AlertTriangle, Sliders, CheckCheck
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSocketContext } from "../../../context/SocketContext";

const API_URL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_URL || "https://devcollab-production-f60e.up.railway.app";

/* -----------------------------------------
   IDLE / WELCOME SCREEN
----------------------------------------- */
function IdleScreen({ onSuggestion, selectedCode, activeTabPath }) {
  const suggestions = [
    { icon: <Zap size={13} />, text: "If bulb is on, change background color to yellow", mode: "⚡ Fast" },
    { icon: <Code2 size={13} />, text: "Change the button background color to red", mode: "⚡ Fast" },
    { icon: <Sparkles size={13} />, text: "Rename the title from Bulb App to Smart Bulb", mode: "⚡ Fast" },
    { icon: <GitBranch size={13} />, text: "Add a reset button with click handler", mode: "⚡ Fast" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 gap-5 select-none">
      <div className="relative flex items-center justify-center">
        <div className="absolute w-16 h-16 rounded-full bg-[#A371F7]/10 blur-xl animate-pulse" />
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#A371F7]/30 to-[#3794FF]/20 border border-[#A371F7]/30 flex items-center justify-center shadow-lg shadow-[#A371F7]/10">
          <Bot size={22} className="text-[#A371F7]" />
        </div>
      </div>
      <div className="text-center space-y-1">
        <h3 className="text-sm font-bold text-[#E6EDF3] tracking-tight flex items-center justify-center gap-1.5">
          DevCollab AI Agent
          <span className="text-[9px] font-semibold text-[#3FB950] bg-[#3FB950]/10 border border-[#3FB950]/30 px-1.5 py-0.2 rounded-full">v2 Fast</span>
        </h3>
        <p className="text-[11px] text-[#6E7681] leading-relaxed max-w-[220px]">
          Sub-second execution for simple code edits. Targeted patches & zero bloat.
        </p>
      </div>

      {/* Editor Context Badge */}
      {(activeTabPath || selectedCode) && (
        <div className="w-full bg-[#0D1522] border border-[#1E293B] rounded-lg p-2 text-left space-y-1">
          <div className="text-[9px] uppercase tracking-wider text-[#6E7681] font-semibold flex items-center gap-1">
            <Code2 size={10} className="text-[#3794FF]" /> Active Context
          </div>
          {activeTabPath && (
            <div className="text-[10px] text-[#8B949E] font-mono truncate">
              File: <span className="text-[#E6EDF3]">{activeTabPath}</span>
            </div>
          )}
          {selectedCode && (
            <div className="text-[9px] text-[#3FB950] font-mono truncate">
              Selection: {selectedCode.slice(0, 40)}...
            </div>
          )}
        </div>
      )}

      <div className="w-full space-y-1.5">
        <p className="text-[10px] text-[#6E7681] font-medium uppercase tracking-wider mb-2">Try Fast Actions</p>
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s.text)}
            className="w-full flex items-center gap-2.5 text-left px-3 py-2 bg-[#0D1522] hover:bg-[#151E2D] border border-[#1E293B] hover:border-[#A371F7]/40 rounded-lg transition-all group"
          >
            <span className="text-[#A371F7] shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">{s.icon}</span>
            <span className="text-[11px] text-[#8B949E] group-hover:text-[#E6EDF3] transition-colors truncate flex-1">{s.text}</span>
            <span className="text-[8px] font-mono text-[#3FB950] bg-[#3FB950]/10 px-1 py-0.5 rounded shrink-0">{s.mode}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------------------
   PERFORMANCE PANEL
----------------------------------------- */
function PerfPanel({ perf }) {
  if (!perf) return null;
  const { totalFormatted, categories, counters, telemetry, mode } = perf;
  const bars = [
    { label: "LLM", value: categories.llm?.ms || 0, color: "#A371F7", formatted: categories.llm?.formatted || "0s" },
    { label: "Discovery", value: categories.discovery?.ms || 0, color: "#3794FF", formatted: categories.discovery?.formatted || "0s" },
    { label: "Patch", value: categories.patch?.ms || 0, color: "#3FB950", formatted: categories.patch?.formatted || "0s" },
    { label: "Validation", value: categories.validation?.ms || 0, color: "#D29922", formatted: categories.validation?.formatted || "0s" },
    { label: "FS/Other", value: categories.other?.ms || 0, color: "#6E7681", formatted: categories.other?.formatted || "0s" },
  ];
  const totalMs = perf.totalMs || 1;

  return (
    <div className="bg-[#060D16] border border-[#1E293B] rounded-lg p-2.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <BarChart2 size={11} className="text-[#A371F7]" />
          <span className="text-[10px] text-[#6E7681] uppercase tracking-wider font-medium">
            Execution Telemetry [{mode ? mode.toUpperCase() : 'FAST'}]
          </span>
        </div>
        <span className="text-[12px] font-bold text-[#3FB950] font-mono">{totalFormatted}</span>
      </div>
      {/* Stacked bar */}
      <div className="h-2 rounded-full overflow-hidden flex bg-[#151E2D]">
        {bars.map(b => (
          <div
            key={b.label}
            style={{ width: Math.max((b.value / totalMs) * 100, b.value > 0 ? 3 : 0) + "%", background: b.color }}
            title={b.label + ": " + b.formatted}
          />
        ))}
      </div>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-1">
        {bars.map(b => (
          <div key={b.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: b.color }} />
            <span className="text-[10px] text-[#6E7681]">{b.label}</span>
            <span className="text-[10px] text-[#8B949E] font-mono ml-auto">{b.formatted}</span>
          </div>
        ))}
      </div>
      {/* Counters */}
      <div className="grid grid-cols-3 gap-1 border-t border-[#1E293B] pt-2">
        {[
          { label: "LLM Calls", value: counters?.llmCalls || 1 },
          { label: "Files Read", value: counters?.filesRead || 1 },
          { label: "Files Written", value: counters?.filesWritten || 1 },
          { label: "Cache Hits", value: counters?.cacheHits || 0 },
          { label: "Cache Misses", value: counters?.cacheMisses || 0 },
          { label: "DB Writes", value: counters?.dbWrites || 1 },
        ].map(c => (
          <div key={c.label} className="text-center">
            <div className="text-[11px] font-bold text-[#E6EDF3] font-mono">{c.value}</div>
            <div className="text-[8.5px] text-[#6E7681] leading-tight">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -----------------------------------------
   EXECUTION VIEW
----------------------------------------- */
function ExecutionView({
  activeTask,
  onAcceptChanges,
  onRejectChanges,
  onOpenDiffModal,
  perfData,
  showPerf,
  isFastPath,
}) {
  const terminalRef = useRef(null);
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [activeTask?.terminalOutput]);

  const state = activeTask?.state || "IDLE";
  const filesChanged = activeTask?.filesChanged || [];
  const plan = activeTask?.plan || [];
  const isExecuting = ["ANALYZING", "PLANNING", "EXECUTING", "RUNNING_COMMAND", "RUNNING_TESTS", "FIXING", "VERIFYING"].includes(state);

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3 font-sans scrollbar-thin text-xs">
      {/* Mode & Live Status Header */}
      <div className="bg-[#0D1522] border border-[#1E293B] rounded-lg p-2.5 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#6E7681] uppercase tracking-wider font-semibold flex items-center gap-1">
            {isFastPath ? <Zap size={11} className="text-[#3FB950]" /> : <Bot size={11} className="text-[#A371F7]" />}
            {isFastPath ? "⚡ Fast Execution" : activeTask?.mode === "smart" ? "🧠 Smart Mode" : "🤖 Autonomous Mode"}
          </span>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            state === "COMPLETED" ? "bg-[#3FB950]/10 text-[#3FB950] border border-[#3FB950]/30" :
            state === "FAILED" ? "bg-[#F85149]/10 text-[#F85149] border border-[#F85149]/30" :
            "bg-[#A371F7]/10 text-[#A371F7] border border-[#A371F7]/30 animate-pulse"
          }`}>
            {state === "COMPLETED" ? "✓ Completed" : state === "FAILED" ? "✗ Failed" : state.toLowerCase().replace(/_/g, ' ')}
          </span>
        </div>
        <p className="text-[11px] text-[#E6EDF3] font-medium leading-relaxed">
          {activeTask?.activeTaskText || activeTask?.summary || "Processing..."}
        </p>
      </div>

      {/* Real-time Fast Path Steps */}
      {isFastPath && (
        <div className="bg-[#09111C] border border-[#1E293B] rounded-lg p-2.5 space-y-1.5">
          <div className="text-[9.5px] uppercase tracking-wider text-[#6E7681] font-semibold">Execution Pipeline</div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10.5px]">
              <CheckCircle2 size={11} className="text-[#3FB950] shrink-0" />
              <span className="text-[#8B949E]">Target Code Discovery</span>
              <span className="ml-auto font-mono text-[9px] text-[#3FB950]">✓ 0.1s</span>
            </div>
            <div className="flex items-center gap-2 text-[10.5px]">
              {state === "ANALYZING" ? (
                <Loader2 size={11} className="text-[#A371F7] animate-spin shrink-0" />
              ) : (
                <CheckCircle2 size={11} className="text-[#3FB950] shrink-0" />
              )}
              <span className="text-[#8B949E]">Patch Generation</span>
              {state !== "ANALYZING" && <span className="ml-auto font-mono text-[9px] text-[#3FB950]">✓ Done</span>}
            </div>
            <div className="flex items-center gap-2 text-[10.5px]">
              {state === "EXECUTING" ? (
                <Loader2 size={11} className="text-[#A371F7] animate-spin shrink-0" />
              ) : state === "COMPLETED" ? (
                <CheckCircle2 size={11} className="text-[#3FB950] shrink-0" />
              ) : (
                <Circle size={11} className="text-[#3E4A5C] shrink-0" />
              )}
              <span className="text-[#8B949E]">Patch Applied & Syntax Check</span>
              {state === "COMPLETED" && <span className="ml-auto font-mono text-[9px] text-[#3FB950]">✓ Verified</span>}
            </div>
          </div>
        </div>
      )}

      {/* Plan Steps for Smart / Autonomous Mode */}
      {!isFastPath && plan.length > 0 && (
        <div className="bg-[#09111C] border border-[#1E293B] rounded-lg p-2.5 space-y-1.5">
          <div className="text-[9.5px] uppercase tracking-wider text-[#6E7681] font-semibold">Execution Plan</div>
          <div className="space-y-1">
            {plan.map((p, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[10.5px]">
                {p.status === "completed" ? (
                  <CheckCircle2 size={11} className="text-[#3FB950] shrink-0" />
                ) : p.status === "in_progress" ? (
                  <Loader2 size={11} className="text-[#A371F7] animate-spin shrink-0" />
                ) : (
                  <Circle size={11} className="text-[#3E4A5C] shrink-0" />
                )}
                <span className={`truncate ${p.status === "completed" ? "text-[#8B949E]" : "text-[#E6EDF3]"}`}>
                  {p.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modified Files & Diffs */}
      {filesChanged.length > 0 && (
        <div className="bg-[#09111C] border border-[#1E293B] rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[9.5px] uppercase tracking-wider text-[#6E7681] font-semibold flex items-center gap-1">
              <FileCode size={11} className="text-[#3794FF]" /> Files Modified ({filesChanged.length})
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onAcceptChanges(null)}
                title="Accept All"
                className="flex items-center gap-0.5 text-[9px] bg-[#3FB950]/15 hover:bg-[#3FB950]/25 text-[#3FB950] border border-[#3FB950]/30 px-1.5 py-0.5 rounded transition-colors"
              >
                <Check size={9} /> Accept All
              </button>
              <button
                onClick={() => onRejectChanges(null)}
                title="Reject All"
                className="flex items-center gap-0.5 text-[9px] bg-[#F85149]/15 hover:bg-[#F85149]/25 text-[#F85149] border border-[#F85149]/30 px-1.5 py-0.5 rounded transition-colors"
              >
                <Ban size={9} /> Reject All
              </button>
            </div>
          </div>
          <div className="space-y-1.5">
            {filesChanged.map((fc, i) => (
              <div key={i} className="flex items-center justify-between bg-[#0D1522] border border-[#1E293B] rounded p-1.5 text-[10.5px]">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <span className={`text-[8.5px] font-bold px-1 rounded ${
                    fc.status === "A" ? "bg-[#3FB950]/20 text-[#3FB950]" :
                    fc.status === "D" ? "bg-[#F85149]/20 text-[#F85149]" :
                    "bg-[#D29922]/20 text-[#D29922]"
                  }`}>
                    {fc.status || "M"}
                  </span>
                  <span className="text-[#E6EDF3] font-mono truncate">{fc.path}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-1">
                  <button
                    onClick={() => onOpenDiffModal(fc.path, fc.originalContent, fc.newContent)}
                    title="View Diff"
                    className="p-1 hover:bg-[#1E293B] text-[#8B949E] hover:text-[#3794FF] rounded transition-colors"
                  >
                    <Eye size={11} />
                  </button>
                  <button
                    onClick={() => onAcceptChanges(fc.path)}
                    title="Accept this file"
                    className="p-1 hover:bg-[#3FB950]/20 text-[#3FB950] rounded transition-colors"
                  >
                    <Check size={11} />
                  </button>
                  <button
                    onClick={() => onRejectChanges(fc.path)}
                    title="Reject this file"
                    className="p-1 hover:bg-[#F85149]/20 text-[#F85149] rounded transition-colors"
                  >
                    <Ban size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Panel */}
      {showPerf && perfData && <PerfPanel perf={perfData} />}
    </div>
  );
}

/* -----------------------------------------
   MAIN PANEL
----------------------------------------- */
export default function AIAgentPanel({
  projectId,
  activeTabPath,
  openTabs = [],
  selectedCode = "",
  onApplyAgentChanges,
  onOpenDiffModal,
  onClose,
}) {
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("auto"); // 'auto' | 'fast' | 'smart' | 'autonomous'
  const [isLoading, setIsLoading] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [perfData, setPerfData] = useState(null);
  const [showPerf, setShowPerf] = useState(false);
  const [watchdogMsg, setWatchdogMsg] = useState(null);
  const [isFastPath, setIsFastPath] = useState(true);

  const { socket } = useSocketContext();

  const fetchLatestTask = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await axios.get(`${API_URL}/api/agent/history/${projectId}`);
      if (res.data && res.data.length > 0) {
        const latest = res.data[0];
        const activeStates = ["ANALYZING", "PLANNING", "EXECUTING", "RUNNING_COMMAND", "RUNNING_TESTS", "FIXING", "VERIFYING", "PAUSED"];
        if (activeStates.includes(latest.state)) {
          setActiveTask(latest);
          setIsLoading(true);
          setIsFastPath(latest.mode === "fast");
        }
      }
    } catch (_) {}
  }, [projectId]);

  useEffect(() => {
    fetchLatestTask();
  }, [fetchLatestTask]);

  useEffect(() => {
    if (!socket || !projectId) return;

    const handle = (data) => {
      if (data && (!data.projectId || data.projectId === projectId)) {
        setActiveTask((prev) => ({ ...prev, ...data, taskId: data.taskId || data._id }));
        setWatchdogMsg(null);
        if (data.mode === "fast" || data.mode === undefined) {
          setIsFastPath(true);
        } else {
          setIsFastPath(false);
        }
        if (["COMPLETED", "FAILED", "CANCELLED"].includes(data.state)) {
          setIsLoading(false);
        }
      }
    };

    const handlePerf = (data) => {
      setPerfData(data);
      setShowPerf(true);
    };

    const handleWatchdog = (data) => {
      if (data && data.taskId) setWatchdogMsg(data.message);
    };

    const handleFastPath = () => setIsFastPath(true);

    const handleCompleted = (data) => {
      handle(data);
      toast.success("AI Agent finished successfully!", { id: "agent_toast" });
      setShowPerf(true);
    };

    socket.on("agent:status", handle);
    socket.on("agent:plan", handle);
    socket.on("agent:completed", handleCompleted);
    socket.on("agent:perf", handlePerf);
    socket.on("agent:watchdog", handleWatchdog);
    socket.on("agent:fast_path", handleFastPath);

    return () => {
      socket.off("agent:status", handle);
      socket.off("agent:plan", handle);
      socket.off("agent:completed", handleCompleted);
      socket.off("agent:perf", handlePerf);
      socket.off("agent:watchdog", handleWatchdog);
      socket.off("agent:fast_path", handleFastPath);
    };
  }, [socket, projectId]);

  // Polling fallback while task is executing (ensures UI never gets stuck even if socket packet is missed)
  useEffect(() => {
    const tId = activeTask?._id || activeTask?.taskId;
    if (!isLoading || !tId) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/agent/task/${tId}`);
        if (res.data) {
          setActiveTask(prev => ({ ...prev, ...res.data }));
          if (["COMPLETED", "FAILED", "CANCELLED"].includes(res.data.state)) {
            setIsLoading(false);
            if (res.data.state === "COMPLETED") {
              toast.success("AI Agent finished successfully!", { id: "agent_toast" });
              setShowPerf(true);
              if (res.data.filesChanged && res.data.filesChanged.length > 0 && onApplyAgentChanges) {
                const target = res.data.filesChanged[0];
                if (target && target.newContent) {
                  onApplyAgentChanges(target.path, target.newContent);
                }
              }
            }
          }
        }
      } catch (_) {}
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, activeTask?._id, activeTask?.taskId, onApplyAgentChanges]);

  const handleRunAgent = async (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userPrompt = prompt.trim();
    setPrompt("");
    setIsLoading(true);
    setActiveTask(null);
    setPerfData(null);
    setShowPerf(false);
    setWatchdogMsg(null);

    const isExplicitFast = mode === "fast" || mode === "auto";
    setIsFastPath(isExplicitFast);

    try {
      const res = await axios.post(`${API_URL}/api/agent/task`, {
        projectId,
        prompt: userPrompt,
        activeFile: activeTabPath,
        selectedCode,
        openTabs,
        mode: mode === "auto" ? undefined : mode,
      });

      if (res.data) {
        setActiveTask(res.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to start AI Agent task");
      setIsLoading(false);
    }
  };

  const handleStop = async () => {
    if (!activeTask?._id && !activeTask?.taskId) return;
    const tId = activeTask._id || activeTask.taskId;
    try {
      await axios.post(`${API_URL}/api/agent/task/${tId}/stop`);
      toast.success("Agent stopped.");
      setIsLoading(false);
    } catch (_) {}
  };

  const handlePauseResume = async () => {
    if (!activeTask?._id && !activeTask?.taskId) return;
    const tId = activeTask._id || activeTask.taskId;
    const isPaused = activeTask.state === "PAUSED";
    try {
      const res = await axios.post(`${API_URL}/api/agent/task/${tId}/${isPaused ? "resume" : "pause"}`);
      if (res.data?.task) {
        setActiveTask(res.data.task);
        toast.success(isPaused ? "Resumed" : "Paused");
      }
    } catch (_) {}
  };

  const handleUndo = async () => {
    if (!activeTask?._id && !activeTask?.taskId) return;
    try {
      const res = await axios.post(`${API_URL}/api/agent/task/${activeTask._id || activeTask.taskId}/undo`);
      toast.success(res.data?.message || "Undo successful");
    } catch (_) {}
  };

  const handleRedo = async () => {
    if (!activeTask?._id && !activeTask?.taskId) return;
    try {
      const res = await axios.post(`${API_URL}/api/agent/task/${activeTask._id || activeTask.taskId}/redo`);
      toast.success(res.data?.message || "Redo successful");
    } catch (_) {}
  };

  const handleAcceptChanges = async (filePath = null) => {
    if (!activeTask?._id && !activeTask?.taskId) return;
    try {
      await axios.post(`${API_URL}/api/agent/task/${activeTask._id || activeTask.taskId}/approve`, { path: filePath });
      toast.success(filePath ? `Accepted ${filePath}` : "Accepted all changes");
    } catch (_) {}
  };

  const handleRejectChanges = async (filePath = null) => {
    if (!activeTask?._id && !activeTask?.taskId) return;
    try {
      await axios.post(`${API_URL}/api/agent/task/${activeTask._id || activeTask.taskId}/reject`, { path: filePath });
      toast.success("Rejected changes and restored snapshot");
    } catch (_) {}
  };

  const handleNewTask = () => {
    setActiveTask(null);
    setIsLoading(false);
    setPrompt("");
    setPerfData(null);
    setShowPerf(false);
    setWatchdogMsg(null);
  };

  const currentState = activeTask?.state || "IDLE";
  const isExecuting = ["ANALYZING", "PLANNING", "EXECUTING", "RUNNING_COMMAND", "RUNNING_TESTS", "FIXING", "VERIFYING"].includes(currentState);
  const showIdle = !activeTask && !isLoading;

  return (
    <aside className="w-72 sm:w-80 bg-[#0B111B] border-l border-[#1E293B] flex flex-col h-full shrink-0 select-none z-10 font-sans">
      {/* HEADER */}
      <div className="h-9 px-3 border-b border-[#172033] flex items-center justify-between text-[#8B949E] shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#A371F7]/20 flex items-center justify-center">
            <Bot size={10} className="text-[#A371F7]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E6EDF3]">AI Agent</span>

          {isExecuting && (
            <span className="flex items-center gap-1 text-[9px] font-medium text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded-full animate-pulse">
              <Loader2 size={9} className="animate-spin" /> {isFastPath ? "Fast Mode" : "Working..."}
            </span>
          )}

          {currentState === "COMPLETED" && (
            <span className="text-[9px] font-medium text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded-full">✓ Done</span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          {activeTask && (
            <>
              <button onClick={handleUndo} title="Undo changes" className="p-1 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors">
                <Undo2 size={12} />
              </button>
              <button onClick={handleRedo} title="Redo changes" className="p-1 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors">
                <Redo2 size={12} />
              </button>
            </>
          )}

          {isExecuting && (
            <button onClick={handlePauseResume} title={currentState === "PAUSED" ? "Resume" : "Pause"} className="p-1 text-[#D29922] hover:bg-[#151E2D] rounded transition-colors">
              {currentState === "PAUSED" ? <Play size={12} /> : <Pause size={12} />}
            </button>
          )}

          {isExecuting && (
            <button onClick={handleStop} title="Stop" className="p-1 text-[#F85149] hover:bg-[#151E2D] rounded transition-colors">
              <Square size={12} />
            </button>
          )}

          {perfData && (
            <button onClick={() => setShowPerf(v => !v)} title="Telemetry" className={`p-1 rounded transition-colors ${showPerf ? "text-[#A371F7] bg-[#151E2D]" : "text-[#6E7681] hover:text-[#A371F7]"}`}>
              <BarChart2 size={12} />
            </button>
          )}

          {activeTask && (
            <button onClick={handleNewTask} title="New Task" className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors">
              <RotateCcw size={12} />
            </button>
          )}

          {onClose && (
            <button onClick={onClose} title="Close" className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* WATCHDOG WARNING */}
      {watchdogMsg && (
        <div className="mx-3 mt-2 px-3 py-2 bg-[#D29922]/10 border border-[#D29922]/30 rounded-lg flex items-start gap-2">
          <AlertTriangle size={13} className="text-[#D29922] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#D29922] font-medium">Agent warning</p>
            <p className="text-[10px] text-[#8B949E] mt-0.5">{watchdogMsg}</p>
          </div>
          <button onClick={handleStop} className="text-[10px] text-[#F85149] border border-[#F85149]/30 px-1.5 py-0.5 rounded hover:bg-[#F85149]/10 shrink-0">Stop</button>
        </div>
      )}

      {/* BODY */}
      {showIdle ? (
        <IdleScreen
          onSuggestion={(text) => setPrompt(text)}
          selectedCode={selectedCode}
          activeTabPath={activeTabPath}
        />
      ) : (
        <ExecutionView
          activeTask={activeTask}
          onAcceptChanges={handleAcceptChanges}
          onRejectChanges={handleRejectChanges}
          onOpenDiffModal={onOpenDiffModal}
          perfData={perfData}
          showPerf={showPerf}
          isFastPath={isFastPath}
        />
      )}

      {/* BOTTOM INPUT & MODE TOGGLE */}
      <div className="p-3 border-t border-[#1E293B] bg-[#080E18] space-y-2 shrink-0">
        {/* Mode Selector */}
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[#6E7681] uppercase font-semibold tracking-wider text-[9px] flex items-center gap-1">
            <Sliders size={9} /> Mode
          </span>
          <div className="flex items-center bg-[#0D1522] border border-[#1E293B] rounded-md p-0.5">
            {[
              { key: "auto", label: "✨ Auto" },
              { key: "fast", label: "⚡ Fast" },
              { key: "smart", label: "🧠 Smart" },
              { key: "autonomous", label: "🤖 Auto" },
            ].map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                className={`px-1.5 py-0.5 rounded text-[9.5px] transition-colors ${
                  mode === m.key
                    ? "bg-[#A371F7]/25 text-[#E6EDF3] font-semibold"
                    : "text-[#6E7681] hover:text-[#8B949E]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleRunAgent}>
          <div className="relative flex items-end bg-[#0D1522] border border-[#1E293B] rounded-lg focus-within:border-[#A371F7]/60 transition-colors overflow-hidden">
            <textarea
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleRunAgent();
                }
              }}
              placeholder={isLoading ? "Agent is working..." : "Ask the AI agent anything..."}
              disabled={isLoading}
              rows={1}
              className="w-full bg-transparent text-[#E6EDF3] text-xs px-3 py-2.5 outline-none placeholder-[#3E4A5C] pr-9 resize-none disabled:opacity-50 scrollbar-thin"
              style={{ minHeight: "38px", maxHeight: "80px" }}
            />
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="absolute right-2 bottom-2 p-1.5 text-[#8B949E] hover:text-[#A371F7] disabled:opacity-30 transition-colors"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin text-[#A371F7]" /> : <Send size={14} />}
            </button>
          </div>
        </form>

        <div className="flex items-center gap-1 text-[10px] text-[#6E7681] overflow-x-auto scrollbar-none">
          <button
            onClick={() => setPrompt((p) => p + (activeTabPath ? ` @${activeTabPath} ` : " @src "))}
            className="flex items-center gap-1 bg-[#0D1522] hover:bg-[#151E2D] hover:text-[#E6EDF3] border border-[#1E293B] px-2 py-1 rounded-md transition-colors shrink-0"
          >
            <AtSign size={9} />
            <span>Context</span>
          </button>
          <button
            onClick={() => setPrompt("Run test suite and verify the build")}
            className="flex items-center gap-1 bg-[#0D1522] hover:bg-[#151E2D] hover:text-[#E6EDF3] border border-[#1E293B] px-2 py-1 rounded-md transition-colors shrink-0"
          >
            <PlaySquare size={9} />
            <span>Run Tests</span>
          </button>
          <button
            onClick={() => setPrompt("Generate automated unit tests for this module")}
            className="flex items-center gap-1 bg-[#0D1522] hover:bg-[#151E2D] hover:text-[#E6EDF3] border border-[#1E293B] px-2 py-1 rounded-md transition-colors shrink-0"
          >
            <Sparkles size={9} />
            <span>Generate</span>
          </button>
        </div>
        <p className="text-[9px] text-[#3E4A5C] text-center">Enter to run • Shift+Enter for newline</p>
      </div>
    </aside>
  );
}
