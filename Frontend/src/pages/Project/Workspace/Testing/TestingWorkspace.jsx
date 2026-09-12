import React, { useState } from "react";
import TestingHeader from "./TestingHeader";
import VisualRegressionViewer from "./VisualRegressionViewer";
import TestingInsights from "./TestingInsights";

export default function TestingWorkspace({
  projectId,
  projectName = "devcollab-webapp",
  onClose,
  showInsightsPanel = false
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [viewMode, setViewMode] = useState("split");
  const [insightsOpen, setInsightsOpen] = useState(showInsightsPanel);

  return (
    <div
      className={`flex-1 flex flex-col h-full bg-[#080D16] min-w-0 overflow-hidden select-none font-sans ${
        isFullScreen ? "fixed inset-0 z-50 bg-[#080D16]" : "relative"
      }`}
    >
      {/* 1. TESTING TOP HEADER */}
      <TestingHeader
        isFocused={isFocused}
        onToggleFocus={() => setIsFocused(!isFocused)}
        isFullScreen={isFullScreen}
        onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
        activeViewMode={viewMode}
        onChangeViewMode={setViewMode}
      />

      {/* 2. MAIN TESTING BODY (Canvas) */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Center Canvas */}
        <VisualRegressionViewer />

        {/* Right Testing Insights Panel (when standalone / fullscreen) */}
        {(insightsOpen || isFullScreen) && !isFocused && (
          <TestingInsights onClose={() => setInsightsOpen(false)} />
        )}
      </div>
    </div>
  );
}
