import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { RotateCcw, Folder, File, Clipboard, FileText, X, ChevronLeft } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function CodeViewer({ projectId, filePath }) {
  const [fileTree, setFileTree] = useState([]);
  const [currentPath, setCurrentPath] = useState(filePath || "");
  const [pathHistory, setPathHistory] = useState([]);
  const [openTabs, setOpenTabs] = useState([]);
  const [activeTab, setActiveTab] = useState(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  const authUser = JSON.parse(localStorage.getItem("ChatApp") || "{}");

  // ✅ Detects folder by type OR by name having no extension
  const isFolder = (item) => {
    const folderTypes = ["folder", "dir", "directory", "FOLDER", "DIR", "DIRECTORY"];
    return folderTypes.includes(item.type) || !item.name.includes(".");
  };

  const fetchFiles = useCallback(
    async (path = "", addToHistory = true) => {
      try {
        setLoading(true);
        const res = await axios.get(
          `http://localhost:3001/api/project/${projectId}/contents`,
          {
            params: { path },
            headers: { Authorization: `Bearer ${authUser.token || ""}` },
          }
        );

        if (res.data.type === "folder") {
          if (addToHistory) {
            setPathHistory((prev) => [...prev, currentPath]);
          }
          setFileTree(res.data.items);
          setCode("");
          setActiveTab(null);
          setCurrentPath(path);
        } else if (res.data.type === "file") {
          const content = res.data.content || "";
          setCode(content);

          setOpenTabs((prev) => {
            if (prev.find((t) => t.path === path)) return prev;
            return [...prev, { path, name: path.split("/").pop() }];
          });
          setActiveTab(path);
        }
      } catch (err) {
        console.error("Fetch files error:", err.response?.data || err.message);
        setCode("");
      } finally {
        setLoading(false);
      }
    },
    [projectId, authUser.token, currentPath]
  );

  useEffect(() => {
    fetchFiles(filePath || "", false);
  }, [projectId]);

  const goBack = () => {
    if (pathHistory.length === 0) return;
    const prev = pathHistory[pathHistory.length - 1];
    setPathHistory((h) => h.slice(0, -1));
    fetchFiles(prev, false);
  };

  const closeTab = (tabPath, e) => {
    e.stopPropagation();
    const remaining = openTabs.filter((t) => t.path !== tabPath);
    setOpenTabs(remaining);

    if (activeTab === tabPath) {
      if (remaining.length > 0) {
        const last = remaining[remaining.length - 1];
        setActiveTab(last.path);
        fetchFiles(last.path, false);
      } else {
        setActiveTab(null);
        setCode("");
      }
    }
  };

  const switchTab = (tabPath) => {
    setActiveTab(tabPath);
    fetchFiles(tabPath, false);
  };

  const copyCode = () => {
    if (code) navigator.clipboard.writeText(code);
  };

  const getLanguage = (path = "") => {
    const ext = path.split(".").pop();
    const map = {
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      py: "python",
      css: "css",
      html: "html",
      json: "json",
      md: "markdown",
      sh: "bash",
      yml: "yaml",
      yaml: "yaml",
      xml: "xml",
      sql: "sql",
    };
    return map[ext] || "javascript";
  };

  return (
    <div className="flex mt-4 h-[650px] bg-[#0A0F1A] border border-[#1F2937] rounded-lg overflow-hidden shadow-2xl">

      {/* LEFT EXPLORER */}
      <div className="w-64 bg-[#0B1220] text-gray-300 flex flex-col border-r border-[#1F2937]">

        {/* Header with Back Button */}
        <div className="px-3 py-2 flex items-center gap-2 border-b border-[#1F2937]">
          <button
            onClick={goBack}
            disabled={pathHistory.length === 0}
            className={`p-1 rounded transition ${
              pathHistory.length === 0
                ? "text-gray-600 cursor-not-allowed"
                : "text-gray-400 hover:text-white hover:bg-[#1B2540]"
            }`}
            title="Go back"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-[11px] tracking-widest text-gray-400 font-semibold">
            EXPLORER
          </span>
          {currentPath && (
            <span className="ml-auto text-[10px] text-gray-600 truncate max-w-[80px]">
              {currentPath.split("/").pop()}
            </span>
          )}
        </div>

        {/* File Tree */}
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {fileTree.length === 0 && !loading && (
            <p className="text-gray-600 text-xs px-2 py-2">No files found</p>
          )}
          {fileTree.map((item) => (
            <div
              key={item.path}
              onClick={() => fetchFiles(item.path)}
              className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded cursor-pointer hover:bg-[#172036] transition ${
                activeTab === item.path ? "bg-[#1A2540] text-white" : ""
              }`}
            >
              {/* ✅ isFolder handles all possible API type values */}
              {isFolder(item) ? (
                <Folder size={15} className="text-yellow-400" />
              ) : (
                <File size={15} className="text-blue-400" />
              )}
              <span className="truncate">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col bg-[#0A0F1A] min-w-0">

        {/* Tabs Bar */}
        <div className="flex items-center bg-[#0D1324] border-b border-[#1F2937] h-10 overflow-x-auto">
          {openTabs.map((tab) => (
            <div
              key={tab.path}
              onClick={() => switchTab(tab.path)}
              className={`flex items-center gap-2 px-3 h-full text-sm border-r border-[#1F2937] cursor-pointer whitespace-nowrap transition ${
                activeTab === tab.path
                  ? "bg-[#111827] text-white"
                  : "text-gray-400 hover:bg-[#111827] hover:text-gray-200"
              }`}
            >
              <File size={13} className="text-blue-400" />
              {tab.name}
              <button
                onClick={(e) => closeTab(tab.path, e)}
                className="ml-1 p-0.5 rounded hover:bg-[#2a3550] text-gray-500 hover:text-white transition"
                title="Close"
              >
                <X size={11} />
              </button>
            </div>
          ))}

          <div className="ml-auto flex items-center gap-1 pr-3 shrink-0">
            <button
              onClick={copyCode}
              className="p-1.5 rounded hover:bg-[#1B2540]"
              title="Copy"
            >
              <Clipboard size={15} className="text-gray-400 hover:text-white" />
            </button>
            <button className="p-1.5 rounded hover:bg-[#1B2540]" title="Raw">
              <FileText size={15} className="text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-auto p-4 bg-[#0A0F1A]">
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <RotateCcw className="animate-spin" size={16} />
              Loading...
            </div>
          ) : code ? (
            <SyntaxHighlighter
              language={getLanguage(activeTab || "")}
              style={tomorrow}
              showLineNumbers
              wrapLines={false}
              wrapLongLines={false}
              customStyle={{
                background: "#0A0F1A",
                padding: "20px",
                borderRadius: "8px",
                fontSize: "13px",
                overflowX: "auto",
                whiteSpace: "pre",
              }}
            >
              {code}
            </SyntaxHighlighter>
          ) : (
            <p className="text-gray-500 text-sm">Select a file to view code</p>
          )}
        </div>
      </div>
    </div>
  );
}