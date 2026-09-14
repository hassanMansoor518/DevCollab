import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import TerminalContextMenu from "./TerminalContextMenu";

import { webContainerService, WC_STATUS } from "../../../../services/webContainerService";

export default function XTermInstance({
  sessionId,
  projectId,
  socket,
  shellType = "jsh",
  isActive = true,
  onDevServerDetected,
  onSessionReady,
  onNewTerminal,
  onSplitTerminal,
}) {
  const containerRef = useRef(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const sessionRef = useRef(null);
  const [initError, setInitError] = useState(null);
  const [contextMenu, setContextMenu] = useState({ open: false, x: 0, y: 0 });
  const [hasSelection, setHasSelection] = useState(false);

  // Stable callback refs
  const callbacksRef = useRef({ onDevServerDetected, onSessionReady });
  useEffect(() => {
    callbacksRef.current = { onDevServerDetected, onSessionReady };
  }, [onDevServerDetected, onSessionReady]);

  // Dev server detection regex
  const detectDevServer = useCallback((text) => {
    if (!text || typeof text !== "string") return;
    const match = text.match(/https?:\/\/(localhost|127\.0\.0\.1):(\d+)/i);
    if (match && callbacksRef.current.onDevServerDetected) {
      const url = match[0];
      const port = match[2];
      callbacksRef.current.onDevServerDetected({ url, port, sessionId });
    }
  }, [sessionId]);

  // Initialize Terminal & Spawn WebContainer jsh session (ONCE per sessionId)
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontSize: 13,
      fontFamily:
        '"Fira Code", "Cascadia Code", "JetBrains Mono", Consolas, "Courier New", monospace',
      letterSpacing: 0,
      lineHeight: 1.25,
      allowTransparency: true,
      convertEol: true,
      scrollback: 5000,
      theme: {
        background: "#0B1220",
        foreground: "#E6EDF3",
        cursor: "#38BDF8",
        cursorAccent: "#0B1220",
        selectionBackground: "rgba(56, 189, 248, 0.35)",
        selectionInactiveBackground: "rgba(56, 189, 248, 0.2)",
        black: "#1E293B",
        red: "#F87171",
        green: "#4ADE80",
        yellow: "#FBBF24",
        blue: "#60A5FA",
        magenta: "#C084FC",
        cyan: "#38BDF8",
        white: "#F1F5F9",
        brightBlack: "#475569",
        brightRed: "#EF4444",
        brightGreen: "#22C55E",
        brightYellow: "#EAB308",
        brightBlue: "#3B82F6",
        brightMagenta: "#A855F7",
        brightCyan: "#06B6D4",
        brightWhite: "#FFFFFF",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(containerRef.current);
    terminalRef.current = term;
    fitAddonRef.current = fitAddon;

    term.write("\x1b[36m⚡ DevCollab WebContainer Terminal\x1b[0m\r\n");
    term.write("\x1b[90mNode.js in-browser sandbox active. Ready for commands.\x1b[0m\r\n\r\n");

    // Spawn WebContainer jsh session
    const cols = term.cols || 80;
    const rows = term.rows || 24;

    webContainerService
      .spawnTerminalSession({
        sessionId,
        cols,
        rows,
        onOutput: (data) => {
          if (isMounted && terminalRef.current) {
            terminalRef.current.write(data);
            detectDevServer(data);
          }
        },
        onExit: (exitCode) => {
          if (isMounted && terminalRef.current) {
            terminalRef.current.write(
              `\r\n\x1b[90m[Process completed with exit code ${exitCode}]\x1b[0m\r\n`
            );
          }
        },
      })
      .then((session) => {
        if (!isMounted) return;
        sessionRef.current = session;
        if (callbacksRef.current.onSessionReady) {
          callbacksRef.current.onSessionReady({
            sessionId,
            shell: "jsh",
            isWebContainer: true,
          });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("[WebContainer Terminal] Spawn error:", err);
        setInitError(err.message);
        term.write(
          `\r\n\x1b[31m[Terminal initialization error: ${err.message}]\x1b[0m\r\n`
        );
      });

    // Keystroke forwarding
    const onDataDisposable = term.onData((data) => {
      if (sessionRef.current) {
        sessionRef.current.write(data);
      }
    });

    // Selection tracking
    const onSelectionDisposable = term.onSelectionChange(() => {
      setHasSelection(term.hasSelection());
    });

    // Custom Key Handler
    term.attachCustomKeyEventHandler((event) => {
      if (event.ctrlKey && event.key === "c" && event.type === "keydown") {
        if (term.hasSelection()) {
          navigator.clipboard.writeText(term.getSelection());
          return false;
        }
        if (sessionRef.current) {
          sessionRef.current.write("\x03");
        }
        return false;
      }

      if (event.ctrlKey && event.key === "v" && event.type === "keydown") {
        navigator.clipboard.readText().then((text) => {
          if (text && sessionRef.current) {
            sessionRef.current.write(text);
          }
        });
        return false;
      }

      return true;
    });

    // Initial fit
    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (_) {}
    }, 60);

    // ResizeObserver
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        if (term.cols && term.rows && sessionRef.current) {
          sessionRef.current.resize({
            cols: term.cols,
            rows: term.rows,
          });
        }
      } catch (_) {}
    });

    resizeObserver.observe(containerRef.current);
    resizeObserverRef.current = resizeObserver;

    return () => {
      isMounted = false;
      onDataDisposable.dispose();
      onSelectionDisposable.dispose();
      resizeObserver.disconnect();
      if (sessionRef.current) {
        sessionRef.current.kill();
        sessionRef.current = null;
      }
      term.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Refit & focus when active tab switches without killing session
  useEffect(() => {
    if (isActive && fitAddonRef.current && terminalRef.current) {
      setTimeout(() => {
        try {
          fitAddonRef.current.fit();
          terminalRef.current.focus();
        } catch (_) {}
      }, 50);
    }
  }, [isActive]);

  // Context Menu Actions
  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({
      open: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleCopy = () => {
    if (terminalRef.current && terminalRef.current.hasSelection()) {
      navigator.clipboard.writeText(terminalRef.current.getSelection());
    }
  };

  const handlePaste = () => {
    navigator.clipboard.readText().then((text) => {
      if (text && sessionRef.current) {
        sessionRef.current.write(text);
      }
    });
  };

  const handleSelectAll = () => {
    terminalRef.current?.selectAll();
  };

  const handleClear = () => {
    terminalRef.current?.clear();
    if (sessionRef.current) {
      sessionRef.current.write("\x0c"); // Form feed (Ctrl+L)
    }
  };

  const handleRestart = () => {
    terminalRef.current?.clear();
    terminalRef.current?.write("\x1b[33mRestarting WebContainer terminal session...\x1b[0m\r\n");
    if (sessionRef.current) {
      sessionRef.current.kill();
      sessionRef.current = null;
    }
    initTerminalSession();
  };

  const handleKill = () => {
    if (sessionRef.current) {
      sessionRef.current.write("\x03"); // SIGINT
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col ${
        isActive ? "block" : "hidden"
      }`}
      onContextMenu={handleContextMenu}
    >
      {initError && (
        <div className="bg-[#3B1824] border-b border-[#F85149]/40 px-3 py-1.5 flex items-center justify-between text-xs text-[#FFA198] shrink-0 font-sans">
          <span>Development environment could not be started: {initError}</span>
          <button
            onClick={initTerminalSession}
            className="bg-[#F85149] hover:bg-[#DA3633] text-white px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors shadow-sm ml-2"
          >
            Retry
          </button>
        </div>
      )}

      <div
        ref={containerRef}
        className="w-full h-full flex-1 overflow-hidden p-2"
        style={{ backgroundColor: "#0B1220" }}
      />

      {/* Right Click Context Menu */}
      {contextMenu.open && (
        <TerminalContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu({ open: false, x: 0, y: 0 })}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onSelectAll={handleSelectAll}
          onClear={handleClear}
          onRestart={handleRestart}
          onKill={handleKill}
          onNewTerminal={onNewTerminal}
          onSplitTerminal={onSplitTerminal}
          hasSelection={hasSelection}
        />
      )}
    </div>
  );
}
