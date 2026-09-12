import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Layers,
  Eye,
  Sliders,
  Maximize2,
  X,
  Minimize2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  MoveHorizontal,
  Search,
  Bell,
  Activity,
  GitBranch,
  TrendingUp,
  FolderKanban,
  Server,
  Terminal,
  ShieldCheck
} from "lucide-react";
import { mockComparisonInfo } from "./mockTestingData";

export default function VisualRegressionViewer() {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 - 100
  const [isDragging, setIsDragging] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showE2EStream, setShowE2EStream] = useState(true);
  const [e2eStreamMinimized, setE2eStreamMinimized] = useState(false);

  const containerRef = useRef(null);

  // Mouse / Touch drag handlers for the vertical slider
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMove = (clientX) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(5, Math.min(95, (x / rect.width) * 100));
      setSliderPos(pct);
    };

    const onMouseMove = (e) => handleMove(e.clientX);
    const onTouchMove = (e) => {
      if (e.touches?.[0]) handleMove(e.touches[0].clientX);
    };

    const onEnd = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onEnd);
      window.addEventListener("touchmove", onTouchMove);
      window.addEventListener("touchend", onEnd);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onEnd);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [isDragging]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070C15] text-[#E6EDF3] relative overflow-y-auto select-none p-3 sm:p-4 font-sans custom-scrollbar">
      {/* ================= MAIN COMPARISON CANVAS CONTAINER ================= */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border border-[#1E293B] bg-[#0A0F1D] overflow-hidden flex min-h-[420px] lg:min-h-[460px] shadow-2xl shrink-0"
      >
        {/* LEFT PANEL: Baseline Screenshot */}
        <div
          className="h-full overflow-hidden flex flex-col bg-[#090E1A] border-r border-[#1E293B]/40 transition-[width] duration-75"
          style={{ width: `${sliderPos}%` }}
        >
          {/* Header Bar */}
          <div className="h-8 px-4 bg-[#0B111B] border-b border-[#1E293B] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                Baseline Screenshot
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-[#3794FF] border border-blue-500/25 font-semibold">
                Baseline: {mockComparisonInfo.baselineVersion}
              </span>
            </div>
            <span className="text-[10px] text-[#6E7681] font-mono hidden md:inline">
              1920 × 1080 (Chrome 124)
            </span>
          </div>

          {/* Screenshot Content (Mock UI) */}
          <div className="flex-1 p-3 sm:p-4 overflow-hidden flex items-center justify-center bg-[#070B14]">
            <MockDashboardView variant="baseline" />
          </div>
        </div>

        {/* DRAGGABLE VERTICAL SLIDER DIVIDER */}
        <div
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          style={{ left: `${sliderPos}%` }}
          className="absolute top-0 bottom-0 w-8 -ml-4 z-30 cursor-ew-resize flex flex-col items-center justify-between py-3 group select-none"
        >
          {/* Top Label */}
          <div className="flex items-center gap-1 bg-[#161B22]/95 border border-[#30363D] px-2 py-0.5 rounded-full text-[9px] font-mono text-[#8B949E] uppercase tracking-wider shadow-lg pointer-events-none backdrop-blur">
            <span className="text-[#3794FF] font-bold">Base</span>
            <span className="text-slate-600">|</span>
            <span className="text-[#F85149] font-bold">Cand</span>
          </div>

          {/* Top Vertical Spine Text */}
          <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-widest text-[#6E7681] rotate-90 my-auto pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity">
            <span className="text-[#3794FF]">Baseline</span>
            <span>-</span>
            <span className="text-[#F85149]">Candidate</span>
          </div>

          {/* Center Handle Button (Circular Knob with glowing ring) */}
          <div className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white text-[#0B111B] shadow-[0_0_16px_rgba(59,130,246,0.6)] flex items-center justify-center font-bold text-xs ring-2 ring-blue-500 transition-transform group-hover:scale-110">
            <MoveHorizontal size={14} strokeWidth={2.5} className="text-[#0B111B]" />
          </div>

          {/* Divider Colored Vertical Center Line */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-blue-500 via-purple-500 to-red-500 opacity-80 group-hover:opacity-100 transition-opacity pointer-events-none" />

          {/* Bottom Percentage Badge */}
          <div className="bg-[#161B22]/95 border border-[#30363D] px-2 py-0.5 rounded-full text-[9px] font-mono text-[#8B949E] shadow-lg pointer-events-none backdrop-blur">
            {sliderPos.toFixed(0)}%
          </div>
        </div>

        {/* RIGHT PANEL: Candidate Screenshot */}
        <div
          className="h-full overflow-hidden flex flex-col bg-[#0A0E1A] transition-[width] duration-75"
          style={{ width: `${100 - sliderPos}%` }}
        >
          {/* Header Bar */}
          <div className="h-8 px-4 bg-[#0B111B] border-b border-[#1E293B] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-tight">
                Candidate Screenshot
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-red-500/10 text-[#F85149] border border-red-500/25 font-semibold">
                Candidate: {mockComparisonInfo.candidateVersion}
              </span>
            </div>
            <span className="text-[10px] text-amber-400 font-mono font-bold hidden md:inline">
              Diff: {mockComparisonInfo.pixelMatchDiff}
            </span>
          </div>

          {/* Screenshot Content (Mock Candidate with subtle visual diff) */}
          <div className="flex-1 p-3 sm:p-4 overflow-hidden flex items-center justify-center bg-[#070B14]">
            <MockDashboardView variant="candidate" />
          </div>
        </div>
      </div>

      {/* ================= BOTTOM PIXEL MATCHER & HEATMAP ================= */}
      <div className="mt-3.5 rounded-2xl border border-[#1E293B] bg-[#0A0F1D] p-3.5 sm:p-4 shadow-xl shrink-0">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Pixel matcher:</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-semibold">
                4.5% deviation detected
              </span>
            </div>
            <span className="text-[11px] text-[#6E7681] hidden sm:inline">
              (624 pixels mismatch in action widget & probe tables)
            </span>
          </div>

          {/* Heatmap Toggle Switch (matching reference purple switch) */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-slate-300">Heatmap</span>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className={`w-10 h-5.5 rounded-full transition-colors relative p-0.5 flex items-center ${
                showHeatmap ? "bg-purple-600 shadow-sm shadow-purple-600/40" : "bg-[#1E293B]"
              }`}
              title="Toggle Heatmap Overlay"
            >
              <div
                className={`w-4.5 h-4.5 rounded-full bg-white transition-transform ${
                  showHeatmap ? "translate-x-4.5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Heatmap Thermal Canvas Preview */}
        {showHeatmap && (
          <div className="relative rounded-xl border border-[#1E293B] bg-[#050811] overflow-hidden p-3 shadow-inner">
            {/* Thermal Background Layout */}
            <div className="relative h-28 sm:h-32 w-full rounded-lg bg-gradient-to-r from-[#080d1a] via-[#0d1424] to-[#080d1a] border border-[#1E293B]/60 overflow-hidden flex items-center justify-between px-4">
              {/* Thermal Hotspots (Cyan -> Yellow -> Red Infrared Visuals) */}
              <div className="absolute inset-0 pointer-events-none opacity-85 bg-[radial-gradient(ellipse_at_25%_40%,rgba(56,189,248,0.7),transparent_35%),radial-gradient(ellipse_at_78%_35%,rgba(239,68,68,0.95),transparent_40%),radial-gradient(ellipse_at_80%_75%,rgba(234,179,8,0.85),transparent_35%),radial-gradient(ellipse_at_50%_60%,rgba(168,85,247,0.5),transparent_45%)]" />

              {/* Grid overlay lines */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

              {/* Labeled Heatmap Zones */}
              <div className="relative z-10 flex flex-col justify-between h-full py-2">
                <span className="text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded w-fit">
                  Zone A: Sidebar Layout (0.0% diff)
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded w-fit">
                  Zone B: Metric Header Cards (0.2% diff)
                </span>
              </div>

              <div className="relative z-10 flex flex-col justify-between items-end h-full py-2">
                <span className="text-[10px] font-mono font-bold text-white bg-red-600/90 border border-red-400 px-2.5 py-0.5 rounded shadow-lg animate-pulse">
                  CRITICAL DIFF: Action Widget (+4.5%)
                </span>
                <span className="text-[10px] font-mono text-amber-300 font-semibold bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                  Zone C: Probe Table (+1.2% delta)
                </span>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-[#6E7681] font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" /> Match
                <span className="w-2 h-2 rounded-full bg-amber-400 ml-2" /> Low Diff
                <span className="w-2 h-2 rounded-full bg-red-500 ml-2" /> High Deviation
              </span>
              <span>Algorithm: Pixelmatch Dual-Pass SSIM</span>
            </div>
          </div>
        )}
      </div>

      {/* ================= FLOATING E2E TEST STREAM (PIP WINDOW) ================= */}
      {showE2EStream && (
        <div
          className={`fixed bottom-12 left-20 z-40 bg-[#0B111B] border border-[#30363D] rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 backdrop-blur-xl ${
            e2eStreamMinimized ? "w-52 h-9" : "w-80 sm:w-96 h-52"
          }`}
        >
          {/* Window Header */}
          <div className="h-8 bg-[#161B22] px-3 flex items-center justify-between border-b border-[#30363D] cursor-move select-none">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-tight">
                E2E Test Stream
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[#8B949E]">
              <button
                onClick={() => setE2eStreamMinimized(!e2eStreamMinimized)}
                className="hover:text-white p-1 rounded hover:bg-[#21262D]"
                title="Minimize / Expand"
              >
                <Minimize2 size={12} />
              </button>
              <button
                onClick={() => setShowE2EStream(false)}
                className="hover:text-red-400 p-1 rounded hover:bg-[#21262D]"
                title="Close Stream"
              >
                <X size={12} />
              </button>
            </div>
          </div>

          {/* Video / Screen Stream Content */}
          {!e2eStreamMinimized && (
            <div className="p-2.5 h-[calc(100%-32px)] bg-black/95 flex flex-col justify-between relative group">
              <div className="h-full rounded-xl border border-[#21262D] bg-[#0D1117] p-3 flex flex-col justify-center items-center text-center relative overflow-hidden">
                {/* Mock automated test running animation */}
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center mb-1.5 shadow-inner">
                  <Play size={16} className="ml-0.5 fill-blue-400" />
                </div>
                <p className="text-xs font-bold text-white">
                  Headless Chromium v124
                </p>
                <p className="text-[10px] text-[#8B949E] font-mono mt-0.5">
                  e2e/dashboard_regression.spec.ts → running (2.35s)
                </p>
              </div>

              <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-[10px] font-mono text-[#8B949E] bg-[#161B22]/90 px-2.5 py-1 rounded-lg backdrop-blur border border-[#30363D]">
                <span className="text-red-400 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" /> REC ● 00:04
                </span>
                <span className="text-emerald-400 font-bold">FPS: 60</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Ultra High-fidelity Mock Dashboard Screen Preview matching screenshot
 */
function MockDashboardView({ variant = "baseline" }) {
  const isCandidate = variant === "candidate";

  return (
    <div className="w-full h-full max-w-[680px] max-h-[460px] rounded-xl border border-[#1E293B] bg-[#0B111B] flex flex-col overflow-hidden text-[10px] shadow-2xl select-none">
      {/* 1. App Top Navigation Header */}
      <div className="h-8 bg-[#0E1626] border-b border-[#1E293B] px-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[9px] font-extrabold shadow-sm">
            D
          </div>
          <span className="font-bold text-white text-xs tracking-tight">DevCollab</span>
          <span className="text-[9px] text-[#6E7681] font-mono">/ dashboard</span>
        </div>

        {/* Search bar placeholder */}
        <div className="w-36 h-4.5 rounded-md bg-[#162032] border border-[#1E293B] px-2 flex items-center text-[9px] text-[#6E7681]">
          <Search size={9} className="mr-1.5 text-[#6E7681]" />
          <span>Search metrics...</span>
        </div>

        {/* User avatar & notification */}
        <div className="flex items-center gap-2">
          <Bell size={11} className="text-[#6E7681]" />
          <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 ring-1 ring-white/20" />
        </div>
      </div>

      {/* 2. App Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-24 bg-[#090E17] border-r border-[#1E293B] p-2 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <div className="h-5 rounded-md bg-[#18233A] text-[#3794FF] px-1.5 font-bold flex items-center gap-1">
              <FolderKanban size={10} />
              <span>Dashboard</span>
            </div>
            <div className="h-5 rounded-md hover:bg-[#121927] text-[#8B949E] px-1.5 flex items-center gap-1">
              <GitBranch size={10} />
              <span>Repos</span>
            </div>
            <div className="h-5 rounded-md hover:bg-[#121927] text-[#8B949E] px-1.5 flex items-center gap-1">
              <Activity size={10} />
              <span>Activity</span>
            </div>
            <div className="h-5 rounded-md hover:bg-[#121927] text-[#8B949E] px-1.5 flex items-center gap-1">
              <Server size={10} />
              <span>Probes</span>
            </div>
          </div>

          <div className="text-[8px] text-[#6E7681] font-mono border-t border-[#1E293B] pt-1">
            v1.2.0-beta
          </div>
        </div>

        {/* Main Dashboard Canvas Body */}
        <div className="flex-1 p-3 overflow-hidden flex flex-col justify-between space-y-2 bg-gradient-to-b from-[#0B111B] to-[#070C15]">
          {/* Dashboard Header with Action Button */}
          <div className="flex items-center justify-between border-b border-[#1E293B] pb-1.5">
            <div>
              <h4 className="text-xs font-bold text-white tracking-tight">Engineering Overview</h4>
              <p className="text-[8px] text-[#8B949E]">Live workspace analytics & git health</p>
            </div>

            {/* Target Action Button with Difference Highlighting */}
            {isCandidate ? (
              <div className="relative">
                <div className="rounded-md bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold px-2.5 py-1 text-[9px] border border-red-400 shadow-md animate-pulse">
                  Altered Action
                </div>
                {/* Visual Difference Callout Badge */}
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[7px] font-mono font-bold px-1 rounded-full border border-white/40">
                  DIFF
                </span>
              </div>
            ) : (
              <div className="rounded-md bg-blue-600 text-white font-semibold px-2.5 py-1 text-[9px] shadow-sm">
                + New Action
              </div>
            )}
          </div>

          {/* 3 Top Metric Cards */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-[#1E293B] bg-[#10192A] p-2 flex flex-col justify-between">
              <span className="text-[8px] text-[#8B949E] uppercase font-bold tracking-wider">Total Repos</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-extrabold text-white">{isCandidate ? "5,207" : "4,207"}</span>
                <span className="text-[8px] text-emerald-400 font-bold">+12%</span>
              </div>
            </div>

            <div className="rounded-lg border border-[#1E293B] bg-[#10192A] p-2 flex flex-col justify-between">
              <span className="text-[8px] text-[#8B949E] uppercase font-bold tracking-wider">Open PRs</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-extrabold text-emerald-400">1,512</span>
                <span className="text-[8px] text-blue-400 font-bold">Live</span>
              </div>
            </div>

            <div className="rounded-lg border border-[#1E293B] bg-[#10192A] p-2 flex flex-col justify-between">
              <span className="text-[8px] text-[#8B949E] uppercase font-bold tracking-wider">Health Index</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-extrabold text-cyan-400">99.4%</span>
                <ShieldCheck size={11} className="text-emerald-400" />
              </div>
            </div>
          </div>

          {/* 2 Tables: Repositories and Probe Health */}
          <div className="grid grid-cols-2 gap-2 flex-1 min-h-0">
            {/* Repositories Table */}
            <div className="rounded-lg border border-[#1E293B] bg-[#0E1524] p-2 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-1">
                <span className="font-bold text-white text-[9px]">Repositories</span>
                <span className="text-[8px] text-blue-400">3 active</span>
              </div>
              <div className="space-y-1 mt-1 text-[8px] text-slate-300 font-mono">
                <div className="flex justify-between items-center border-b border-[#1E293B]/60 pb-0.5">
                  <span className="truncate max-w-[70px]">devcollab-core</span>
                  <span className="text-emerald-400 bg-emerald-500/10 px-1 rounded">main</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#1E293B]/60 pb-0.5">
                  <span className="truncate max-w-[70px]">frontend-v2</span>
                  <span className="text-blue-400 bg-blue-500/10 px-1 rounded">dev</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="truncate max-w-[70px]">backend-api</span>
                  <span className="text-purple-400 bg-purple-500/10 px-1 rounded">patch</span>
                </div>
              </div>
            </div>

            {/* Probe Node Table */}
            <div className={`rounded-lg border bg-[#0E1524] p-2 flex flex-col justify-between transition-all ${
              isCandidate ? "border-amber-500/40 bg-amber-950/10" : "border-[#1E293B]"
            }`}>
              <div className="flex items-center justify-between border-b border-[#1E293B] pb-1">
                <span className="font-bold text-white text-[9px]">Probe Metrics</span>
                <span className="text-[8px] text-emerald-400">Normal</span>
              </div>
              <div className="space-y-1 mt-1 text-[8px] text-slate-300 font-mono">
                <div className="flex justify-between items-center border-b border-[#1E293B]/60 pb-0.5">
                  <span>Latency</span>
                  <span className="text-cyan-400">{isCandidate ? "18ms" : "12ms"}</span>
                </div>
                <div className="flex justify-between items-center border-b border-[#1E293B]/60 pb-0.5">
                  <span>Uptime</span>
                  <span className="text-emerald-400">99.98%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Error Margin</span>
                  <span className="text-amber-400">0.02%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
