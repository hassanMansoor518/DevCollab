import React from "react";
import { Check, Eye, AlertTriangle, Layers, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { mockTestingStats, mockVisualDiffLogs } from "./mockTestingData";

export default function VisualDiffReportTab() {
  return (
    <div className="h-full w-full bg-[#080D16] text-[#E6EDF3] p-3.5 flex flex-col md:flex-row items-stretch justify-between gap-4 font-mono select-text overflow-y-auto">
      {/* LEFT: Testing Logs & Playwright Output */}
      <div className="flex-1 space-y-1.5 text-xs">
        <p className="text-[#6E7681] italic font-mono text-[11px]">
          // Additional logs in Terminal tab
        </p>

        <div className="space-y-1 pt-1">
          <p className="text-[#C9D1D9]">
            Playwright detected differences in <span className="text-cyan-400 font-semibold">dashboard_component_screenshot</span> <span className="text-[#8B949E]">(6.33ms)</span>
          </p>
          <p className="text-[#C9D1D9]">
            PixelMatch detected differences in <span className="text-cyan-400 font-semibold">dashboard_component_screenshot</span> <span className="text-amber-400 font-semibold">(4.5%)</span>
          </p>
          <p className="text-[#C9D1D9]">
            Playwright detected differences in <span className="text-cyan-400 font-semibold">dashboard_component_screenshot</span> <span className="text-[#8B949E]">(2.35ms)</span>
          </p>
          <p className="text-emerald-400 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            E2E Test Stream recording saved: <span className="underline decoration-dotted cursor-pointer">user_login.mp4</span>
          </p>
          <p className="text-purple-300 font-semibold pt-1">
            All 3 E2E tests completed. 1 visual change accepted.
          </p>
        </div>
      </div>

      {/* RIGHT: Deviation Stats & Action Buttons */}
      <div className="w-full md:w-64 shrink-0 rounded-xl border border-[#1E293B] bg-[#0E1626] p-3 flex flex-col justify-between space-y-2.5 font-sans">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8B949E]">Total Screen Changes:</span>
            <span className="font-bold text-amber-400 font-mono">{mockTestingStats.totalScreenChanges}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#8B949E]">Total Pixel Deviation:</span>
            <span className="font-bold text-red-400 font-mono">{mockTestingStats.pixelDeviation}</span>
          </div>
        </div>

        {/* View Affected Screen Buttons */}
        <div className="space-y-1.5 pt-1">
          <button
            onClick={() => toast.success("Inspecting Screen 1 (Dashboard Baseline vs Candidate)")}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] text-xs font-semibold text-[#E6EDF3] py-1.5 transition"
          >
            <Eye size={13} className="text-blue-400" />
            <span>View Screen 1 (Affected)</span>
          </button>

          <button
            onClick={() => toast.success("Inspecting Screen 2 (Profile Metric Component)")}
            className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-[#30363D] bg-[#161B22] hover:bg-[#21262D] text-xs font-semibold text-[#E6EDF3] py-1.5 transition"
          >
            <Eye size={13} className="text-purple-400" />
            <span>View Screen 2 (Affected)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
