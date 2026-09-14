import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileJson,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Trash2,
  Package
} from "lucide-react";

/* Helper to map file extensions to icon colors matching VS Code */
const getFileIcon = (fileName = "") => {
  const ext = fileName.split(".").pop().toLowerCase();
  if (fileName === ".gitignore") {
    return <FileText size={14} className="text-[#F85149] shrink-0" />;
  }
  switch (ext) {
    case "jsx":
      return <FileCode size={14} className="text-[#3794FF] shrink-0" />;
    case "js":
      return <FileCode size={14} className="text-[#E5C07B] shrink-0" />;
    case "ts":
    case "tsx":
      return <FileCode size={14} className="text-[#3794FF] shrink-0" />;
    case "json":
      return <FileJson size={14} className="text-[#D29922] shrink-0" />;
    case "css":
      return <FileCode size={14} className="text-[#4EC9B0] shrink-0" />;
    case "html":
      return <FileCode size={14} className="text-[#E06C75] shrink-0" />;
    case "md":
      return <FileText size={14} className="text-[#8B949E] shrink-0" />;
    default:
      return <File size={14} className="text-[#8B949E] shrink-0" />;
  }
};

/* Tree Node Component */
const TreeNode = ({
  item,
  onSelectFile,
  activeTabPath,
  onDelete,
  modifiedFiles = {},
  depth = 0,
}) => {
  const isDir = item.type === "dir" || item.type === "folder";
  const [isOpen, setIsOpen] = useState(item.defaultOpen ?? (depth === 0 && isDir));
  const isActive = activeTabPath === item.path;

  // Check dynamic status from props or mock default status
  const status = modifiedFiles[item.path] || item.status;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDir) {
      setIsOpen(!isOpen);
    } else {
      onSelectFile(item.path);
    }
  };

  return (
    <div className="select-none font-sans text-xs">
      <div
        onClick={handleClick}
        className={`group flex items-center justify-between py-1 px-1.5 cursor-pointer transition-colors ${
          isActive
            ? "bg-[#18233A] text-[#E6EDF3] font-medium"
            : "text-[#8B949E] hover:bg-[#151E2D] hover:text-[#E6EDF3]"
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          {isDir ? (
            <>
              {isOpen ? (
                <ChevronDown size={13} className="text-[#6E7681] shrink-0" />
              ) : (
                <ChevronRight size={13} className="text-[#6E7681] shrink-0" />
              )}
              {item.name === "node_modules" ? (
                <Package size={14} className="text-[#CB3837] shrink-0" />
              ) : isOpen ? (
                <FolderOpen size={14} className="text-[#3794FF] shrink-0" />
              ) : (
                <Folder size={14} className="text-[#8B949E] shrink-0" />
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-3" /> {/* indent spacing for files without chevron */}
              {getFileIcon(item.name)}
            </div>
          )}
          <span className={`truncate text-[12px] ${isActive ? "text-[#E6EDF3]" : item.name === "node_modules" ? "text-[#94A3B8]" : ""}`}>
            {item.name}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-1">
          {status && (
            <span
              className={`text-[10px] font-mono font-semibold px-1 ${
                status === "M"
                  ? "text-[#D29922]"
                  : status === "U"
                  ? "text-[#3FB950]"
                  : "text-[#F85149]"
              }`}
            >
              {status}
            </span>
          )}
          {!isDir && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.path);
              }}
              title="Delete File"
              className="p-0.5 text-[#6E7681] hover:text-[#F85149] opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>

      {isDir && isOpen && item.children && (
        <div className="flex flex-col">
          {item.children.map((child) => (
            <TreeNode
              key={child.path}
              item={child}
              onSelectFile={onSelectFile}
              activeTabPath={activeTabPath}
              onDelete={onDelete}
              modifiedFiles={modifiedFiles}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* Helper to convert flat path list into tree structure if needed */
const ensureTreeStructure = (items) => {
  if (!items || items.length === 0) return [];
  const hasFlatNestedPaths = items.some((i) => i.path && i.path.includes("/") && !i.children);
  if (!hasFlatNestedPaths) return items;

  const root = [];
  const sorted = [...items].sort((a, b) => a.path.localeCompare(b.path));

  for (const item of sorted) {
    const parts = item.path.split("/");
    const isDir = item.type === "dir" || item.type === "tree" || item.type === "folder";

    let currentPath = "";
    let parentChildren = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLeaf = i === parts.length - 1;

      if (isLeaf) {
        let existing = parentChildren.find((n) => n.name === part);
        if (!existing) {
          const node = {
            ...item,
            name: part,
            path: currentPath,
            type: isDir ? "dir" : "file",
            ...(isDir ? { children: item.children || [] } : {}),
          };
          parentChildren.push(node);
        } else if (isDir && !existing.children) {
          existing.type = "dir";
          existing.children = [];
        }
      } else {
        let dirNode = parentChildren.find((n) => n.name === part && (n.type === "dir" || n.children));
        if (!dirNode) {
          dirNode = {
            name: part,
            path: currentPath,
            type: "dir",
            children: [],
          };
          parentChildren.push(dirNode);
        }
        parentChildren = dirNode.children;
      }
    }
  }

  function sortNodes(nodes) {
    nodes.sort((a, b) => {
      const aIsDir = a.type === "dir" || Boolean(a.children);
      const bIsDir = b.type === "dir" || Boolean(b.children);
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name);
    });
    for (const node of nodes) {
      if (node.children) sortNodes(node.children);
    }
  }
  sortNodes(root);
  return root;
};

export default function FileTreeExplorer({
  projectName = "DEVCOLLAB-WEBAPP",
  fileItems = [],
  onSelectFile,
  activeTabPath,
  onCreateFile,
  onRefresh,
  onSyncRepo,
  isLoading = false,
  loadError = null,
  isSyncing = false,
  onDeleteFile,
  modifiedFiles = {}
}) {
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [projectFolderOpen, setProjectFolderOpen] = useState(true);

  // Structure real dynamic repo items into nested tree
  const itemsToRender = fileItems && fileItems.length > 0 ? ensureTreeStructure(fileItems) : [];

  return (
    <div className="w-52 sm:w-56 bg-[#0B111B] border-r border-[#1E293B] flex flex-col h-full shrink-0 select-none font-sans z-10">
      {/* Top Header: EXPLORER */}
      <div className="h-8 px-3 border-b border-[#172033] flex items-center justify-between text-[#8B949E]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B949E]">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Workspace Files"
            className={`p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors ${
              isLoading ? "animate-spin text-[#38BDF8]" : ""
            }`}
          >
            <RefreshCw size={12} />
          </button>
          {onSyncRepo && (
            <button
              onClick={onSyncRepo}
              disabled={isSyncing || isLoading}
              title="Sync from Real GitHub Repo"
              className={`p-1 hover:text-[#38BDF8] hover:bg-[#151E2D] rounded transition-colors ${
                isSyncing ? "text-[#38BDF8] animate-spin" : ""
              }`}
            >
              <Package size={12} />
            </button>
          )}
          <button
            onClick={onCreateFile}
            title="New File"
            className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
          >
            <Plus size={13} />
          </button>
          <button
            title="More Actions"
            className="p-1 hover:text-[#E6EDF3] hover:bg-[#151E2D] rounded transition-colors"
          >
            <MoreHorizontal size={12} />
          </button>
        </div>
      </div>

      {/* Workspace Project Folder Bar */}
      <div
        onClick={() => setProjectFolderOpen(!projectFolderOpen)}
        className="h-7 px-2 bg-[#0B111B] border-b border-[#172033] flex items-center justify-between cursor-pointer hover:bg-[#151E2D] transition-colors"
      >
        <div className="flex items-center gap-1 font-bold text-[11px] text-[#E6EDF3] uppercase tracking-wide truncate">
          {projectFolderOpen ? (
            <ChevronDown size={13} className="text-[#8B949E] shrink-0" />
          ) : (
            <ChevronRight size={13} className="text-[#8B949E] shrink-0" />
          )}
          <span className="truncate">{projectName}</span>
        </div>
        {isSyncing && (
          <span className="text-[10px] text-[#38BDF8] animate-pulse">Syncing...</span>
        )}
      </div>

      {/* Main File Tree Area */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-[#1E293B]">
        {isLoading ? (
          <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-[#8B949E]">
            <RefreshCw size={18} className="animate-spin text-[#38BDF8]" />
            <span className="text-xs">Loading project files...</span>
          </div>
        ) : loadError ? (
          <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-[#F87171]">
            <span className="text-xs font-semibold">Failed to load project files</span>
            <span className="text-[11px] text-[#94A3B8] leading-tight">{loadError}</span>
            {onSyncRepo && (
              <button
                onClick={onSyncRepo}
                className="mt-2 px-2.5 py-1 text-xs bg-[#151E2D] hover:bg-[#1E293B] text-[#38BDF8] rounded border border-[#3794FF]/30 transition-colors"
              >
                Retry GitHub Load
              </button>
            )}
          </div>
        ) : itemsToRender.length === 0 ? (
          <div className="p-4 flex flex-col items-center justify-center text-center gap-2 text-[#8B949E]">
            <span className="text-xs">No repository files found.</span>
            {onSyncRepo && (
              <button
                onClick={onSyncRepo}
                className="mt-1 px-2.5 py-1 text-xs bg-[#151E2D] hover:bg-[#1E293B] text-[#38BDF8] rounded border border-[#3794FF]/30 transition-colors"
              >
                Sync from GitHub
              </button>
            )}
          </div>
        ) : projectFolderOpen ? (
          <div className="flex flex-col">
            {itemsToRender.map((item) => (
              <TreeNode
                key={item.path}
                item={item}
                onSelectFile={onSelectFile}
                activeTabPath={activeTabPath}
                onDelete={onDeleteFile}
                modifiedFiles={modifiedFiles}
                depth={0}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Bottom Collapsible Sections: OUTLINE & TIMELINE */}
      <div className="border-t border-[#1E293B] shrink-0">
        {/* OUTLINE */}
        <div
          onClick={() => setOutlineOpen(!outlineOpen)}
          className="h-6 px-2 flex items-center gap-1 text-[11px] font-bold text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D] cursor-pointer transition-colors border-b border-[#172033]"
        >
          {outlineOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>OUTLINE</span>
        </div>
        {outlineOpen && (
          <div className="p-2 text-[11px] text-[#6E7681]">
            No symbols found in document.
          </div>
        )}

        {/* TIMELINE */}
        <div
          onClick={() => setTimelineOpen(!timelineOpen)}
          className="h-6 px-2 flex items-center gap-1 text-[11px] font-bold text-[#8B949E] hover:text-[#E6EDF3] hover:bg-[#151E2D] cursor-pointer transition-colors"
        >
          {timelineOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          <span>TIMELINE</span>
        </div>
        {timelineOpen && (
          <div className="p-2 text-[11px] text-[#6E7681]">
            No timeline information.
          </div>
        )}
      </div>
    </div>
  );
}
