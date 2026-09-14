import React from "react";
import { GitBranch, RefreshCw, AlertCircle, AlertTriangle, Info, GitFork, Bot, Radio, Cpu } from "lucide-react";

export default function StatusBar({
  branch = "main",
  errorCount = 0,
  warningCount = 3,
  infoCount = 0,
  cursorPos = { line: 32, col: 15 },
  spaces = 2,
  encoding = "UTF-8",
  eol = "LF",
  language = "JavaScript React",
  aiAgentStatus = "Connected",
  wcStatus = "ready",
  devServer = null,
  onOpenPreview = null
}) {
  return (
    <footer className="h-6 bg-[#0B111B] border-t border-[#1E293B] px-3 flex items-center justify-between text-[11px] text-[#8B949E] select-none shrink-0 z-20 font-mono">
      {/* Left side info */}
      <div className="flex items-center gap-3">
        {/* Branch */}
        <div className="flex items-center gap-1 hover:text-[#E6EDF3] cursor-pointer transition-colors">
          <GitBranch size={12} className="text-[#3794FF]" />
          <span className="text-[#E6EDF3] font-medium">{branch}</span>
        </div>

        {/* Git Sync */}
        <div className="flex items-center gap-1 hover:text-[#E6EDF3] cursor-pointer transition-colors" title="Synchronize Changes">
          <RefreshCw size={11} className="hover:rotate-180 transition-transform duration-300" />
        </div>

        {/* Problems Counters */}
        <div className="flex items-center gap-2 hover:text-[#E6EDF3] cursor-pointer transition-colors">
          <span className="flex items-center gap-0.5">
            <AlertCircle size={12} className="text-[#F85149]" />
            <span>{errorCount}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <AlertTriangle size={12} className="text-[#D29922]" />
            <span>{warningCount}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <Info size={12} className="text-[#3794FF]" />
            <span>{infoCount}</span>
          </span>
        </div>

        {/* Git Graph */}
        <div className="hidden sm:flex items-center gap-1 hover:text-[#E6EDF3] cursor-pointer transition-colors">
          <GitFork size={12} />
          <span>Git Graph</span>
        </div>
      </div>

      {/* Right side info */}
      <div className="flex items-center gap-4">
        {/* Line & Column */}
        <div className="hover:text-[#E6EDF3] cursor-pointer transition-colors">
          Ln {cursorPos.line}, Col {cursorPos.col}
        </div>

        {/* Indentation */}
        <div className="hidden md:block hover:text-[#E6EDF3] cursor-pointer transition-colors">
          Spaces: {spaces}
        </div>

        {/* Encoding */}
        <div className="hidden md:block hover:text-[#E6EDF3] cursor-pointer transition-colors">
          {encoding}
        </div>

        {/* End of Line */}
        <div className="hidden md:block hover:text-[#E6EDF3] cursor-pointer transition-colors">
          {eol}
        </div>

        {/* Language Mode */}
        <div className="hover:text-[#E6EDF3] cursor-pointer transition-colors">
          {language}
        </div>

        {/* Dev Server Indicator */}
        {devServer && devServer.status === "running" && (
          <div
            onClick={onOpenPreview}
            title={`Dev Server active on port ${devServer.port} - Click to open live preview`}
            className="flex items-center gap-1.5 text-[#38BDF8] hover:text-white cursor-pointer bg-[#0A2239] px-2 py-0.5 rounded border border-[#1A4B75] transition-colors"
          >
            <Radio size={11} className="text-[#4ADE80] animate-pulse" />
            <span className="font-semibold">{devServer.framework || "Dev"}:{devServer.port}</span>
          </div>
        )}

        {/* WebContainer Environment Status */}
        <div className="flex items-center gap-1.5 text-[#E6EDF3] font-sans hover:opacity-80 cursor-pointer" title={`WebContainer: ${wcStatus}`}>
          <Cpu size={12} className="text-[#38BDF8]" />
          <span>WebContainer</span>
          <span
            className={`w-2 h-2 rounded-full ${
              wcStatus === "ready"
                ? "bg-[#3FB950] animate-pulse"
                : wcStatus === "error"
                ? "bg-[#F85149]"
                : "bg-[#FBBF24] animate-spin"
            }`}
          />
          <span className="text-[10px] font-medium hidden sm:inline capitalize text-[#8B949E]">
            {wcStatus === "ready" ? "Ready" : wcStatus === "error" ? "Error" : "Starting..."}
          </span>
        </div>

        {/* AI Agent Status */}
        <div className="flex items-center gap-1.5 text-[#E6EDF3] font-sans hover:opacity-80 cursor-pointer">
          <Bot size={13} className="text-[#3794FF]" />
          <span>AI Agent</span>
          <span className="w-2 h-2 rounded-full bg-[#3FB950] animate-pulse" />
          <span className="text-[#3FB950] text-[10px] font-medium hidden sm:inline">{aiAgentStatus}</span>
        </div>
      </div>
    </footer>
  );
}
