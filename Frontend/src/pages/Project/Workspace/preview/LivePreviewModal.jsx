import React, { useState, useRef } from "react";
import {
  X,
  RotateCw,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Copy,
  Check,
  Radio,
  Sparkles,
  AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";

export default function LivePreviewModal({
  isOpen,
  onClose,
  previewUrl,
  directUrl,
  port = 5173,
  framework = "Vite",
  status = "running",
  projectName = "DevCollab Project",
  onRestartServer,
  onStartServer
}) {
  const [deviceMode, setDeviceMode] = useState("responsive"); // 'responsive' | 'desktop' | 'tablet' | 'mobile'
  const [iframeKey, setIframeKey] = useState(Date.now());
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef(null);

  if (!isOpen) return null;

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(Date.now());
  };

  const normalizedPreviewUrl = previewUrl
    ? (previewUrl.endsWith("/") ? previewUrl : `${previewUrl}/`)
    : `/api/project/preview/${port}/`;

  const handleCopyUrl = () => {
    const fullUrl = normalizedPreviewUrl.startsWith("http")
      ? normalizedPreviewUrl
      : `${window.location.origin}${normalizedPreviewUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast.success("Preview URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine viewport width style
  const getDeviceWidth = () => {
    switch (deviceMode) {
      case "mobile":
        return "w-[375px] h-[667px] my-auto";
      case "tablet":
        return "w-[768px] h-[90%] my-auto";
      case "desktop":
        return "w-[1024px] h-[95%] my-auto";
      case "responsive":
      default:
        return "w-full h-full";
    }
  };

  const activeDisplayUrl = normalizedPreviewUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-6xl h-[88vh] bg-[#0B1220] border border-[#1E293B] rounded-xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* 1. TOP BROWSER CHROME BAR */}
        <div className="h-12 bg-[#080D17] border-b border-[#172033] px-3 flex items-center justify-between select-none shrink-0 gap-3">
          
          {/* Left: Window Dots & Navigation Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="w-3 h-3 rounded-full bg-[#EF4444]/80" />
              <span className="w-3 h-3 rounded-full bg-[#EAB308]/80" />
              <span className="w-3 h-3 rounded-full bg-[#22C55E]/80" />
            </div>

            <button
              onClick={handleReload}
              title="Reload Preview"
              className="p-1.5 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
            >
              <RotateCw size={13} className={isLoading ? "animate-spin text-[#38BDF8]" : ""} />
            </button>
          </div>

          {/* Center: Address Bar */}
          <div className="flex-1 max-w-xl flex items-center bg-[#131C2D] border border-[#202E44] rounded-lg px-3 py-1 text-xs text-[#E6EDF3] shadow-inner font-mono truncate">
            <Radio size={12} className={`mr-2 shrink-0 ${status === "running" ? "text-[#4ADE80] animate-pulse" : "text-[#F87171]"}`} />
            <span className="truncate text-[#94A3B8] mr-2">{activeDisplayUrl}</span>
            
            <div className="ml-auto flex items-center gap-1 shrink-0">
              <span className="bg-[#38BDF8]/15 text-[#38BDF8] text-[10px] px-1.5 py-0.2 rounded font-mono font-semibold uppercase">
                {framework} : {port}
              </span>
              <button
                onClick={handleCopyUrl}
                title="Copy URL"
                className="p-1 hover:text-white text-[#64748B] transition-colors"
              >
                {copied ? <Check size={11} className="text-[#4ADE80]" /> : <Copy size={11} />}
              </button>
            </div>
          </div>

          {/* Right: Device Switchers & Actions */}
          <div className="flex items-center gap-1.5 text-[#8B949E]">
            {/* Viewport switchers */}
            <div className="hidden sm:flex items-center bg-[#131C2D] border border-[#202E44] p-0.5 rounded-lg mr-1">
              <button
                onClick={() => setDeviceMode("responsive")}
                title="Full Responsive"
                className={`p-1 rounded ${deviceMode === "responsive" ? "bg-[#1E293B] text-[#38BDF8]" : "hover:text-[#E6EDF3]"}`}
              >
                <Monitor size={13} />
              </button>
              <button
                onClick={() => setDeviceMode("desktop")}
                title="Desktop View (1024px)"
                className={`p-1 rounded ${deviceMode === "desktop" ? "bg-[#1E293B] text-[#38BDF8]" : "hover:text-[#E6EDF3]"}`}
              >
                <Laptop size={13} />
              </button>
              <button
                onClick={() => setDeviceMode("tablet")}
                title="Tablet View (768px)"
                className={`p-1 rounded ${deviceMode === "tablet" ? "bg-[#1E293B] text-[#38BDF8]" : "hover:text-[#E6EDF3]"}`}
              >
                <Tablet size={13} />
              </button>
              <button
                onClick={() => setDeviceMode("mobile")}
                title="Mobile View (375px)"
                className={`p-1 rounded ${deviceMode === "mobile" ? "bg-[#1E293B] text-[#38BDF8]" : "hover:text-[#E6EDF3]"}`}
              >
                <Smartphone size={13} />
              </button>
            </div>

            {/* Open in New Window */}
            <a
              href={activeDisplayUrl}
              target="_blank"
              rel="noreferrer"
              title="Open in External Browser Tab"
              className="p-1.5 text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
            >
              <ExternalLink size={14} />
            </a>

            {/* Close Modal */}
            <button
              onClick={onClose}
              title="Close Live Preview"
              className="p-1.5 text-[#8B949E] hover:text-[#F87171] hover:bg-[#151E2D] rounded transition-colors ml-1"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* 2. MAIN IFRAME VIEWPORT CONTAINER */}
        <div className="flex-1 w-full h-full bg-[#070B12] flex items-center justify-center overflow-hidden p-2 relative">
          
          {/* Iframe Viewport */}
          <div
            className={`relative transition-all duration-200 bg-white rounded-lg shadow-2xl overflow-hidden ${getDeviceWidth()}`}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-[#0B1220] flex flex-col items-center justify-center text-center p-6 z-10">
                <div className="w-10 h-10 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin mb-3" />
                <div className="text-sm font-semibold text-[#E6EDF3]">Loading DevCollab Live Preview...</div>
                <div className="text-xs text-[#64748B] mt-1 font-mono">{activeDisplayUrl}</div>
              </div>
            )}

            <iframe
              key={iframeKey}
              ref={iframeRef}
              src={activeDisplayUrl}
              title={`DevCollab Live Preview - ${projectName}`}
              className="w-full h-full border-0 bg-white"
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
            />
          </div>
        </div>

        {/* 3. BOTTOM LIVE STATUS BAR */}
        <div className="h-7 bg-[#080D17] border-t border-[#172033] px-3 flex items-center justify-between text-[11px] text-[#64748B] shrink-0 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
            <span className="text-[#94A3B8]">Connected to Workspace Dev Server</span>
            <span className="text-[#475569]">•</span>
            <span className="font-mono">Port {port}</span>
          </div>

          <div className="flex items-center gap-3">
            <span>HMR Live Reloading Active</span>
            {onRestartServer && (
              <button
                onClick={onRestartServer}
                className="text-[#38BDF8] hover:underline"
              >
                Restart Dev Server
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
