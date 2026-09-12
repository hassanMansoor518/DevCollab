import React from "react";
import {
  ChevronRight,
  Columns,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Sparkles,
  Sliders,
  Eye,
  Layers,
  FlaskConical
} from "lucide-react";

export default function TestingHeader({
  isFocused = false,
  onToggleFocus,
  isFullScreen = false,
  onToggleFullScreen,
  activeViewMode = "split",
  onChangeViewMode
}) {
  return (
    <div className="h-10 bg-[#0B111B] border-b border-[#172033] px-4 flex items-center justify-between select-none shrink-0 font-sans z-10">
      {/* LEFT: Breadcrumb & Title */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1 text-[11px] text-[#6E7681] truncate">
          <span>src</span>
          <ChevronRight size={11} className="text-[#484F58]" />
          <span>pages</span>
          <ChevronRight size={11} className="text-[#484F58]" />
          <span>CodeEditor.jsx</span>
          <ChevronRight size={11} className="text-[#484F58]" />
          <span className="text-[#3794FF] font-medium flex items-center gap-1">
            <FlaskConical size={12} />
            Visual Regression
          </span>
        </div>

        <div className="w-[1px] h-3.5 bg-[#1E293B] mx-1 hidden sm:block" />

        <h1 className="text-xs font-semibold text-[#E6EDF3] tracking-tight truncate hidden md:block">
          Image Diff & Pixel-Match Canvas
        </h1>
      </div>

      {/* RIGHT: Focus Testing, View Controls, Fullscreen, More */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-[#8B949E] hidden lg:inline">
          Focus Testing
        </span>

        {/* Focus Testing Button */}
        <button
          onClick={onToggleFocus}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-white shadow-sm transition-all ${
            isFocused
              ? "bg-[#6D28D9] ring-2 ring-[#8B5CF6]/50 shadow-[#6D28D9]/40"
              : "bg-[#7C3AED] hover:bg-[#8B5CF6] shadow-[#7C3AED]/30"
          }`}
          title="Focus on testing canvas"
        >
          <Sparkles size={13} className="text-purple-200" />
          <span>Focus Testing</span>
        </button>

        {/* View Layout Split / Slider icons */}
        <div className="flex items-center bg-[#151E2D] border border-[#1E293B] rounded-md p-0.5 ml-1">
          <button
            onClick={() => onChangeViewMode?.("split")}
            className={`p-1 rounded transition-colors ${
              activeViewMode === "split" ? "bg-[#1E293B] text-[#3794FF]" : "text-[#8B949E] hover:text-[#E6EDF3]"
            }`}
            title="Side-by-side split view"
          >
            <Columns size={13} />
          </button>
          <button
            onClick={() => onChangeViewMode?.("slider")}
            className={`p-1 rounded transition-colors ${
              activeViewMode === "slider" ? "bg-[#1E293B] text-[#3794FF]" : "text-[#8B949E] hover:text-[#E6EDF3]"
            }`}
            title="Draggable slider view"
          >
            <Sliders size={13} />
          </button>
        </div>

        {/* Fullscreen Button with Tooltip */}
        <div className="relative group">
          <button
            onClick={onToggleFullScreen}
            className="p-1.5 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded border border-transparent hover:border-[#1E293B] transition-colors"
            title="Pop-out to Full-Screen View"
          >
            {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Floating Tooltip matching screenshot */}
          <div className="absolute right-0 top-full mt-1.5 hidden group-hover:flex items-center gap-1 bg-[#161B22] text-[#E6EDF3] text-[10px] font-medium px-2.5 py-1 rounded shadow-lg border border-[#30363D] whitespace-nowrap z-50 pointer-events-none">
            <span>Pop-out to Full-Screen View</span>
          </div>
        </div>

        {/* More options */}
        <button
          className="p-1.5 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded border border-transparent hover:border-[#1E293B] transition-colors"
          title="More Testing Options"
        >
          <MoreHorizontal size={14} />
        </button>
      </div>
    </div>
  );
}
