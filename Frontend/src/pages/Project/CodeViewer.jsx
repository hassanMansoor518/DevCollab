import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Editor, { useMonaco, DiffEditor } from "@monaco-editor/react";


import {
  Folder,
  File,
  ChevronLeft,
  X,
  Plus,
  Trash2,
  RefreshCcw,
  Save,
} from "lucide-react";

import AiCodeReviewer from "../../component/AiCodeReviewer";
import { useTheme } from "../../context/ThemeContext";

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://devcollab-production-f16f.up.railway.app");

export default function CodeViewer({ projectId }) {
  const monaco = useMonaco();

  const [fileTree, setFileTree] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [pathHistory, setPathHistory] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [commitMessage, setCommitMessage] = useState("");
  const [diffMode, setDiffMode] = useState(false);
  const [originalCode, setOriginalCode] = useState("");
  const { isDark } = useTheme();

  /* ---------------- MONACO THEME ---------------- */
  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme("devcollab-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "6A9955" },
          { token: "keyword", foreground: "C586C0" },
          { token: "string", foreground: "CE9178" },
          { token: "number", foreground: "B5CEA8" },
          { token: "identifier", foreground: "9CDCFE" },
        ],
        colors: {
          "editor.background": "#050A14",
          "editor.lineHighlightBackground": "#1a2333",
          "editorCursor.foreground": "#6366F1",
        },
      });
    }
  }, [monaco]);

  /* ---------------- LANGUAGE ---------------- */
  const getLanguage = (filePath) => {
    if (!filePath) return "javascript";

    const ext = filePath.split(".").pop();
    const map = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      json: "json",
      css: "css",
      html: "html",
      md: "markdown",
      py: "python",
    };

    return map[ext] || "plaintext";
  };

  /* ---------------- FETCH FILES ---------------- */
  const fetchFiles = useCallback(
    async (path = "", addHistory = true) => {
      try {
        setLoading(true);

        const res = await axios.get(
          `${API_URL}/api/project/${projectId}/contents`,
          { params: { path } }
        );

        if (res.data.type === "folder") {
          if (addHistory) {
            setPathHistory((p) => [...p, currentPath]);
          }

          setFileTree(res.data.items || []);
          setCurrentPath(path);
          setActiveTab(null);
          setCode("");
        } else {
          const filePath = path;

          setCode(res.data.content || "");
          setActiveTab(filePath);

          setOpenTabs((prev) => {
            if (prev.find((t) => t.path === filePath)) return prev;
            return [...prev, { path: filePath, name: filePath.split("/").pop() }];
          });
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    },
    [projectId, currentPath]
  );

  useEffect(() => {
    fetchFiles("");
  }, [projectId]);

  /* ---------------- NAVIGATION ---------------- */
  const goBack = () => {
    if (!pathHistory.length) return;

    const prev = pathHistory[pathHistory.length - 1];
    setPathHistory((p) => p.slice(0, -1));
    fetchFiles(prev, false);
  };

  /* ---------------- CRUD ---------------- */
  const deleteItem = async (path) => {
    if (!window.confirm("Delete this file/folder?")) return;

    await axios.delete(
      `${API_URL}/api/project/${projectId}/delete-file`,
      { data: { path } }
    );

    fetchFiles(currentPath);
  };

  const createFile = async () => {
    const name = prompt("File name?");
    if (!name) return;

    await axios.post(
      `${API_URL}/api/project/${projectId}/create-file`,
      {
        path: currentPath ? `${currentPath}/${name}` : name,
        content: "",
      }
    );

    fetchFiles(currentPath);
  };

  /* ---------------- TABS ---------------- */
  const switchTab = (path) => {
    setActiveTab(path);
    fetchFiles(path, false);
  };

  const closeTab = (path, e) => {
    e.stopPropagation();

    const remaining = openTabs.filter((t) => t.path !== path);
    setOpenTabs(remaining);

    if (activeTab === path) {
      const next = remaining.length ? remaining[0].path : null;
      setActiveTab(next);
      setCode("");
    }
  };

  /* ---------------- SAVE ---------------- */
  const saveFile = async () => {
    await axios.put(
      `${API_URL}/api/project/${projectId}/update-file`,
      {
        path: activeTab,
        content: code,
        message: commitMessage || "Updated via DevCollab",
      }
    );

    alert("🚀 Saved successfully");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="h-auto lg:h-[650px] flex flex-col lg:flex-row rounded-2xl overflow-hidden bg-background text-text-primary border border-border-subtle">

      {/* LEFT SIDEBAR */}
      <div className={`w-full lg:w-64 flex flex-col bg-sidebar border-b lg:border-b-0 lg:border-r border-border-subtle shrink-0 ${activeTab ? "hidden md:flex" : "h-auto"}`}>

        {/* HEADER */}
        <div className="flex items-center justify-between p-2 md:p-3 border-b border-border-subtle">
          <button onClick={goBack} className="p-1 text-text-secondary hover:text-text-primary">
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-3 md:gap-2">
            <button onClick={createFile} className="p-1 text-text-secondary hover:text-text-primary"><Plus size={16} /></button>
            <button onClick={() => fetchFiles(currentPath)} className="p-1 text-text-secondary hover:text-text-primary">
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 space-y-1">
          {fileTree.length === 0 ? (
            <div className="text-xs text-text-secondary p-2">No files found</div>
          ) : (
            fileTree.map((item) => (
              <div
                key={item.path}
                className={`group flex items-center justify-between px-3 py-2 md:py-1.5 rounded-md transition-colors ${activeTab === item.path ? "bg-primary/20 text-primary" : "hover:bg-hover-bg"}`}
              >
                <div
                  onClick={() => fetchFiles(item.path)}
                  className="flex items-center gap-3 md:gap-2 cursor-pointer w-full"
                >
                  {item.type === "dir" ? (
                    <Folder size={16} className="text-yellow-400 shrink-0" />
                  ) : (
                    <File size={16} className="text-blue-400 shrink-0" />
                  )}

                  <span className={`text-sm ${activeTab === item.path ? "text-primary font-medium" : "text-text-secondary group-hover:text-text-primary"}`}>
                    {item.name}
                  </span>
                </div>

                <button
                  onClick={() => deleteItem(item.path)}
                  className="opacity-0 group-hover:opacity-100 text-red-400 p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CENTER (EDITOR) */}
      <div className={`flex-1 flex-col min-w-0 md:min-h-[500px] shrink-0 ${activeTab ? "flex min-h-[70vh]" : "hidden md:flex"}`}>

        {/* TABS */}
        <div className="flex border-b border-border-subtle overflow-x-auto no-scrollbar">
          {openTabs.map((tab) => (
            <div
              key={tab.path}
              onClick={() => switchTab(tab.path)}
              className={`flex items-center gap-2 px-4 py-3 md:py-2 text-sm cursor-pointer whitespace-nowrap transition-colors
              ${activeTab === tab.path
                  ? "bg-input-bg border-b-2 border-primary text-primary"
                  : "text-text-secondary hover:text-text-primary"}`}
            >
              <File size={14} className="md:w-3 md:h-3" />
              {tab.name}

              <button className="ml-1 p-1 md:p-0 text-text-muted hover:text-text-primary" onClick={(e) => closeTab(tab.path, e)}>
                <X size={14} className="md:w-3 md:h-3" />
              </button>
            </div>
          ))}
        </div>

        {/* COMMIT BAR */}
        {activeTab && (
          <div className="flex gap-2 p-2 bg-surface border-b border-border-subtle">
            <input
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="flex-1 px-2 py-1 bg-input-bg rounded text-sm outline-none text-text-primary placeholder:text-text-muted"
            />
            <button onClick={saveFile} className="bg-indigo-600 px-3 py-1 rounded">
              <Save size={14} />
            </button>
          </div>
        )}

        {/* EDITOR */}
        <div className="flex-1 relative min-h-[400px]">
          {loading ? (
            <div className="p-4 text-text-secondary">Loading...</div>
          ) : diffMode ? (   // ⭐ NEW STATE
            <div className="absolute inset-0">
              <DiffEditor
                height="100%"
                original={originalCode}   // before fix
                modified={code}           // after fix
                language={getLanguage(activeTab)}
                theme={isDark ? "devcollab-dark" : "vs-light"}
                options={{
                  renderSideBySide: true,
                  minimap: { enabled: false },
                }}
              />
            </div>
          ) : activeTab ? (
            <div className="absolute inset-0">
              <Editor
                height="100%"
                theme={isDark ? "devcollab-dark" : "vs-light"}
                language={getLanguage(activeTab)}
                value={code}
                onChange={(v) => setCode(v || "")}
                options={{ minimap: { enabled: false }, scrollBeyondLastLine: false }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-text-secondary">
               {/* Mobile Card */}
               <div className="md:hidden flex flex-col items-center justify-center bg-surface/50 border border-border-subtle rounded-xl p-8 w-full max-w-xs mx-auto shadow-sm backdrop-blur-sm mt-4">
                 <File size={40} className="text-text-muted mb-4 opacity-50" />
                 <h3 className="text-text-primary font-medium text-lg mb-2">No File Selected</h3>
                 <p className="text-sm text-text-muted mb-6 leading-relaxed">Choose a file from the explorer<br/>to view and edit code.</p>
                 <div className="bg-primary/10 text-primary border border-primary/20 px-5 py-2.5 rounded-lg text-sm font-medium">
                   Browse Files
                 </div>
               </div>
               
               {/* Desktop standard */}
               <div className="hidden md:block">
                 Select a file to start coding 🚀
               </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT AI PANEL */}
      <AiCodeReviewer
  filename={activeTab}
  code={code}
  language={getLanguage(activeTab)}
  projectId={projectId}
  onApplyFix={(newCode) => {
    setOriginalCode(code);  // BEFORE FIX
    setCode(newCode);       // AFTER FIX
    setDiffMode(true);      // SHOW DIFF
  }}
/>
    </div>
  );
}

