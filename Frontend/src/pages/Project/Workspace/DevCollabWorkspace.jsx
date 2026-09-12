import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import toast from "react-hot-toast";

import TopHeader from "./TopHeader";
import ActivityBar from "./ActivityBar";
import FileTreeExplorer from "./FileTreeExplorer";
import MultiTabEditor from "./MultiTabEditor";
import InteractiveTerminal from "./InteractiveTerminal";
import SourceControlPanel from "./SourceControlPanel";
import AIAgentPanel from "./AIAgentPanel";
import StatusBar from "./StatusBar";
import CommandPalette from "./CommandPalette";
import InlineAIMenu from "./InlineAIMenu";
import DiffViewerModal from "./DiffViewerModal";
import LivePreviewModal from "./preview/LivePreviewModal";
import TestingInsights from "./Testing/TestingInsights";

import { useSocketContext } from "../../../context/SocketContext";

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://devcollab-production-f60e.up.railway.app");

const REFERENCE_CODE = `import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PanelLeft,
  Save,
  GitCommit,
  Play,
  MoreVertical
} from "lucide-react";

const CodeEditor = () => {
  const { owner, repo, path } = useParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fileInfo, setFileInfo] = useState(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const res = await fetch(\`/api/github/file?owner=\${owner}&repo=\${repo}&path=\${path}\`);
        const data = await res.json();
        setCode(atob(data.content));
        setFileInfo(data);
      } catch (error) {
        console.error('Failed to fetch file:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchFile();
  }, [owner, repo, path]);

  return (
    <div className="flex h-full bg-[#0B1220] text-[#E6EDF3]">
      {/* DevCollab Workspace Code Editor */}
    </div>
  );
};

export default CodeEditor;
`;

const findFirstFile = (nodes) => {
  if (!nodes || nodes.length === 0) return null;
  const priorityFiles = [
    "src/App.jsx",
    "src/App.tsx",
    "src/App.js",
    "src/main.jsx",
    "src/main.tsx",
    "src/index.jsx",
    "src/index.js",
    "index.html",
    "package.json",
    "README.md",
  ];

  const allFiles = [];
  const collect = (list) => {
    for (const item of list) {
      if (item.type === "file" || (!item.children && item.type !== "dir")) {
        allFiles.push(item.path);
      }
      if (item.children && item.children.length > 0) {
        collect(item.children);
      }
    }
  };
  collect(nodes);

  for (const prio of priorityFiles) {
    const match = allFiles.find((p) => p === prio || p.endsWith("/" + prio));
    if (match) return match;
  }
  return allFiles[0] || null;
};

export default function DevCollabWorkspace({
  projectId,
  project,
  commitsCount = 12,
  pullCount = 3,
  memberCount = 5,
  user,
  onTabChange,
  initialTab = ""
}) {
  const [activeView, setActiveView] = useState("explorer"); // 'explorer' | 'sourceControl' | 'search' | 'debug' | 'extensions' | null
  const [rightPanel, setRightPanel] = useState(initialTab === "visual-regression" ? "testing" : "aiAgent"); // 'aiAgent' | 'testing' | null
  const [terminalOpen, setTerminalOpen] = useState(true); // Bottom terminal panel open matching reference

  const [fileItems, setFileItems] = useState([]);
  const [openTabs, setOpenTabs] = useState(() =>
    initialTab === "visual-regression"
      ? [{ path: "visual-regression", name: "Visual Regression", isTesting: true }]
      : []
  );
  const [activeTabPath, setActiveTabPath] = useState(initialTab || "");
  const [fileContents, setFileContents] = useState({});
  const [modifiedFiles, setModifiedFiles] = useState({});
  const [selectedCode, setSelectedCode] = useState("");
  const [isTreeLoading, setIsTreeLoading] = useState(true);
  const [isSyncingRepo, setIsSyncingRepo] = useState(false);

  /* Modals & Live Preview */
  const [diffModal, setDiffModal] = useState({ isOpen: false, path: null, original: "", modified: "" });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [inlineAIMenuOpen, setInlineAIMenuOpen] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [devServer, setDevServer] = useState(null);
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);

  const projectName = project?.projectName || "devcollab-webapp";

  const { socket } = useSocketContext();

  /* ---------------- OPEN FILE & FETCH CONTENT (FROM REAL DISK / GITHUB) ---------------- */
  const handleSelectFile = useCallback(async (filePath) => {
    if (!filePath) return;

    setActiveTabPath(filePath);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.path === filePath)) return prev;
      return [...prev, { path: filePath, name: filePath.split("/").pop(), isDirty: false }];
    });

    setFileContents((prev) => {
      if (prev[filePath] !== undefined) return prev;
      return { ...prev, [filePath]: "// Loading file content..." };
    });

    let content = null;

    // 1. Try reading physical disk workspace file
    try {
      const diskRes = await axios.get(`${API_URL}/api/project/${projectId}/workspace/file-content`, {
        params: { path: filePath },
      });
      if (diskRes.data && diskRes.data.content !== undefined) {
        content = diskRes.data.content;
      }
    } catch (_) {}

    // 2. Fallback to GitHub / contents endpoint
    if (content === null) {
      try {
        const res = await axios.get(`${API_URL}/api/project/${projectId}/contents`, {
          params: { path: filePath },
        });

        if (res.data && res.data.content !== undefined) {
          content = res.data.content;
        }
      } catch (err) {
        content = `// ${filePath}\n// File loaded in DevCollab Workspace\n`;
      }
    }

    if (content !== null) {
      setFileContents((prev) => ({ ...prev, [filePath]: content }));
    }
  }, [projectId]);

  /* ---------------- FETCH FILE TREE FROM BACKEND & WORKSPACE DISK ---------------- */
  const fetchTree = useCallback(async (autoSelect = false) => {
    if (!projectId) return;
    setIsTreeLoading(true);
    let items = [];

    try {
      // 1. Try real workspace disk files first
      try {
        const wsRes = await axios.get(`${API_URL}/api/project/${projectId}/workspace/files`);
        if (wsRes.data && wsRes.data.items && wsRes.data.items.length > 0) {
          items = wsRes.data.items;
        }
      } catch (_) {}

      // 2. Fallback to GitHub tree if workspace files empty or starter template
      if (!items || items.length === 0) {
        try {
          const res = await axios.get(`${API_URL}/api/project/${projectId}/tree`);
          if (res.data && res.data.items && res.data.items.length > 0) {
            items = res.data.items;
          }
        } catch (err) {
          try {
            const contentsRes = await axios.get(`${API_URL}/api/project/${projectId}/contents`);
            if (contentsRes.data && contentsRes.data.items && contentsRes.data.items.length > 0) {
              items = contentsRes.data.items.map((i) => ({ ...i, path: i.path, type: i.type }));
            }
          } catch (fallbackErr) {}
        }
      }

      setFileItems(items || []);

      if (items && items.length > 0) {
        const first = findFirstFile(items);
        if (first) {
          setActiveTabPath((current) => {
            if (!current || autoSelect) {
              handleSelectFile(first);
              return first;
            }
            return current;
          });
        }
      }
    } finally {
      setIsTreeLoading(false);
    }
  }, [projectId, handleSelectFile]);

  useEffect(() => {
    fetchTree(true);
  }, [fetchTree]);

  /* ---------------- FORCE SYNC FROM GITHUB REPOSITORY ---------------- */
  const handleSyncRepo = async () => {
    if (!projectId) return;
    setIsSyncingRepo(true);
    const toastId = toast.loading("Syncing real repository files from GitHub...");
    try {
      const res = await axios.post(`${API_URL}/api/project/${projectId}/workspace/sync-repo`);
      if (res.data?.items && res.data.items.length > 0) {
        setFileItems(res.data.items);
        const first = findFirstFile(res.data.items);
        if (first) {
          handleSelectFile(first);
        }
        toast.success(res.data.message || "Repository synchronized!", { id: toastId });
      } else {
        await fetchTree(true);
        toast.success("Repository files refreshed!", { id: toastId });
      }
    } catch (err) {
      await fetchTree(true);
      toast.success("Refreshed workspace file tree", { id: toastId });
    } finally {
      setIsSyncingRepo(false);
    }
  };

  /* ---------------- ACTIVE DEV SERVER STATUS & REGISTRY ---------------- */
  useEffect(() => {
    if (!projectId) return;

    // 1. Check existing active dev servers on backend
    axios
      .get(`${API_URL}/api/project/${projectId}/dev-servers`)
      .then((res) => {
        if (res.data?.servers?.length > 0) {
          const s = res.data.servers[0];
          const proxyPath = `/api/project/${projectId}/preview/${s.port}/`;
          setDevServer({
            port: s.port,
            framework: s.framework || "Vite",
            status: s.status,
            url: proxyPath,
            previewUrl: `${API_URL}${proxyPath}`,
          });
        }
      })
      .catch(() => {});

    // 2. Real-time dev server status updates
    if (!socket) return;
    const handleDevServerStatus = ({ projectId: pId, server }) => {
      if (pId === projectId && server) {
        if (server.status === "running") {
          const proxyPath = `/api/project/${projectId}/preview/${server.port}/`;
          setDevServer({
            port: server.port,
            framework: server.framework || "Vite",
            status: "running",
            url: proxyPath,
            previewUrl: `${API_URL}${proxyPath}`,
          });
        } else if (server.status === "stopped") {
          setDevServer(null);
        }
      }
    };

    socket.on("workspace:dev-server-status", handleDevServerStatus);
    return () => {
      socket.off("workspace:dev-server-status", handleDevServerStatus);
    };
  }, [socket, projectId]);

  /* ---------------- REAL-TIME FILESYSTEM WATCHER LISTENER ---------------- */
  // Debounced: agent creates many files rapidly; we only need ONE tree refresh
  // after all changes settle (1.5s), not one per file. Without this, 8 files
  // = 8 concurrent fetchTree calls flooding the backend while agent is still running.
  const fsChangeDebounceRef = useRef(null);
  useEffect(() => {
    if (!socket) return;
    const handleFsChange = (data) => {
      if (!data || !data.projectId || data.projectId === projectId) {
        // Cancel any pending refresh and schedule a new one
        if (fsChangeDebounceRef.current) clearTimeout(fsChangeDebounceRef.current);
        fsChangeDebounceRef.current = setTimeout(() => {
          fetchTree(false);
          fsChangeDebounceRef.current = null;
        }, 1500);
      }
    };
    socket.on("workspace:fs-change", handleFsChange);
    return () => {
      socket.off("workspace:fs-change", handleFsChange);
      if (fsChangeDebounceRef.current) clearTimeout(fsChangeDebounceRef.current);
    };
  }, [socket, projectId, fetchTree]);

  /* ---------------- CODE CHANGE IN EDITOR ---------------- */
  const handleCodeChange = (path, newCode) => {
    setFileContents((prev) => ({ ...prev, [path]: newCode }));
    setModifiedFiles((prev) => ({ ...prev, [path]: "M" }));
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, isDirty: true } : t))
    );
  };

  /* ---------------- SAVE FILE TO DISK ONLY (Ctrl+S) ---------------- */
  const handleSaveFile = async (path) => {
    const content = fileContents[path] || "";

    // Save to local workspace disk only — GitHub push is done via Commit & Push
    try {
      await axios.post(`${API_URL}/api/project/${projectId}/workspace/save-file`, {
        path,
        content,
      });

      toast.success(`Saved ${path.split("/").pop()}`, { duration: 1500 });

      setOpenTabs((prev) =>
        prev.map((t) => (t.path === path ? { ...t, isDirty: false } : t))
      );

      // Keep the file in modifiedFiles so it shows up in Source Control for committing
      // (only cleared after an explicit Commit & Push)
    } catch (err) {
      toast.error(`Failed to save ${path.split("/").pop()}`);
    }
  };


  /* ---------------- CREATE FILE ---------------- */
  const handleCreateFile = async () => {
    const fileName = prompt("Enter new file path (e.g. src/utils/helper.js):");
    if (!fileName || !fileName.trim()) return;

    const path = fileName.trim();

    // Sync to disk workspace
    try {
      await axios.post(`${API_URL}/api/project/${projectId}/workspace/save-file`, {
        path,
        content: "",
      });
    } catch (_) {}

    try {
      await axios.post(`${API_URL}/api/project/${projectId}/create-file`, {
        path,
        content: "",
        message: `Created ${path} via DevCollab Workspace`,
      });
      toast.success(`Created file ${path}`);
      fetchTree();
    } catch (err) {
      fetchTree();
    }
    handleSelectFile(path);
  };

  /* ---------------- DELETE FILE ---------------- */
  const handleDeleteFile = async (path) => {
    if (!window.confirm(`Delete ${path} permanently?`)) return;

    // Delete from disk workspace
    try {
      await axios.delete(`${API_URL}/api/project/${projectId}/workspace/delete-file`, {
        data: { path },
      });
    } catch (_) {}

    try {
      await axios.delete(`${API_URL}/api/project/${projectId}/delete-file`, {
        data: { path, message: `Deleted ${path} via DevCollab Workspace` },
      });
      toast.success(`Deleted ${path}`);
      fetchTree();
    } catch (err) {
      fetchTree();
    }
    setOpenTabs((prev) => prev.filter((t) => t.path !== path));
    if (activeTabPath === path) {
      const remaining = openTabs.filter((t) => t.path !== path);
      setActiveTabPath(remaining.length ? remaining[0].path : null);
    }
  };

  /* ---------------- COMMIT & PUSH ---------------- */
  const handleCommitAndPush = async (commitMessage) => {
    if (!commitMessage?.trim()) return;
    setIsPushing(true);

    // Build the list of files to commit with their latest content
    const filesToCommit = Object.keys(modifiedFiles).map((path) => ({
      path,
      content: fileContents[path] ?? "",
      status: modifiedFiles[path] || "M",
    }));

    if (filesToCommit.length === 0) {
      toast.error("No modified files to commit.");
      setIsPushing(false);
      return;
    }

    try {
      const res = await axios.post(`${API_URL}/api/project/${projectId}/commit-and-push`, {
        commitMessage: commitMessage.trim(),
        files: filesToCommit,
      });

      const { pushed = [], failed = [], message } = res.data;

      if (pushed.length > 0) {
        toast.success(message || `Committed ${pushed.length} file(s) successfully!`);
        // Clear dirty state for all successfully pushed files
        setModifiedFiles((prev) => {
          const copy = { ...prev };
          pushed.forEach((p) => delete copy[p]);
          return copy;
        });
        setOpenTabs((prev) =>
          prev.map((t) => (pushed.includes(t.path) ? { ...t, isDirty: false } : t))
        );
      }

      if (failed.length > 0) {
        toast.error(`${failed.length} file(s) failed to push. Check console for details.`);
        console.warn("[CommitPush] Failed files:", failed);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to commit and push changes.");
    } finally {
      setIsPushing(false);
    }
  };

  /* ---------------- CLOSE TAB ---------------- */
  const handleCloseTab = (path) => {
    const remaining = openTabs.filter((t) => t.path !== path);
    setOpenTabs(remaining);
    if (activeTabPath === path) {
      setActiveTabPath(remaining.length ? remaining[remaining.length - 1].path : null);
    }
  };

  return (
    <div
      className="w-full h-screen flex flex-col overflow-hidden bg-[#0D1117] text-[#E6EDF3] font-sans relative select-none"
      style={{
        "--ide-bg": "#0D1117",
        "--ide-sidebar": "#0B111B",
        "--ide-panel": "#0D1522",
        "--ide-editor": "#0B1220",
        "--ide-border": "#1E293B",
        "--ide-border-subtle": "#172033",
        "--ide-text": "#E6EDF3",
        "--ide-muted": "#8B949E",
        "--ide-accent": "#3794FF",
        "--ide-active": "#18233A",
        "--ide-success": "#3FB950",
        "--ide-warning": "#D29922",
        "--ide-error": "#F85149",
      }}
    >
      {/* 1. TOP HEADER (~40px) */}
      <TopHeader
        projectName={projectName}
        branch="main"
        commitsCount={commitsCount}
        pullCount={pullCount}
        memberCount={memberCount}
        activeTab={activeTabPath === "visual-regression" ? "testing" : "code"}
        onTabChange={(tab) => {
          if (tab === "testing") {
            setOpenTabs((prev) => {
              if (prev.some((t) => t.path === "visual-regression")) return prev;
              return [...prev, { path: "visual-regression", name: "Visual Regression", isTesting: true }];
            });
            setActiveTabPath("visual-regression");
          } else if (tab === "code") {
            if (activeTabPath === "visual-regression") {
              const otherTab = openTabs.find((t) => t.path !== "visual-regression");
              if (otherTab) setActiveTabPath(otherTab.path);
              else setActiveTabPath("");
            }
          } else {
            onTabChange?.(tab);
          }
        }}
        user={user}
        onPullLatest={() => toast.success("Already up to date.")}
        onPush={() => handleCommitAndPush("Update repository")}
        isPushing={isPushing}
      />

      {/* 2. MAIN IDE WORKSPACE BODY */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Activity Bar (48px) */}
        <ActivityBar
          activeView={
            rightPanel === "testing" || activeTabPath === "visual-regression"
              ? "testing"
              : rightPanel === "aiAgent"
              ? "aiAgent"
              : activeView
          }
          setActiveView={(view) => {
            if (view === "aiAgent") {
              setRightPanel(rightPanel === "aiAgent" ? null : "aiAgent");
            } else if (view === "testing") {
              setOpenTabs((prev) => {
                if (prev.some((t) => t.path === "visual-regression")) return prev;
                return [...prev, { path: "visual-regression", name: "Visual Regression", isTesting: true }];
              });
              setActiveTabPath("visual-regression");
              if (!activeView) setActiveView("explorer");
              setRightPanel(rightPanel === "testing" ? null : "testing");
            } else {
              setActiveView(view);
            }
          }}
        />

        {/* Secondary Explorer / Source Control Panel */}
        {activeView === "explorer" && (
          <FileTreeExplorer
            projectName={projectName.toUpperCase()}
            fileItems={fileItems}
            onSelectFile={handleSelectFile}
            activeTabPath={activeTabPath}
            onCreateFile={handleCreateFile}
            onRefresh={() => fetchTree(false)}
            onSyncRepo={handleSyncRepo}
            isLoading={isTreeLoading}
            isSyncing={isSyncingRepo}
            onDeleteFile={handleDeleteFile}
            modifiedFiles={modifiedFiles}
          />
        )}

        {activeView === "sourceControl" && (
          <SourceControlPanel
            projectId={projectId}
            modifiedFiles={modifiedFiles}
            fileContents={fileContents}
            onOpenDiff={(path) =>
              setDiffModal({
                isOpen: true,
                path,
                original: "",
                modified: fileContents[path] || "",
              })
            }
            onCommitAndPush={handleCommitAndPush}
            isPushing={isPushing}
          />
        )}

        {/* Center: Editor + Bottom Terminal Panel */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          {/* Main Monaco Multi-Tab Editor */}
          <MultiTabEditor
            openTabs={openTabs}
            activeTabPath={activeTabPath}
            onSelectTab={setActiveTabPath}
            onCloseTab={handleCloseTab}
            fileContents={fileContents}
            onCodeChange={handleCodeChange}
            onSaveFile={handleSaveFile}
            onTriggerInlineAI={() => setInlineAIMenuOpen(true)}
            onSelectionChange={setSelectedCode}
          />

          {/* Bottom Terminal Panel */}
          {terminalOpen && (
            <InteractiveTerminal
              projectId={projectId}
              projectName={projectName}
              onClose={() => setTerminalOpen(false)}
              onOpenPreview={(serverInfo) => {
                if (serverInfo) setDevServer(serverInfo);
                setLivePreviewOpen(true);
              }}
            />
          )}
        </div>

        {/* Right Docked Panel: AI Agent OR Testing Insights */}
        {rightPanel === "aiAgent" && (
          <AIAgentPanel
            projectId={projectId}
            activeTabPath={activeTabPath}
            openTabs={openTabs.map(t => t.path || t)}
            selectedCode={selectedCode}
            onClose={() => setRightPanel(null)}
            onApplyAgentChanges={(path, newCode) => {
              handleCodeChange(path, newCode);
              handleSelectFile(path);
              toast.success(`Applied AI changes to ${path}`);
            }}
            onOpenDiffModal={(path, orig, modified) =>
              setDiffModal({ isOpen: true, path, original: orig, modified })
            }
          />
        )}

        {rightPanel === "testing" && (
          <TestingInsights
            onClose={() => setRightPanel(null)}
          />
        )}
      </div>

      {/* 3. BOTTOM STATUS BAR (~22px) */}
      <StatusBar
        branch="main"
        errorCount={0}
        warningCount={3}
        infoCount={0}
        cursorPos={{ line: 32, col: 15 }}
        spaces={2}
        encoding="UTF-8"
        eol="LF"
        language="JavaScript React"
        aiAgentStatus="Connected"
        devServer={devServer}
        onOpenPreview={() => setLivePreviewOpen(true)}
      />

      {/* Modals & Overlays */}
      <LivePreviewModal
        isOpen={livePreviewOpen}
        onClose={() => setLivePreviewOpen(false)}
        previewUrl={devServer?.previewUrl}
        port={devServer?.port}
        framework={devServer?.framework}
        status={devServer?.status}
        projectName={projectName}
        onRestartServer={() => {
          if (socket) {
            socket.emit("terminal:restart", { sessionId: "default" });
          }
        }}
      />

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        fileItems={fileItems}
        onSelectFile={handleSelectFile}
        onSaveActiveFile={() => activeTabPath && handleSaveFile(activeTabPath)}
        onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
        onToggleAIAgent={() => setRightPanel(rightPanel === "aiAgent" ? null : "aiAgent")}
      />

      <InlineAIMenu
        isOpen={inlineAIMenuOpen}
        onClose={() => setInlineAIMenuOpen(false)}
        selectedCode={activeTabPath ? fileContents[activeTabPath] : ""}
        filePath={activeTabPath}
      />

      <DiffViewerModal
        isOpen={diffModal.isOpen}
        onClose={() => setDiffModal({ ...diffModal, isOpen: false })}
        filePath={diffModal.path}
        originalCode={diffModal.original}
        modifiedCode={diffModal.modified}
        onAccept={() => {
          if (diffModal.path) {
            handleCodeChange(diffModal.path, diffModal.modified);
            toast.success("Accepted AI diff changes.");
          }
          setDiffModal({ ...diffModal, isOpen: false });
        }}
      />
    </div>
  );
}
