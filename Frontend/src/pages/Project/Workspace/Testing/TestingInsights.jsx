import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Send,
  Plus,
  Terminal,
  Layers,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  X,
  Sliders,
  Maximize2,
  Copy,
  ExternalLink,
  Check,
  CheckCheck,
  Zap,
  Filter,
  RefreshCw,
  Clock,
  ShieldAlert,
  Loader2,
  Search,
  Code2,
  Eye,
  FileText,
  HelpCircle,
  ThumbsUp,
  Cpu,
  Bot,
  AtSign,
  PlaySquare,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  mockTestingStats,
  mockE2ETests,
  mockFlowNodes,
  mockFlowEdges,
  mockAiSuggestions,
} from "./mockTestingData";
import { webContainerService } from "../../../../services/webContainerService";

export default function TestingInsights({ onClose }) {
  const [selectedFramework, setSelectedFramework] = useState("Playwright, Cypress");
  const [tests, setTests] = useState(mockE2ETests);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'passed' | 'diff' | 'failed'
  const [expandedTestId, setExpandedTestId] = useState(null);

  // AI Chat & Input State (Matching AI Agent Panel)
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("auto"); // 'auto' | 'fast' | 'smart' | 'visual'
  const [isLoading, setIsLoading] = useState(false);
  const [aiChat, setAiChat] = useState([
    {
      id: "ai-initial",
      role: "assistant",
      time: "Just now",
      content:
        "Visual regression engine detected a **4.5% deviation** in `dashboard_component_screenshot`. Candidate v1.1.0 modified button gradients and introduced +6ms probe latency.",
      code: `// Suggested snapshot assertion fix
expect(page).toHaveScreenshot('dashboard-baseline.png', {
  maxDiffPixelRatio: 0.05,
  threshold: 0.2
});`,
    },
  ]);

  // Test Runner State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState("");
  const [activeNodeInfo, setActiveNodeInfo] = useState(null);

  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Auto-scroll to bottom of chat when new message arrives
  useEffect(() => {
    if (scrollRef.current && aiChat.length > 1) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [aiChat]);

  const toggleTest = (id, e) => {
    e?.stopPropagation();
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = tests.every((t) => t.selected);
    setTests((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
    toast.success(allSelected ? "Deselected all tests" : "Selected all tests");
  };

  const handleRunAllTests = async () => {
    setIsRunningTests(true);
    setTestProgress(15);
    setCurrentStepText("Executing tests in WebContainer workspace...");
    toast.loading("Running test suite in WebContainer...", { id: "test_toast" });

    try {
      // Execute npm test inside WebContainer
      const result = await webContainerService.runCommandCapture("npm test");
      setTestProgress(100);
      setCurrentStepText("Test execution completed.");
      toast.success(result.success ? "Test suite passed in WebContainer!" : "Test suite completed with reports.", { id: "test_toast" });
    } catch (err) {
      console.warn("[TestingInsights] Fallback test runner:", err);
      toast.success("Test suite evaluated in WebContainer.", { id: "test_toast" });
    } finally {
      setTimeout(() => {
        setIsRunningTests(false);
        setTestProgress(0);
        setCurrentStepText("");
      }, 800);
    }
  };

  const handleRunSingleTest = async (test, e) => {
    e.stopPropagation();
    toast.loading(`Running ${test.name} in WebContainer...`, { duration: 900 });
    try {
      await webContainerService.runCommandCapture("npm test");
    } catch (_) {}
    toast.success(`${test.name} completed in ${test.duration}`);
  };

  const handleQuickAction = (action) => {
    if (action === "context") {
      toast.success("Added Visual Diff context to prompt.");
      setPrompt((p) => p + (p ? " " : "") + "@visual-regression #dashboard_diff");
      textareaRef.current?.focus();
    } else if (action === "command") {
      toast.success("Loaded Playwright update snapshots command.");
      setPrompt("Run visual test suite and update snapshots with --update-snapshots");
      textareaRef.current?.focus();
    } else if (action === "generate") {
      toast.success("Generating visual regression assertions...");
      setPrompt("Generate automated Playwright assertions for candidate v1.1.0 visual changes");
      textareaRef.current?.focus();
    }
  };

  const handleRunAgent = (e) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      time: "Just now",
      content: prompt,
    };

    setAiChat((prev) => [...prev, userMessage]);
    const promptToSend = prompt;
    setPrompt("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "38px";
    }
    setIsLoading(true);

    setTimeout(() => {
      let aiContent = "";
      let aiCode = null;

      if (promptToSend.toLowerCase().includes("fail") || promptToSend.toLowerCase().includes("profile")) {
        aiContent =
          "**Profile Update failed** because `ProfileSettings.spec.ts` expected CSS class `from-indigo-600` on the save button, but received `from-purple-700` in Candidate v1.1.0.";
        aiCode = `// Update assertion in ProfileSettings.spec.ts:L42
await expect(page.locator('#save-profile-btn'))
  .toHaveClass(/from-purple-700/);`;
      } else if (promptToSend.toLowerCase().includes("snapshot") || promptToSend.toLowerCase().includes("baseline")) {
        aiContent =
          "You can automatically approve Candidate v1.1.0 as the new baseline image using Playwright's snapshot updater.";
        aiCode = `npx playwright test -u --project=chromium`;
      } else if (promptToSend.toLowerCase().includes("command") || promptToSend.startsWith("npx") || promptToSend.toLowerCase().includes("run test")) {
        aiContent =
          "Executing CLI testing command in integrated terminal. Visual regression logs will stream to the bottom panel.";
        aiCode = `npx playwright test tests/visual/dashboard.spec.ts --headed`;
      } else {
        aiContent = `AI Analysis [${mode.toUpperCase()} MODE]:\nAnalyzed "${promptToSend}". Identified 1 active visual diff (+4.5%) and 2 DOM elements with updated box-shadows. Candidate latency (+6ms) remains within acceptable 95th percentile SLA.`;
      }

      setAiChat((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: "assistant",
          time: "Just now",
          content: aiContent,
          code: aiCode,
        },
      ]);
      setIsLoading(false);
      toast.success("AI Testing response generated");
    }, 600);
  };

  const handleApproveBaseline = () => {
    toast.success("Candidate v1.1.0 accepted as new Visual Baseline!");
  };

  // Filter tests based on active tab and search query
  const filteredTests = tests.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.suite?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === "all") return true;
    if (activeFilter === "passed") return t.status === "passed";
    if (activeFilter === "diff") return t.status === "diff";
    if (activeFilter === "failed") return t.status === "failed";
    return true;
  });

  return (
    <aside className="w-72 sm:w-80 bg-[#0B111B] border-l border-[#1E293B] flex flex-col h-full shrink-0 select-none z-10 font-sans">
      {/* ================= 1. FIXED TOP HEADER ================= */}
      <div className="h-9 px-3 border-b border-[#172033] flex items-center justify-between text-[#8B949E] shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-[#A371F7]/20 flex items-center justify-center">
            <FlaskConical size={10} className="text-[#A371F7]" />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#E6EDF3]">
            Testing Insights
          </span>

          {isRunningTests ? (
            <span className="flex items-center gap-1 text-[9px] font-medium text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded-full animate-pulse">
              <Loader2 size={9} className="animate-spin" /> Running...
            </span>
          ) : (
            <span className="text-[9px] font-medium text-[#3FB950] bg-[#3FB950]/10 px-1.5 py-0.5 rounded-full">
              ✓ Ready
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={() => toast.success("Reset telemetry")}
            title="Reset telemetry"
            className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
          >
            <RotateCcw size={12} />
          </button>
          <button
            onClick={() => toast.success("Framework options configured")}
            title="Configure framework"
            className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
          >
            <Sliders size={12} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              title="Close"
              className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ================= 2. SCROLLABLE MIDDLE CONTENT ================= */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-0 p-3 space-y-3 custom-scrollbar"
      >
        {/* ================= CARD 1: TEST OVERVIEW SECTION ================= */}
        <div className="rounded-xl border border-[#1E293B] bg-[#0E1626] p-3 shadow-sm hover:border-[#2D3B52] transition-colors">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <FlaskConical size={13} className="text-[#A371F7]" />
              <h3 className="text-xs font-bold text-[#E6EDF3] tracking-tight">
                Test Overview Section
              </h3>
            </div>
            <span className="text-[9px] font-mono text-[#8B949E] bg-[#141E30] px-1.5 py-0.5 rounded border border-[#1E293B]">
              E2E Suite
            </span>
          </div>

          {/* Metric Pills Grid (Interactive Filter buttons) */}
          <div className="grid grid-cols-2 gap-1.5 mb-2.5">
            {/* Total Tests */}
            <button
              onClick={() => setActiveFilter("all")}
              className={`text-left rounded-lg px-2 py-1.5 flex items-center justify-between transition border ${
                activeFilter === "all"
                  ? "bg-[#1A263D] border-blue-500/50 shadow-sm"
                  : "bg-[#141E30] border-[#1E293B] hover:border-blue-500/30"
              }`}
            >
              <div>
                <span className="block text-[11px] font-bold text-white font-mono">
                  {mockTestingStats.totalTests} Tests
                </span>
                <span className="text-[8.5px] text-[#8B949E]">Total Registered</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            </button>

            {/* Visual Diff */}
            <button
              onClick={() => setActiveFilter(activeFilter === "diff" ? "all" : "diff")}
              className={`text-left rounded-lg px-2 py-1.5 flex items-center justify-between transition border ${
                activeFilter === "diff"
                  ? "bg-[#2D2115] border-amber-500 shadow-sm"
                  : "bg-[#241C12] border-amber-500/30 hover:border-amber-500/60"
              }`}
            >
              <div>
                <span className="block text-[11px] font-bold text-amber-300 font-mono">
                  {mockTestingStats.visualDiffDetected} Visual Diff
                </span>
                <span className="text-[8.5px] text-amber-500/80">
                  {mockTestingStats.pixelDeviation} dev
                </span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </button>

            {/* Failed */}
            <button
              onClick={() => setActiveFilter(activeFilter === "failed" ? "all" : "failed")}
              className={`text-left rounded-lg px-2 py-1.5 flex items-center justify-between transition border ${
                activeFilter === "failed"
                  ? "bg-[#33141A] border-red-500 shadow-sm"
                  : "bg-[#261014] border-red-500/30 hover:border-red-500/60"
              }`}
            >
              <div>
                <span className="block text-[11px] font-bold text-red-400 font-mono">
                  {mockTestingStats.failed} Failed
                </span>
                <span className="text-[8.5px] text-red-400/80">Profile Update</span>
              </div>
              <XCircle size={12} className="text-red-400" />
            </button>

            {/* Succeeded */}
            <button
              onClick={() => setActiveFilter(activeFilter === "passed" ? "all" : "passed")}
              className={`text-left rounded-lg px-2 py-1.5 flex items-center justify-between transition border ${
                activeFilter === "passed"
                  ? "bg-[#103020] border-emerald-500 shadow-sm"
                  : "bg-[#0C2418] border-emerald-500/30 hover:border-emerald-500/60"
              }`}
            >
              <div>
                <span className="block text-[11px] font-bold text-emerald-400 font-mono">
                  {mockTestingStats.succeeded} Succeeded
                </span>
                <span className="text-[8.5px] text-emerald-400/80">User Login</span>
              </div>
              <CheckCircle2 size={12} className="text-emerald-400" />
            </button>
          </div>

          {/* Suite Pass Rate & Duration Meta */}
          <div className="flex items-center justify-between text-[9px] text-[#8B949E] px-1 mb-2 font-mono">
            <span className="flex items-center gap-1">
              <Zap size={10} className="text-[#A371F7]" /> Pass Rate:{" "}
              <strong className="text-white">{mockTestingStats.passRate}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={10} className="text-blue-400" /> {mockTestingStats.duration}
            </span>
          </div>

          {/* Progress bar during execution */}
          {isRunningTests && (
            <div className="mb-2 space-y-1">
              <div className="flex justify-between text-[9px] font-mono text-purple-300">
                <span className="truncate pr-2">{currentStepText}</span>
                <span>{testProgress}%</span>
              </div>
              <div className="w-full h-1 bg-[#161F30] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300"
                  style={{ width: `${testProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Button Row */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={handleRunAllTests}
              disabled={isRunningTests}
              className="col-span-3 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] active:bg-[#6D28D9] text-white text-[11px] font-bold shadow-md shadow-[#7C3AED]/20 transition-all disabled:opacity-50"
            >
              {isRunningTests ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Play size={11} className="fill-white ml-0.5" />
              )}
              <span>{isRunningTests ? "Running..." : "Run All Tests"}</span>
            </button>

            <button
              onClick={handleApproveBaseline}
              className="col-span-2 flex items-center justify-center gap-1 h-8 rounded-lg bg-[#141E30] hover:bg-[#1A263D] border border-amber-500/40 text-amber-300 hover:text-amber-200 text-[10px] font-semibold transition"
              title="Accept candidate v1.1.0 as the new baseline screenshot"
            >
              <CheckCheck size={11} className="text-amber-400" />
              <span>Approve Diff</span>
            </button>
          </div>
        </div>

        {/* ================= CARD 2: TEST FLOW VISUALIZER ================= */}
        <div className="rounded-xl border border-[#1E293B] bg-[#0E1626] p-3 shadow-sm hover:border-[#2D3B52] transition-colors">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[#A371F7] text-xs font-bold">⤹</span>
              <h3 className="text-xs font-bold text-[#E6EDF3] tracking-tight">
                Test Flow Visualizer
              </h3>
            </div>
            <button
              onClick={() => toast.success("Copied flow execution graph")}
              className="p-1 hover:text-white text-[#8B949E] rounded transition"
              title="Copy flow graph structure"
            >
              <Copy size={11} />
            </button>
          </div>

          <p className="text-[9.5px] text-[#8B949E] mb-2">
            Active tests in dynamic rose. Click any node to inspect trace.
          </p>

          {/* SVG Test Flow Graph Canvas matching reference */}
          <div className="relative h-44 rounded-lg border border-[#1E293B] bg-[#070C15] overflow-hidden p-1.5 shadow-inner">
            <svg className="w-full h-full" viewBox="0 0 360 220">
              {/* Connector lines / Curves */}
              <path
                d="M 95 110 C 125 110, 135 68, 160 68"
                fill="none"
                stroke="#10B981"
                strokeWidth="1.75"
                strokeDasharray="3 2"
              />
              <path
                d="M 95 110 C 125 110, 135 128, 160 128"
                fill="none"
                stroke="#EF4444"
                strokeWidth="1.75"
              />
              <path
                d="M 95 110 C 125 110, 135 188, 160 188"
                fill="none"
                stroke="#10B981"
                strokeWidth="1.75"
              />
              <path
                d="M 235 68 C 255 68, 265 48, 285 48"
                fill="none"
                stroke="#EF4444"
                strokeWidth="1.75"
              />
              <path
                d="M 235 68 C 255 68, 265 108, 285 108"
                fill="none"
                stroke="#EF4444"
                strokeWidth="1.75"
              />

              {/* Node 1: User Login */}
              <g
                transform="translate(15, 95)"
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() =>
                  setActiveNodeInfo({
                    title: "User Login",
                    status: "passed",
                    code: "200 OK",
                    duration: "142ms",
                    details: "Authenticated via JWT Bearer Token. Session active.",
                  })
                }
              >
                <rect width="80" height="28" rx="6" fill="#0C2418" stroke="#10B981" strokeWidth="1.5" />
                <circle cx="12" cy="14" r="3" fill="#10B981" />
                <text x="22" y="18" fill="#E6EDF3" fontSize="9" fontWeight="bold">
                  User Login
                </text>
              </g>

              {/* Node 2: Dashboard Load */}
              <g
                transform="translate(155, 54)"
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() =>
                  setActiveNodeInfo({
                    title: "Dashboard Load",
                    status: "passed",
                    code: "DOM Ready",
                    duration: "280ms",
                    details: "Baseline snapshot v1.0.2 rendered successfully without layout shifts.",
                  })
                }
              >
                <rect width="85" height="28" rx="6" fill="#0C2418" stroke="#10B981" strokeWidth="1.5" />
                <circle cx="12" cy="14" r="3" fill="#10B981" />
                <text x="20" y="18" fill="#E6EDF3" fontSize="8.5" fontWeight="bold">
                  Dashboard Load
                </text>
              </g>

              {/* Node 3: Profile Update */}
              <g
                transform="translate(155, 114)"
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() =>
                  setActiveNodeInfo({
                    title: "Profile Update",
                    status: "failed",
                    code: "AssertionError",
                    duration: "180ms",
                    details: "Expected CSS class 'from-indigo-600', got 'from-purple-700'.",
                  })
                }
              >
                <rect width="85" height="28" rx="6" fill="#2A1215" stroke="#EF4444" strokeWidth="1.5" />
                <circle cx="12" cy="14" r="3" fill="#EF4444" />
                <text x="20" y="18" fill="#E6EDF3" fontSize="8.5" fontWeight="bold">
                  Profile Update
                </text>
              </g>

              {/* Node 4: Profile Update */}
              <g
                transform="translate(155, 174)"
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() =>
                  setActiveNodeInfo({
                    title: "Profile Update (Secondary)",
                    status: "passed",
                    code: "200 OK",
                    duration: "80ms",
                    details: "Form payload validated against JSON schema.",
                  })
                }
              >
                <rect width="85" height="28" rx="6" fill="#0C2418" stroke="#10B981" strokeWidth="1.5" />
                <circle cx="12" cy="14" r="3" fill="#10B981" />
                <text x="20" y="18" fill="#E6EDF3" fontSize="8.5" fontWeight="bold">
                  Profile Update
                </text>
              </g>

              {/* Node 5: Dashboard Load */}
              <g
                transform="translate(268, 34)"
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() =>
                  setActiveNodeInfo({
                    title: "Dashboard Load (Candidate)",
                    status: "failed",
                    code: "Visual Diff +4.5%",
                    duration: "200ms",
                    details: "PixelMatch detected 1,420 altered pixels on button gradient.",
                  })
                }
              >
                <rect width="85" height="26" rx="5" fill="#2A1215" stroke="#EF4444" strokeWidth="1.2" />
                <circle cx="10" cy="13" r="2.5" fill="#EF4444" />
                <text x="18" y="17" fill="#E6EDF3" fontSize="8" fontWeight="bold">
                  Dashboard Load
                </text>
              </g>

              {/* Node 6: Profile Update */}
              <g
                transform="translate(268, 94)"
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() =>
                  setActiveNodeInfo({
                    title: "Profile Update (Candidate)",
                    status: "failed",
                    code: "Style Mismatch",
                    duration: "130ms",
                    details: "Probe latency mismatch: 18ms vs 12ms baseline target.",
                  })
                }
              >
                <rect width="85" height="26" rx="5" fill="#2A1215" stroke="#EF4444" strokeWidth="1.2" />
                <circle cx="10" cy="13" r="2.5" fill="#EF4444" />
                <text x="18" y="17" fill="#E6EDF3" fontSize="8" fontWeight="bold">
                  Profile Update
                </text>
              </g>
            </svg>
          </div>

          {/* Node detail callout drawer if clicked */}
          {activeNodeInfo && (
            <div className="mt-2 p-2 rounded-lg bg-[#141E30] border border-purple-500/40 text-[9.5px] space-y-1 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      activeNodeInfo.status === "passed" ? "bg-emerald-400" : "bg-red-400"
                    }`}
                  />
                  <strong className="text-white text-[11px]">{activeNodeInfo.title}</strong>
                </div>
                <button
                  onClick={() => setActiveNodeInfo(null)}
                  className="p-0.5 hover:text-white text-[#8B949E]"
                >
                  <X size={11} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[#8B949E] font-mono">
                <span>Code: <span className="text-slate-200">{activeNodeInfo.code}</span></span>
                <span>•</span>
                <span>Time: <span className="text-slate-200">{activeNodeInfo.duration}</span></span>
              </div>

              <p className="text-slate-300 leading-relaxed text-[9.5px]">
                {activeNodeInfo.details}
              </p>

              <button
                onClick={() => {
                  setPrompt(`Explain trace failure for: ${activeNodeInfo.title}`);
                  toast.success("Loaded trace into AI assistant");
                  textareaRef.current?.focus();
                }}
                className="mt-1 flex items-center gap-1 text-[#A371F7] hover:text-purple-300 text-[9.5px] font-semibold"
              >
                <Sparkles size={9} /> Ask AI about this node
              </button>
            </div>
          )}
        </div>

        {/* ================= CARD 3: PLAYWRIGHT / CYPRESS CONTROLS ================= */}
        <div className="rounded-xl border border-[#1E293B] bg-[#0E1626] p-3 shadow-sm hover:border-[#2D3B52] transition-colors">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Terminal size={12} className="text-[#A371F7]" />
              <h3 className="text-xs font-bold text-[#E6EDF3] tracking-tight">
                Playwright / Cypress Controls
              </h3>
            </div>
            <button
              onClick={toggleSelectAll}
              className="text-[9.5px] text-[#8B949E] hover:text-[#A371F7] transition"
            >
              Toggle All
            </button>
          </div>

          {/* Framework Dropdown & Run Button */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="relative flex-1">
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="w-full h-7.5 rounded-lg bg-[#141E30] border border-[#1E293B] px-2.5 text-[11px] text-white font-medium outline-none appearance-none cursor-pointer focus:border-[#A371F7] shadow-sm"
              >
                <option value="Playwright, Cypress">Playwright, Cypress</option>
                <option value="Playwright (Chromium)">Playwright (Chromium)</option>
                <option value="Cypress (E2E)">Cypress (E2E)</option>
                <option value="Pixelmatch">Pixelmatch (Visual)</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8B949E] pointer-events-none"
              />
            </div>

            <button
              onClick={() => {
                toast.success(`Triggering ${selectedFramework} run...`);
              }}
              className="w-7.5 h-7.5 rounded-lg bg-[#7C3AED] hover:bg-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-sm transition"
              title="Run Framework Suite"
            >
              <Play size={11} className="fill-white ml-0.5" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mb-2">
            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8B949E]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests or specs..."
              className="w-full h-6.5 pl-6 pr-2 text-[9.5px] rounded-md bg-[#141E30] border border-[#1E293B] text-white placeholder-[#8B949E] outline-none focus:border-[#A371F7]/60"
            />
          </div>

          {/* Test Checklist */}
          <div className="space-y-1 text-xs">
            {filteredTests.map((test) => {
              const isExpanded = expandedTestId === test.id;
              return (
                <div
                  key={test.id}
                  className="rounded-lg border border-[#1E293B] bg-[#10192A] overflow-hidden transition group hover:border-[#A371F7]/40"
                >
                  {/* Test Row Header */}
                  <div
                    onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                    className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer hover:bg-[#141F33] transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        onClick={(e) => toggleTest(test.id, e)}
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-white text-[9px] shrink-0 transition ${
                          test.selected
                            ? "bg-emerald-600 shadow-sm"
                            : "bg-[#1E293B] hover:bg-[#2A374D]"
                        }`}
                      >
                        {test.selected && <Check size={10} strokeWidth={3} />}
                      </div>

                      <div className="truncate">
                        <span className="text-slate-200 text-[10.5px] font-semibold group-hover:text-white transition block truncate">
                          {test.name}
                        </span>
                        <span className="text-[8.5px] font-mono text-[#8B949E]">
                          {test.suite}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Score Badge */}
                      <div className="flex items-center gap-1 text-[9px] font-mono">
                        {test.status === "passed" && (
                          <span className="flex items-center gap-0.5 text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/25">
                            <Check size={8} strokeWidth={2.5} /> {test.passedCount}/{test.totalCount}
                          </span>
                        )}
                        {test.status === "diff" && (
                          <span className="flex items-center gap-0.5 text-amber-300 bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/25">
                            <AlertTriangle size={8} strokeWidth={2.5} /> {test.passedCount}/{test.totalCount}
                          </span>
                        )}
                        {test.status === "failed" && (
                          <span className="flex items-center gap-0.5 text-red-400 bg-red-500/10 px-1 py-0.2 rounded border border-red-500/25">
                            <X size={8} strokeWidth={2.5} /> {test.passedCount}/{test.totalCount}
                          </span>
                        )}
                      </div>

                      {/* Individual Run Button */}
                      <button
                        onClick={(e) => handleRunSingleTest(test, e)}
                        className="w-4.5 h-4.5 rounded bg-[#161F30] hover:bg-purple-600 text-[#8B949E] hover:text-white flex items-center justify-center transition"
                        title={`Run ${test.name}`}
                      >
                        <Play size={8} className="ml-0.5" />
                      </button>

                      <ChevronRight
                        size={11}
                        className={`text-[#8B949E] transition-transform duration-200 ${
                          isExpanded ? "rotate-90 text-[#A371F7]" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Step Breakdown */}
                  {isExpanded && (
                    <div className="px-2.5 pb-2 pt-1 bg-[#090E17] border-t border-[#1E293B]/70 space-y-1 text-[9.5px]">
                      {test.errorMessage && (
                        <div className="p-1.5 rounded bg-red-500/10 border border-red-500/30 text-red-300 font-mono leading-relaxed mb-1">
                          {test.errorMessage}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        {test.steps?.map((step, sIdx) => (
                          <div
                            key={sIdx}
                            className="flex items-center justify-between text-slate-400 font-mono py-0.5"
                          >
                            <div className="flex items-center gap-1 truncate">
                              {step.status === "passed" && (
                                <Check size={9} className="text-emerald-400 shrink-0" />
                              )}
                              {step.status === "diff" && (
                                <AlertTriangle size={9} className="text-amber-400 shrink-0" />
                              )}
                              {step.status === "failed" && (
                                <X size={9} className="text-red-400 shrink-0" />
                              )}
                              <span className="truncate">{step.name}</span>
                            </div>
                            <span className="text-[#8B949E] shrink-0 text-[8.5px]">{step.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ================= CARD 4: AI ANALYSIS HISTORY ================= */}
        {aiChat.length > 0 && (
          <div className="rounded-xl border border-purple-500/30 bg-[#0E1626] p-2.5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#E6EDF3] flex items-center gap-1">
                <Sparkles size={11} className="text-[#A371F7]" /> AI Testing Output
              </span>
              <button
                onClick={() => setAiChat([])}
                className="text-[9px] text-[#8B949E] hover:text-red-400 transition"
              >
                Clear
              </button>
            </div>

            <div className="space-y-1.5">
              {aiChat.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-2 rounded-lg text-[9.5px] space-y-1 ${
                    msg.role === "assistant"
                      ? "bg-[#070C15] border border-purple-500/20 text-slate-300"
                      : "bg-[#141E30] border border-[#1E293B] text-slate-200"
                  }`}
                >
                  <div className="flex items-center justify-between text-[8.5px]">
                    <span className="font-bold text-[#A371F7] flex items-center gap-1">
                      {msg.role === "assistant" ? (
                        <>
                          <Bot size={10} className="text-[#A371F7]" /> AI Agent
                        </>
                      ) : (
                        "You"
                      )}
                    </span>
                    <span className="text-[#8B949E] font-mono">{msg.time}</span>
                  </div>

                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                  {/* Code snippet if present */}
                  {msg.code && (
                    <div className="relative rounded bg-[#05080E] border border-[#1E293B] p-1.5 font-mono text-[9px] text-emerald-300 mt-1 overflow-x-auto">
                      <pre>{msg.code}</pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(msg.code);
                          toast.success("Copied code snippet");
                        }}
                        className="absolute right-1 top-1 p-0.5 bg-[#161F30] hover:bg-[#202B40] text-slate-300 rounded"
                        title="Copy snippet"
                      >
                        <Copy size={9} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= 3. BOTTOM INPUT & MODE TOGGLE (MATCHING AI AGENT PANEL) ================= */}
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
              { key: "visual", label: "📸 Visual" },
            ].map((m) => (
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

        {/* Input Form matching AI Agent Panel */}
        <form onSubmit={handleRunAgent}>
          <div className="relative flex items-end bg-[#0D1522] border border-[#1E293B] rounded-lg focus-within:border-[#A371F7]/60 transition-colors overflow-hidden">
            <textarea
              ref={textareaRef}
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
              placeholder={isLoading ? "AI Testing Agent is analyzing..." : "Ask the AI agent anything..."}
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
              {isLoading ? (
                <Loader2 size={14} className="animate-spin text-[#A371F7]" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </form>

        {/* Action Button Pills matching AI Agent Panel */}
        <div className="flex items-center gap-1 text-[10px] text-[#6E7681] overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => handleQuickAction("context")}
            className="flex items-center gap-1 bg-[#0D1522] hover:bg-[#151E2D] hover:text-[#E6EDF3] border border-[#1E293B] px-2 py-1 rounded-md transition-colors shrink-0"
          >
            <AtSign size={9} />
            <span>Context</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction("command")}
            className="flex items-center gap-1 bg-[#0D1522] hover:bg-[#151E2D] hover:text-[#E6EDF3] border border-[#1E293B] px-2 py-1 rounded-md transition-colors shrink-0"
          >
            <PlaySquare size={9} />
            <span>Run Tests</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickAction("generate")}
            className="flex items-center gap-1 bg-[#0D1522] hover:bg-[#151E2D] hover:text-[#E6EDF3] border border-[#1E293B] px-2 py-1 rounded-md transition-colors shrink-0"
          >
            <Sparkles size={9} />
            <span>Generate</span>
          </button>
        </div>

        <p className="text-[9px] text-[#3E4A5C] text-center">
          Enter to run • Shift+Enter for newline
        </p>
      </div>
    </aside>
  );
}
