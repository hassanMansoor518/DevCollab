import React, { useEffect, useRef } from "react";
import {
  Copy,
  Clipboard,
  Trash2,
  RotateCcw,
  Plus,
  Columns,
  SquareCheck,
  XCircle
} from "lucide-react";

export default function TerminalContextMenu({
  x,
  y,
  onClose,
  onCopy,
  onPaste,
  onSelectAll,
  onClear,
  onRestart,
  onKill,
  onNewTerminal,
  onSplitTerminal,
  hasSelection
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // Constrain position to viewport
  const style = {
    top: Math.min(y, window.innerHeight - 320),
    left: Math.min(x, window.innerWidth - 220),
  };

  return (
    <div
      ref={menuRef}
      style={style}
      className="fixed z-50 w-56 bg-[#161F30] border border-[#2A374E] rounded-lg shadow-2xl py-1 text-xs text-[#E6EDF3] select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
    >
      <button
        onClick={() => { onCopy(); onClose(); }}
        disabled={!hasSelection}
        className={`w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-[#202D44] transition-colors ${
          !hasSelection ? "opacity-40 cursor-not-allowed" : ""
        }`}
      >
        <span className="flex items-center gap-2">
          <Copy size={13} className="text-[#38BDF8]" /> Copy
        </span>
        <span className="text-[10px] text-[#64748B]">Ctrl+C</span>
      </button>

      <button
        onClick={() => { onPaste(); onClose(); }}
        className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-[#202D44] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Clipboard size={13} className="text-[#38BDF8]" /> Paste
        </span>
        <span className="text-[10px] text-[#64748B]">Ctrl+V</span>
      </button>

      <button
        onClick={() => { onSelectAll(); onClose(); }}
        className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-[#202D44] transition-colors"
      >
        <span className="flex items-center gap-2">
          <SquareCheck size={13} className="text-[#94A3B8]" /> Select All
        </span>
        <span className="text-[10px] text-[#64748B]">Ctrl+A</span>
      </button>

      <div className="h-px bg-[#24334C] my-1" />

      <button
        onClick={() => { onClear(); onClose(); }}
        className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-[#202D44] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Trash2 size={13} className="text-[#94A3B8]" /> Clear Buffer
        </span>
        <span className="text-[10px] text-[#64748B]">Ctrl+L</span>
      </button>

      <button
        onClick={() => { onSplitTerminal(); onClose(); }}
        className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-[#202D44] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Columns size={13} className="text-[#38BDF8]" /> Split Terminal
        </span>
      </button>

      <button
        onClick={() => { onNewTerminal(); onClose(); }}
        className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-[#202D44] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Plus size={13} className="text-[#4ADE80]" /> New Terminal
        </span>
      </button>

      <div className="h-px bg-[#24334C] my-1" />

      <button
        onClick={() => { onRestart(); onClose(); }}
        className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-[#202D44] transition-colors"
      >
        <span className="flex items-center gap-2">
          <RotateCcw size={13} className="text-[#FBBF24]" /> Restart Terminal
        </span>
      </button>

      <button
        onClick={() => { onKill(); onClose(); }}
        className="w-full px-3 py-1.5 flex items-center justify-between text-left text-[#F87171] hover:bg-[#3B1824] transition-colors"
      >
        <span className="flex items-center gap-2">
          <XCircle size={13} /> Kill Process
        </span>
        <span className="text-[10px] text-[#F87171]/70">Ctrl+C</span>
      </button>
    </div>
  );
}
