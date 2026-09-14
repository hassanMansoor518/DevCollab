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
import { webContainerService, WC_STATUS } from "../../../services/webContainerService";

const API_URL = import.meta.env.DEV ? "" : (import.meta.env.VITE_API_URL || "https://devcollab-production-f60e.up.railway.app");

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
  const [activeView, setActiveView] = useState("explorer");
  const [rightPanel, setRightPanel] = useState(initialTab === "visual-regression" ? "testing" : "aiAgent");
  const [terminalOpen, setTerminalOpen] = useState(true);

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
  const [wcStatus, setWcStatus] = useState(webContainerService.status);

  /* Modals & Live Preview */
  const [diffModal, setDiffModal] = useState({ isOpen: false, path: null, original: "", modified: "" });
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [inlineAIMenuOpen, setInlineAIMenuOpen] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [devServer, setDevServer] = useState(null);
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);

  const projectName = project?.projectName || "devcollab-webapp";

  // Cancellation tokens — prevent stale async fetches from contaminating new project state
  const activeProjectRef = useRef(projectId);
  const loadRequestIdRef = useRef(0);

  const { socket } = useSocketContext();

  /* ---------------- OPEN FILE & FETCH CONTENT (FROM WEBCONTAINER FIRST) ---------------- */
  const handleSelectFile = useCallback(async (filePath) => {
    if (!filePath) return;

    setActiveTabPath(filePath);
    setOpenTabs((prev) => {
      if (prev.some((t) => t.path === filePath)) return prev;
      return [...prev, { path: filePath, name: filePath.split("/").pop(), isDirty: false }];
    });

    setFileContents((prev) => {
      if (prev[filePath] !== undefined && prev[filePath] !== "// Loading file content...") return prev;
      return { ...prev, [filePath]: "// Loading file content..." };
    });

    let content = null;

    // 1. Try reading directly from WebContainer virtual filesystem (Active Source of Truth)
    try {
      const wcContent = await webContainerService.readFile(filePath);
      if (wcContent !== null && wcContent !== undefined) {
        content = wcContent;
      }
    } catch (_) {}

    // 2. If not found in WebContainer, fetch from GitHub / backend API and write to WebContainer
    if (content === null) {
      try {
        const res = await axios.get(`${API_URL}/api/project/${projectId}/contents`, {
          params: { path: filePath },
          withCredentials: true,
        });

        if (res.data && res.data.content !== undefined) {
          content = res.data.content;
          // Store in WebContainer so subsequent reads and terminal can access it
          try {
            await webContainerService.writeFile(filePath, content);
          } catch (_) {}
        }
      } catch (err) {
        // Fallback to disk API
        try {
          const diskRes = await axios.get(`${API_URL}/api/project/${projectId}/workspace/file-content`, {
            params: { path: filePath },
            withCredentials: true,
          });
          if (diskRes.data?.content !== undefined) {
            content = diskRes.data.content;
            try {
              await webContainerService.writeFile(filePath, content);
            } catch (_) {}
          }
        } catch (_) {}

        if (content === null) {
          content = `// ${filePath}\n// (File created in WebContainer workspace)\n`;
          try {
            await webContainerService.writeFile(filePath, content);
          } catch (_) {}
        }
      }
    }

    if (content !== null) {
      setFileContents((prev) => ({ ...prev, [filePath]: content }));
    }
  }, [projectId]);

  /* ---------------- FETCH FILE TREE & MOUNT INTO WEBCONTAINER ---------------- */
  const fetchTree = useCallback(async (autoSelect = false, overrideProjectId = null) => {
    const pid = overrideProjectId || projectId;
    if (!pid) return;

    const reqId = ++loadRequestIdRef.current;
    const isCurrentProject = () => activeProjectRef.current === pid && loadRequestIdRef.current === reqId;

    setIsTreeLoading(true);
    let items = [];

    try {
      // === STRATEGY 1: Fast Bundle Endpoint (all files + contents in one request) ===
      try {
        const bundleRes = await axios.get(`${API_URL}/api/project/${pid}/tree/bundle`, {
          withCredentials: true,
          timeout: 45000,
        });

        if (!isCurrentProject()) return;

        const bundle = bundleRes.data;
        if (bundle && Array.isArray(bundle.files) && bundle.files.length > 0) {
          console.log(`[Workspace] Bundle loaded: ${bundle.files.length} files for project ${pid} (source: ${bundle.source})`);

          await webContainerService.boot();
          await webContainerService.mountRepository({
            fileBundle: bundle,
            projectId: pid,
          });

          if (!isCurrentProject()) return;

          const wcItems = await webContainerService.getFsTree();
          items = (wcItems && wcItems.length > 0) ? wcItems : (bundle.tree || []);

          setFileItems(items);
          if (autoSelect && items.length > 0) {
            const first = findFirstFile(items);
            if (first && isCurrentProject()) handleSelectFile(first);
          }
          return;
        }
      } catch (bundleErr) {
        console.warn("[Workspace] Bundle endpoint fallback:", bundleErr.message);
      }

      if (!isCurrentProject()) return;

      // === STRATEGY 2: Tree endpoint for structure + per-file content fetching ===
      if (project?.githubRepo) {
        try {
          const treeRes = await axios.get(`${API_URL}/api/project/${pid}/tree`, { withCredentials: true });
          if (treeRes.data && Array.isArray(treeRes.data.items) && treeRes.data.items.length > 0) {
            items = treeRes.data.items;
          }
        } catch (treeErr) {
          console.warn("[Workspace] GitHub tree fetch fallback:", treeErr.message);
        }
      }

      if (!isCurrentProject()) return;

      // Helper to fetch file content on demand
      const fetchContentFn = async (filePath) => {
        if (!isCurrentProject()) return "";
        try {
          const res = await axios.get(`${API_URL}/api/project/${pid}/contents`, {
            params: { path: filePath },
            withCredentials: true,
          });
          return res.data?.content || "";
        } catch (_) {
          return "";
        }
      };

      // Mount with tree + per-file fetching
      try {
        await webContainerService.boot();
        await webContainerService.mountRepository({
          items,
          fetchContentFn,
          projectId: pid,
        });

        if (!isCurrentProject()) return;

        const wcItems = await webContainerService.getFsTree();
        if (wcItems && wcItems.length > 0) {
          items = wcItems;
        }
      } catch (wcErr) {
        console.warn("[Workspace] WebContainer mount error, using repo list fallback:", wcErr.message);
      }

      if (!isCurrentProject()) return;

      setFileItems(items || []);

      if (autoSelect && items && items.length > 0) {
        const first = findFirstFile(items);
        if (first && isCurrentProject()) handleSelectFile(first);
      }
    } finally {
      if (isCurrentProject()) {
        setIsTreeLoading(false);
      }
    }
  }, [projectId, project?.githubRepo, handleSelectFile]);

  /* ---------------- PROJECT ISOLATION: Reset + Clean WebContainer on project change ---------------- */
  useEffect(() => {
    if (!projectId) return;

    activeProjectRef.current = projectId;
    loadRequestIdRef.current++;

    // Full state wipe before loading new project
    setOpenTabs([]);
    setActiveTabPath("");
    setFileContents({});
    setModifiedFiles({});
    setFileItems([]);
    setDevServer(null);
    setLivePreviewOpen(false);
    setDiffModal({ isOpen: false, path: null, original: "", modified: "" });
    setSelectedCode("");
    setIsTreeLoading(true);

    // Switch WebContainer to the new project (kills processes, wipes FS)
    webContainerService.switchProject(projectId).then(() => {
      if (activeProjectRef.current === projectId) {
        fetchTree(true, projectId);
      }
    }).catch((err) => {
      console.warn("[Workspace] switchProject error:", err.message);
      fetchTree(true, projectId);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  /* ---------------- FORCE SYNC FROM GITHUB REPOSITORY ---------------- */
  const handleSyncRepo = async () => {
    if (!projectId) return;
    setIsSyncingRepo(true);
    const toastId = toast.loading("Syncing repository files from GitHub into WebContainer...");
    try {
      await fetchTree(true);
      toast.success("Repository synchronized into WebContainer!", { id: toastId });
    } catch (err) {
      toast.error("Failed to sync repository files", { id: toastId });
    } finally {
      setIsSyncingRepo(false);
    }
  };

  /* ---------------- DEV SERVER STATUS & WEBCONTAINER SUBSCRIPTIONS ---------------- */
  useEffect(() => {
    // 1. Subscribe to WebContainer serverReady events
    const unsubServer = webContainerService.on("serverReady", (serverInfo) => {
      setDevServer(serverInfo);
      toast.success(`Development server running on port ${serverInfo.port}`, { duration: 3000 });
    });

    // 2. Subscribe to WebContainer status events
    const unsubStatus = webContainerService.on("status", ({ status }) => {
      setWcStatus(status);
    });

    // 3. Subscribe to WebContainer filesystem events to keep FileTreeExplorer updated
    const unsubFs = webContainerService.on("fsChange", async () => {
      try {
        const updatedItems = await webContainerService.getFsTree();
        if (updatedItems && updatedItems.length > 0) {
          setFileItems(updatedItems);
        }
      } catch (_) {}
    });

    return () => {
      unsubServer();
      unsubStatus();
      unsubFs();
    };
  }, []);

  /* ---------------- REAL-TIME FILESYSTEM WATCHER LISTENER (Socket Fallback) ---------------- */
  const fsChangeDebounceRef = useRef(null);
  useEffect(() => {
    if (!socket) return;
    const handleFsChange = (data) => {
      if (!data || !data.projectId || data.projectId === projectId) {
        if (fsChangeDebounceRef.current) clearTimeout(fsChangeDebounceRef.current);
        fsChangeDebounceRef.current = setTimeout(async () => {
          try {
            const updatedItems = await webContainerService.getFsTree();
            if (updatedItems && updatedItems.length > 0) {
              setFileItems(updatedItems);
            }
          } catch (_) {}
          fsChangeDebounceRef.current = null;
        }, 1500);
      }
    };
    socket.on("workspace:fs-change", handleFsChange);
    return () => {
      socket.off("workspace:fs-change", handleFsChange);
      if (fsChangeDebounceRef.current) clearTimeout(fsChangeDebounceRef.current);
    };
  }, [socket, projectId]);

  /* ---------------- CODE CHANGE IN EDITOR ---------------- */
  const handleCodeChange = (path, newCode) => {
    setFileContents((prev) => ({ ...prev, [path]: newCode }));
    setModifiedFiles((prev) => ({ ...prev, [path]: "M" }));
    setOpenTabs((prev) =>
      prev.map((t) => (t.path === path ? { ...t, isDirty: true } : t))
    );
  };

  /* ---------------- SAVE FILE TO WEBCONTAINER (Ctrl+S) ---------------- */
  const handleSaveFile = async (path) => {
    const content = fileContents[path] || "";

    try {
      // 1. Save directly to in-browser WebContainer virtual filesystem (Single Source of Truth)
      await webContainerService.writeFile(path, content);

      // 2. Background sync to backend disk for redundancy without blocking
      axios.post(`${API_URL}/api/project/${projectId}/workspace/save-file`, {
        path,
        content,
      }).catch(() => {});

      toast.success(`Saved ${path.split("/").pop()}`, { duration: 1500 });

      setOpenTabs((prev) =>
        prev.map((t) => (t.path === path ? { ...t, isDirty: false } : t))
      );
    } catch (err) {
      toast.error(`Failed to save ${path.split("/").pop()}: ${err.message}`);
    }
  };

  /* ---------------- CREATE FILE ---------------- */
  const handleCreateFile = async () => {
    const fileName = prompt("Enter new file path (e.g. src/components/Header.jsx):");
    if (!fileName || !fileName.trim()) return;

    const path = fileName.trim();

    try {
      // 1. Create file directly in WebContainer virtual FS
      await webContainerService.writeFile(path, "");

      // 2. Refresh Explorer tree from WebContainer
      const updatedTree = await webContainerService.getFsTree();
      setFileItems(updatedTree);

      toast.success(`Created file ${path}`);
      handleSelectFile(path);
    } catch (err) {
      toast.error(`Failed to create file: ${err.message}`);
    }
  };

  /* ---------------- DELETE FILE ---------------- */
  const handleDeleteFile = async (path) => {
    if (!window.confirm(`Delete ${path} permanently?`)) return;

    try {
      // 1. Delete directly from WebContainer virtual FS
      await webContainerService.rm(path);

      // 2. Refresh Explorer tree from WebContainer
      const updatedTree = await webContainerService.getFsTree();
      setFileItems(updatedTree);

      toast.success(`Deleted ${path}`);
    } catch (err) {
      toast.error(`Failed to delete file: ${err.message}`);
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

    // Read current content for each modified file from WebContainer
    const filesToCommit = [];
    for (const path of Object.keys(modifiedFiles)) {
      let content = fileContents[path];
      if (content === undefined) {
        try {
          content = (await webContainerService.readFile(path)) || "";
        } catch (_) {
          content = "";
        }
      }
      filesToCommit.push({
        path,
        content: content ?? "",
        status: modifiedFiles[path] || "M",
      });
    }

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
            onApplyAgentChanges={async (path, newCode) => {
              try {
                await webContainerService.writeFile(path, newCode);
              } catch (_) {}
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
        wcStatus={wcStatus}
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
        onAccept={async () => {
          if (diffModal.path) {
            try {
              await webContainerService.writeFile(diffModal.path, diffModal.modified);
            } catch (_) {}
            handleCodeChange(diffModal.path, diffModal.modified);
            toast.success("Accepted AI diff changes.");
          }
          setDiffModal({ ...diffModal, isOpen: false });
        }}
      />
    </div>
  );
}
