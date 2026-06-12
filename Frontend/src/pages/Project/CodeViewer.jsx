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

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://ai-powered-chat-application-production.up.railway.app");

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
    <div className="h-[650px] flex rounded-2xl overflow-hidden bg-background text-text-primary border border-border-subtle">

      {/* LEFT SIDEBAR */}
      <div className="w-64 flex flex-col bg-sidebar border-r border-border-subtle">

        {/* HEADER */}
        <div className="flex items-center justify-between p-3 border-b border-border-subtle">
          <button onClick={goBack}>
            <ChevronLeft size={16} />
          </button>

          <div className="flex gap-2">
            <button onClick={createFile}><Plus size={16} /></button>
            <button onClick={() => fetchFiles(currentPath)}>
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
                className="group flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-hover-bg"
              >
                <div
                  onClick={() => fetchFiles(item.path)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {item.type === "dir" ? (
                    <Folder size={14} className="text-yellow-400" />
                  ) : (
                    <File size={14} className="text-blue-400" />
                  )}

                  <span className="text-sm text-text-secondary group-hover:text-text-primary">
                    {item.name}
                  </span>
                </div>

                <button
                  onClick={() => deleteItem(item.path)}
                  className="opacity-0 group-hover:opacity-100 text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CENTER (EDITOR) */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* TABS */}
        <div className="flex border-b border-border-subtle overflow-x-auto">
          {openTabs.map((tab) => (
            <div
              key={tab.path}
              onClick={() => switchTab(tab.path)}
              className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer whitespace-nowrap
              ${activeTab === tab.path
                  ? "bg-input-bg border-b-2 border-indigo-500"
                  : "text-text-secondary hover:text-text-primary"}`}
            >
              <File size={12} />
              {tab.name}

              <X size={12} onClick={(e) => closeTab(tab.path, e)} />
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
        <div className="flex-1">
          {loading ? (
            <div className="p-4 text-text-secondary">Loading...</div>
          ) : diffMode ? (   // ⭐ NEW STATE
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
          ) : activeTab ? (
            <Editor
              height="100%"
              theme={isDark ? "devcollab-dark" : "vs-light"}
              language={getLanguage(activeTab)}
              value={code}
              onChange={(v) => setCode(v || "")}
              options={{ minimap: { enabled: false } }}
            />
          ) : (
            <div className="p-6 text-text-secondary">
              Select a file to start coding 🚀
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

