import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import Editor, { useMonaco } from "@monaco-editor/react";

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
          `http://localhost:3001/api/project/${projectId}/contents`,
          { params: { path } }
        );

        if (res.data.type === "folder") {
          if (addHistory) {
            setPathHistory((p) => [...p, currentPath]);
          }

          setFileTree(res.data.items);
          setCurrentPath(path);
          setActiveTab(null);
          setCode("");
        } else {
          setCode(res.data.content || "");
          setActiveTab(path);

          setOpenTabs((prev) => {
            if (prev.find((t) => t.path === path)) return prev;
            return [...prev, { path, name: path.split("/").pop() }];
          });
        }
      } catch (err) {
        console.error(err);
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
      `http://localhost:3001/api/project/${projectId}/delete-file`,
      { data: { path } }
    );

    fetchFiles(currentPath);
  };

  const createFile = async () => {
    const name = prompt("File name?");
    if (!name) return;

    await axios.post(
      `http://localhost:3001/api/project/${projectId}/create-file`,
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
      setActiveTab(remaining.length ? remaining[0].path : null);
      setCode("");
    }
  };

  /* ---------------- SAVE ---------------- */
  const saveFile = async () => {
    await axios.put(
      `http://localhost:3001/api/project/${projectId}/update-file`,
      {
        path: activeTab,
        content: code,
        message: commitMessage || "Updated via DevCollab",
      }
    );

    alert("🚀 Code pushed to GitHub");
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="h-[650px] flex rounded-2xl overflow-hidden
    bg-[rgba(10,15,26,0.7)] backdrop-blur-xl
    border border-[rgba(255,255,255,0.06)]
    shadow-[0_0_40px_rgba(88,101,242,0.15)] text-white">

      {/* SIDEBAR */}
      <div className="w-72 flex flex-col bg-[rgba(11,18,32,0.6)]
      border-r border-[rgba(255,255,255,0.05)]">

        <div className="flex items-center justify-between p-3 border-b border-[rgba(255,255,255,0.05)]">
          <button onClick={goBack}><ChevronLeft size={16} /></button>

          <div className="flex gap-2">
            <button onClick={createFile}><Plus size={16} /></button>
            <button onClick={() => fetchFiles(currentPath)}>
              <RefreshCcw size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 space-y-1">
          {fileTree.map((item) => (
            <div key={item.path}
              className="group flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-indigo-500/10">

              <div onClick={() => fetchFiles(item.path)}
                className="flex items-center gap-2 cursor-pointer">

                {item.type === "dir"
                  ? <Folder size={14} className="text-yellow-400" />
                  : <File size={14} className="text-blue-400" />}

                <span className="text-sm text-gray-400 group-hover:text-white">
                  {item.name}
                </span>
              </div>

              <button onClick={() => deleteItem(item.path)}
                className="opacity-0 group-hover:opacity-100 text-red-400">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN + RIGHT */}
      <div className="flex-1 flex">

        {/* EDITOR AREA */}
        <div className="flex-1 flex flex-col">

          {/* TABS */}
          <div className="flex border-b border-white/5">
            {openTabs.map((tab) => (
              <div key={tab.path}
                onClick={() => switchTab(tab.path)}
                className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer
                ${activeTab === tab.path
                    ? "bg-[#111827] border-b-2 border-indigo-500"
                    : "text-gray-500 hover:text-white"}`}>

                <File size={12} />
                {tab.name}

                <X size={12} onClick={(e) => closeTab(tab.path, e)} />
              </div>
            ))}
          </div>

          {/* COMMIT */}
          {activeTab && (
            <div className="flex gap-2 p-2 bg-[#0f172a] border-b border-white/5">
              <input
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="Commit message..."
                className="flex-1 px-2 py-1 bg-[#1e293b] rounded text-sm"
              />
              <button onClick={saveFile}
                className="bg-indigo-600 px-3 py-1 rounded">
                <Save size={14} />
              </button>
            </div>
          )}

          {/* EDITOR */}
          <div className="flex-1">
            {loading ? (
              <div className="p-4 text-gray-400">Loading...</div>
            ) : activeTab ? (
              <Editor
                height="100%"
                theme="devcollab-dark"
                language={getLanguage(activeTab)}
                value={code}
                onChange={(v) => setCode(v)}
                options={{ minimap: { enabled: false } }}
              />
            ) : (
              <div className="p-6 text-gray-500">
                Select a file 🚀
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL */}

      </div>

      <AiCodeReviewer 
        filename={activeTab} 
        code={code} 
        language={getLanguage(activeTab)} 
      />
    </div>
  );




}

