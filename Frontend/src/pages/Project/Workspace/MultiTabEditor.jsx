import React, { useEffect, useMemo } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";
import { X, ChevronRight, FileCode, FileText, Sparkles, Save, FlaskConical } from "lucide-react";
import TestingWorkspace from "./Testing/TestingWorkspace";

/* File icon helper for tabs */
const getTabFileIcon = (fileName = "") => {
  if (fileName === "Visual Regression" || fileName.toLowerCase().includes("regression")) {
    return <FlaskConical size={13} className="text-[#A855F7] shrink-0" />;
  }
  const ext = fileName.split(".").pop().toLowerCase();
  if (ext === "jsx" || ext === "tsx") {
    return <FileCode size={13} className="text-[#3794FF] shrink-0" />;
  }
  if (ext === "js" || ext === "ts") {
    return <FileCode size={13} className="text-[#E5C07B] shrink-0" />;
  }
  if (ext === "json") {
    return <FileCode size={13} className="text-[#D29922] shrink-0" />;
  }
  return <FileText size={13} className="text-[#8B949E] shrink-0" />;
};

export default function MultiTabEditor({
  openTabs = [],
  activeTabPath,
  onSelectTab,
  onCloseTab,
  fileContents = {},
  onCodeChange,
  onSaveFile,
  onTriggerInlineAI,
  onSelectionChange,
}) {
  const monaco = useMonaco();

  /* Custom DevCollab Dark Monaco Theme matching VS Code Dark+ and reference image */
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("devcollab-dark-plus", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6A9955", fontStyle: "italic" },
          { token: "keyword", foreground: "C586C0" },
          { token: "keyword.control", foreground: "C586C0" },
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          { token: "identifier", foreground: "9CDCFE" },
          { token: "type", foreground: "4EC9B0" },
          { token: "function", foreground: "DCDCAA" },
          { token: "variable", foreground: "9CDCFE" },
          { token: "tag", foreground: "4EC9B0" },
        ],
        colors: {
          "editor.background": "#0B1220",
          "editor.foreground": "#E6EDF3",
          "editor.lineHighlightBackground": "#131C31",
          "editorLineNumber.foreground": "#6E7681",
          "editorLineNumber.activeForeground": "#E6EDF3",
          "editorCursor.foreground": "#3794FF",
          "editorIndentGuide.background": "#172033",
          "editorIndentGuide.activeBackground": "#1E293B",
          "editor.selectionBackground": "#18233A",
          "editor.inactiveSelectionBackground": "#151E2D",
          "minimap.background": "#0B1220",
          "scrollbarSlider.background": "#1E293B80",
          "scrollbarSlider.hoverBackground": "#33415580",
          "scrollbarSlider.activeBackground": "#3794FF80",
        },
      });
      monaco.editor.setTheme("devcollab-dark-plus");
    }
  }, [monaco]);

  const getLanguage = (path = "") => {
    const ext = path.split(".").pop().toLowerCase();
    const langMap = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      css: "css",
      html: "html",
      md: "markdown",
      py: "python",
      sql: "sql",
      sh: "shell",
    };
    return langMap[ext] || "javascript";
  };

  const activeContent = activeTabPath ? fileContents[activeTabPath] ?? "" : "";

  // Breadcrumbs path split: e.g. "src > pages > CodeEditor.jsx > CodeEditor"
  const breadcrumbSegments = useMemo(() => {
    if (!activeTabPath) return ["src", "pages", "CodeEditor.jsx", "CodeEditor"];
    const parts = activeTabPath.split("/");
    const filename = parts[parts.length - 1];
    const componentName = filename.replace(/\.[^/.]+$/, "");
    return [...parts, componentName];
  }, [activeTabPath]);

  // Keyboard shortcut for Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (activeTabPath && onSaveFile) {
          onSaveFile(activeTabPath);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTabPath, onSaveFile]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B1220] min-w-0 overflow-hidden font-sans select-none">
      {/* 1. TABS BAR */}
      <div className="h-9 flex items-center bg-[#0B111B] border-b border-[#172033] overflow-x-auto no-scrollbar shrink-0">
        {openTabs.map((tab) => {
          const isActive = activeTabPath === tab.path;
          return (
            <div
              key={tab.path}
              onClick={() => onSelectTab(tab.path)}
              className={`group relative flex items-center gap-1.5 px-3 h-9 text-xs cursor-pointer border-r border-[#172033] transition-colors ${
                isActive
                  ? "bg-[#0B1220] text-[#E6EDF3] font-medium"
                  : "bg-[#0B111B] text-[#8B949E] hover:bg-[#151E2D] hover:text-[#E6EDF3]"
              }`}
            >
              {/* Active Tab Top Blue Accent Line */}
              {isActive && (
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#007ACC]" />
              )}

              {getTabFileIcon(tab.name)}
              <span className="truncate max-w-[130px]">{tab.name}</span>

              {/* Modified indicator 'M' */}
              <span className="text-[10px] font-mono text-[#D29922] font-semibold">
                M
              </span>

              {/* Close Tab Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.path);
                }}
                className="p-0.5 rounded hover:bg-[#1E293B] text-[#6E7681] hover:text-[#E6EDF3] transition-colors ml-1"
                title="Close (Ctrl+W)"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}

        {/* Right Tab Toolbar */}
        {activeTabPath && (
          <div className="ml-auto flex items-center gap-1.5 pr-2 shrink-0">
            <button
              onClick={() => onTriggerInlineAI && onTriggerInlineAI("explain")}
              className="flex items-center gap-1 text-[11px] text-[#3794FF] hover:bg-[#18233A] px-2 py-0.5 rounded border border-[#3794FF]/30 transition-colors"
              title="Inline AI Assistant"
            >
              <Sparkles size={11} />
              <span>Inline AI</span>
            </button>
            <button
              onClick={() => onSaveFile(activeTabPath)}
              className="flex items-center gap-1 text-[11px] text-[#E6EDF3] bg-[#18233A] hover:bg-[#1E293B] px-2 py-0.5 rounded border border-[#1E293B] transition-colors"
              title="Save File (Ctrl+S)"
            >
              <Save size={11} />
              <span>Save</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. BREADCRUMBS ROW (Only for regular code files) */}
      {activeTabPath !== "visual-regression" && (
        <div className="h-6 px-3 bg-[#0B1220] border-b border-[#172033] flex items-center text-[11px] text-[#6E7681] font-mono shrink-0 overflow-hidden">
          {breadcrumbSegments.map((seg, idx) => (
            <React.Fragment key={idx}>
              {idx > 0 && <ChevronRight size={11} className="mx-1 text-[#484F58]" />}
              <span
                className={
                  idx === breadcrumbSegments.length - 1
                    ? "text-[#E6EDF3] font-medium"
                    : "hover:text-[#8B949E] cursor-pointer"
                }
              >
                {seg}
              </span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* 3. MONACO CODE EDITOR OR TESTING WORKSPACE */}
      <div className="flex-1 relative min-h-0">
        {activeTabPath === "visual-regression" ? (
          <TestingWorkspace onClose={() => onCloseTab("visual-regression")} />
        ) : activeTabPath ? (
          <Editor
            height="100%"
            theme="devcollab-dark-plus"
            language={getLanguage(activeTabPath)}
            value={activeContent}
            onChange={(val) => onCodeChange(activeTabPath, val || "")}
            onMount={(editor) => {
              editor.onDidChangeCursorSelection(() => {
                const model = editor.getModel();
                const selection = editor.getSelection();
                if (model && selection && !selection.isEmpty()) {
                  const selectedText = model.getValueInRange(selection);
                  onSelectionChange?.(selectedText);
                } else {
                  onSelectionChange?.("");
                }
              });
            }}
            options={{
              fontSize: 13,
              fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
              minimap: {
                enabled: true,
                scale: 0.75,
                renderCharacters: false,
              },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              bracketPairColorization: { enabled: true },
              cursorBlinking: "smooth",
              smoothScrolling: true,
              lineNumbers: "on",
              renderLineHighlight: "all",
              guides: {
                indentation: true,
                bracketPairs: true,
              },
              padding: { top: 8, bottom: 8 },
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#6E7681] select-none p-6 font-mono text-xs">
            <p>Select a file from the explorer or create a new file</p>
          </div>
        )}
      </div>
    </div>
  );
}
