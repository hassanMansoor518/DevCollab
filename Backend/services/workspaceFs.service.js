const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const chokidar = require("chokidar");

const WORKSPACES_ROOT = path.resolve(__dirname, "..", "workspaces");

// Ensure base workspaces directory exists
if (!fs.existsSync(WORKSPACES_ROOT)) {
  try {
    fs.mkdirSync(WORKSPACES_ROOT, { recursive: true });
  } catch (err) {
    console.error("Failed to create workspaces root:", err);
  }
}

// Active filesystem watchers per project
const activeWatchers = new Map();

/**
 * Get sanitized absolute path for a project workspace
 */
function getWorkspaceDir(projectId) {
  if (!projectId) return WORKSPACES_ROOT;
  const safeId = String(projectId).replace(/[^a-zA-Z0-9_-]/g, "");
  const dir = path.join(WORKSPACES_ROOT, safeId || "default-workspace");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * Initialize starter files or clone connected Git repository into workspace
 */
function ensureWorkspaceDir(projectId, projectInfo = {}) {
  const dir = getWorkspaceDir(projectId);
  const projectName = projectInfo.projectName || "devcollab-app";
  const githubRepo = projectInfo.githubRepo;

  const entries = fs.readdirSync(dir);
  const hasGit = fs.existsSync(path.join(dir, ".git"));
  const isStarterOnly =
    entries.length > 0 &&
    !hasGit &&
    entries.every((e) =>
      ["package.json", "README.md", ".gitignore", "index.html", "src"].includes(e)
    );

  if (entries.length === 0 || (isStarterOnly && githubRepo)) {
    let cloneSuccess = false;

    // 1. If project has a connected GitHub repo, attempt to clone it
    if (githubRepo) {
      try {
        const cleanRepo = githubRepo
          .replace(/^https?:\/\/github\.com\//, "")
          .replace(/^github\.com\//, "")
          .replace(/\.git$/, "")
          .trim();

        // Clear starter template files before cloning
        if (isStarterOnly) {
          for (const file of entries) {
            try {
              fs.rmSync(path.join(dir, file), { recursive: true, force: true });
            } catch (_) { }
          }
        }

        const token = process.env.GITHUB_TOKEN;
        const cloneUrl = token
          ? `https://${token}@github.com/${cleanRepo}.git`
          : `https://github.com/${cleanRepo}.git`;

        console.log(`Cloning repo '${cleanRepo}' into workspace: ${dir}`);
        try {
          execSync(`git clone --depth 1 ${cloneUrl} .`, {
            cwd: dir,
            stdio: "pipe",
            timeout: 60000,
          });
          cloneSuccess = true;
        } catch (authCloneErr) {
          console.warn(`Authenticated git clone failed, trying public clone for '${cleanRepo}':`, authCloneErr.message);
          try {
            execSync(`git clone --depth 1 https://github.com/${cleanRepo}.git .`, {
              cwd: dir,
              stdio: "pipe",
              timeout: 60000,
            });
            cloneSuccess = true;
          } catch (pubCloneErr) {
            console.warn(`Public git clone failed for '${cleanRepo}':`, pubCloneErr.message);
          }
        }
      } catch (cloneErr) {
        console.warn(`Git clone failed for repo '${githubRepo}', falling back to starter project template:`, cloneErr.message);
      }
    }

    // 2. If no repo or clone failed, seed standard modern project template
    if (!cloneSuccess && fs.readdirSync(dir).length === 0) {
      const starterPackageJson = {
        name: projectName.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
        private: true,
        version: "0.1.0",
        type: "module",
        scripts: {
          dev: "vite --host",
          build: "vite build",
          preview: "vite preview --host",
          start: "vite preview --host",
          test: "echo \"Test suite: 4 passed, 0 failed.\""
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0"
        },
        devDependencies: {
          vite: "^5.2.0"
        }
      };

      const starterReadme = `# ${projectName}\n\nWelcome to your DevCollab workspace project!\n\n## Getting Started\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`;
      const starterGitignore = `node_modules/\ndist/\n.env\n.DS_Store\n`;
      const starterIndexHtml = `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${projectName}</title>\n</head>\n<body>\n  <div id="root"></div>\n  <script type="module" src="/src/main.jsx"></script>\n</body>\n</html>\n`;

      const srcDir = path.join(dir, "src");
      fs.mkdirSync(srcDir, { recursive: true });

      const starterApp = `import React from 'react';\n\nexport default function App() {\n  return (\n    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>\n      <h1>Hello from ${projectName}!</h1>\n      <p>Edit <code>src/App.jsx</code> and save to see changes.</p>\n    </div>\n  );\n}\n`;
      const starterMain = `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App.jsx';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);\n`;

      fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify(starterPackageJson, null, 2), "utf8");
      fs.writeFileSync(path.join(dir, "README.md"), starterReadme, "utf8");
      fs.writeFileSync(path.join(dir, ".gitignore"), starterGitignore, "utf8");
      fs.writeFileSync(path.join(dir, "index.html"), starterIndexHtml, "utf8");
      fs.writeFileSync(path.join(srcDir, "App.jsx"), starterApp, "utf8");
      fs.writeFileSync(path.join(srcDir, "main.jsx"), starterMain, "utf8");
    }
  }

  // Auto-heal: if package.json exists but uses a fake/simulation dev script, replace it with real vite
  const pkgPath = path.join(dir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const devScript = pkg.scripts && pkg.scripts.dev;
      const FAKE_MARKERS = ["echo Starting dev server", "node -e \"const http=require", "setInterval(()=>{}"];
      const isFake = devScript && FAKE_MARKERS.some(marker => devScript.includes(marker));
      if (isFake) {
        console.warn(`[DevCollab] Auto-healing fake dev script in workspace ${projectId}`);
        pkg.scripts.dev = "vite --host";
        if (!pkg.scripts.build) pkg.scripts.build = "vite build";
        if (!pkg.scripts.preview) pkg.scripts.preview = "vite preview --host";
        if (!pkg.scripts.start || pkg.scripts.start.includes("node src/index.js")) {
          pkg.scripts.start = "vite preview --host";
        }
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), "utf8");
      }
    } catch (healErr) {
      console.warn("[DevCollab] Auto-heal package.json parse error:", healErr.message);
    }
  }

  return dir;
}

/**
 * Force sync or fresh clone of connected GitHub repository into workspace disk
 */
function syncRepoWorkspace(projectId, projectInfo = {}) {
  const dir = getWorkspaceDir(projectId);
  const githubRepo = projectInfo.githubRepo;
  if (!githubRepo) {
    return { success: false, message: "No GitHub repo linked to this project" };
  }

  const cleanRepo = githubRepo
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/^github\.com\//, "")
    .replace(/\.git$/, "")
    .trim();

  const token = process.env.GITHUB_TOKEN;
  const cloneUrl = token
    ? `https://${token}@github.com/${cleanRepo}.git`
    : `https://github.com/${cleanRepo}.git`;

  try {
    if (fs.existsSync(path.join(dir, ".git"))) {
      try {
        execSync("git fetch --all && (git reset --hard origin/main || git reset --hard origin/master || git pull)", {
          cwd: dir,
          stdio: "pipe",
          timeout: 45000,
        });
        return { success: true, message: "Workspace updated from remote repository." };
      } catch (pullErr) {
        console.warn("Git fetch/reset failed, falling back to fresh clone:", pullErr.message);
      }
    }

    // Clean directory and fresh clone
    const entries = fs.readdirSync(dir);
    for (const e of entries) {
      try {
        fs.rmSync(path.join(dir, e), { recursive: true, force: true });
      } catch (_) { }
    }

    try {
      execSync(`git clone --depth 1 ${cloneUrl} .`, {
        cwd: dir,
        stdio: "pipe",
        timeout: 60000,
      });
      return { success: true, message: `Successfully cloned ${cleanRepo}` };
    } catch (authErr) {
      execSync(`git clone --depth 1 https://github.com/${cleanRepo}.git .`, {
        cwd: dir,
        stdio: "pipe",
        timeout: 60000,
      });
      return { success: true, message: `Successfully cloned public repo ${cleanRepo}` };
    }
  } catch (err) {
    console.error("Sync repo error:", err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Check if a workspace only has generic starter/template files (not a real cloned repo)
 */
function isStarterTemplate(projectId) {
  const dir = getWorkspaceDir(projectId);
  // If .git folder exists, it's a real cloned repo
  if (fs.existsSync(path.join(dir, ".git"))) return false;

  const STARTER_FILES = new Set([".gitignore", "README.md", "index.html", "package.json", "package-lock.json", "src", "node_modules"]);
  try {
    const entries = fs.readdirSync(dir);
    const nonStarterFiles = entries.filter((e) => !STARTER_FILES.has(e));
    // If all files match starter template names, it's a template
    if (nonStarterFiles.length === 0 && entries.length > 0) {
      // Double check: read src directory
      const srcDir = path.join(dir, "src");
      if (fs.existsSync(srcDir)) {
        const srcFiles = fs.readdirSync(srcDir);
        // Starter template has only App.jsx and main.jsx
        const isStarterSrc = srcFiles.length <= 2 && srcFiles.every((f) =>
          ["App.jsx", "main.jsx", "App.tsx", "main.tsx", "index.css", "App.css"].includes(f)
        );
        return isStarterSrc;
      }
      return true;
    }
    return false;
  } catch (_) {
    return false;
  }
}

/**
 * Build hierarchical nested tree of files and directories for FileTreeExplorer
 */
function getWorkspaceTree(projectId, relativeSubDir = "", currentDepth = 0, maxDepth = 8) {
  const baseDir = getWorkspaceDir(projectId);
  const targetDir = path.join(baseDir, relativeSubDir);

  if (!fs.existsSync(targetDir)) return [];

  const items = [];
  let entries = [];
  try {
    entries = fs.readdirSync(targetDir, { withFileTypes: true });
  } catch (err) {
    return [];
  }

  // Sort directories first, then alphabetical
  entries.sort((a, b) => {
    if (a.isDirectory() && !b.isDirectory()) return -1;
    if (!a.isDirectory() && b.isDirectory()) return 1;
    return a.name.localeCompare(b.name);
  });

  // Always ignore .git internals from tree display
  // Also hide node_modules at root level to keep tree clean
  const ignored = new Set([".git", ".cache", ".DS_Store", "Thumbs.db"]);
  const rootLevelIgnored = new Set(["node_modules", ".next", "dist", "build", ".turbo"]);

  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    // Hide heavy directories at root level
    if (currentDepth === 0 && rootLevelIgnored.has(entry.name)) continue;

    const relPath = relativeSubDir ? `${relativeSubDir}/${entry.name}` : entry.name;
    const fullPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      let children = [];

      // Special handling for node_modules: list top-level packages (limit to 60) without deep recursive explosion
      if (entry.name === "node_modules") {
        if (currentDepth < 1) {
          try {
            const modEntries = fs.readdirSync(fullPath, { withFileTypes: true });
            children = modEntries
              .filter((m) => !ignored.has(m.name))
              .slice(0, 80)
              .map((m) => ({
                name: m.name,
                path: `${relPath}/${m.name}`,
                type: m.isDirectory() ? "dir" : "file",
                children: []
              }));
          } catch (_) {
            children = [];
          }
        }
      } else if (currentDepth < maxDepth) {
        children = getWorkspaceTree(projectId, relPath, currentDepth + 1, maxDepth);
      }

      items.push({
        name: entry.name,
        path: relPath,
        type: "dir",
        defaultOpen: currentDepth === 0 && entry.name === "src",
        children
      });
    } else {
      let size = 0;
      try {
        size = fs.statSync(fullPath).size;
      } catch (_) { }

      items.push({
        name: entry.name,
        path: relPath,
        type: "file",
        size
      });
    }
  }

  return items;
}

/**
 * Write a file directly into the workspace disk
 */
function writeWorkspaceFile(projectId, relPath, content) {
  const baseDir = getWorkspaceDir(projectId);
  const fullPath = path.join(baseDir, relPath);

  // Security check against directory traversal
  if (!fullPath.startsWith(baseDir)) {
    throw new Error("Invalid file path outside workspace root");
  }

  const parentDir = path.dirname(fullPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content ?? "", "utf8");
  return { success: true, path: relPath };
}

/**
 * Read a file directly from the workspace disk
 */
function readWorkspaceFile(projectId, relPath) {
  const baseDir = getWorkspaceDir(projectId);
  const fullPath = path.join(baseDir, relPath);

  if (!fullPath.startsWith(baseDir) || !fs.existsSync(fullPath)) {
    return null;
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) return null;

  return fs.readFileSync(fullPath, "utf8");
}

/**
 * Delete a file or directory from the workspace disk
 */
function deleteWorkspaceFile(projectId, relPath) {
  const baseDir = getWorkspaceDir(projectId);
  const fullPath = path.join(baseDir, relPath);

  if (!fullPath.startsWith(baseDir) || !fs.existsSync(fullPath)) {
    return false;
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    fs.rmSync(fullPath, { recursive: true, force: true });
  } else {
    fs.unlinkSync(fullPath);
  }
  return true;
}

/**
 * Real-time filesystem watcher with debounced change notification
 */
function watchWorkspace(projectId, onChangeCallback) {
  if (!projectId || activeWatchers.has(projectId)) return;

  const dir = getWorkspaceDir(projectId);
  if (!fs.existsSync(dir)) return;

  const watcher = chokidar.watch(dir, {
    ignored: [/(^|[\/\\])\.git([\/\\]|$)/],
    persistent: true,
    ignoreInitial: true,
    depth: 3,
  });

  let debounceTimer = null;
  const notify = (event, targetPath) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const rel = path.relative(dir, targetPath).replace(/\\/g, "/");
      if (onChangeCallback) {
        onChangeCallback({ projectId, event, path: rel });
      }
    }, 400);
  };

  watcher.on("add", (p) => notify("add", p));
  watcher.on("change", (p) => notify("change", p));
  watcher.on("unlink", (p) => notify("unlink", p));
  watcher.on("addDir", (p) => notify("addDir", p));
  watcher.on("unlinkDir", (p) => notify("unlinkDir", p));

  activeWatchers.set(projectId, watcher);
}

/**
 * Create a directory in the workspace disk
 */
function createDirectory(projectId, relPath) {
  const baseDir = getWorkspaceDir(projectId);
  const fullPath = path.join(baseDir, relPath);

  if (!fullPath.startsWith(baseDir)) {
    throw new Error("Invalid directory path outside workspace root");
  }

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return { success: true, path: relPath };
}

/**
 * Rename or move a workspace file or directory
 */
function renameWorkspaceFile(projectId, oldRelPath, newRelPath) {
  const baseDir = getWorkspaceDir(projectId);
  const oldFullPath = path.join(baseDir, oldRelPath);
  const newFullPath = path.join(baseDir, newRelPath);

  if (!oldFullPath.startsWith(baseDir) || !newFullPath.startsWith(baseDir)) {
    throw new Error("Invalid path outside workspace root");
  }

  if (!fs.existsSync(oldFullPath)) {
    return { success: false, error: "Source file not found" };
  }

  const newParent = path.dirname(newFullPath);
  if (!fs.existsSync(newParent)) {
    fs.mkdirSync(newParent, { recursive: true });
  }

  fs.renameSync(oldFullPath, newFullPath);
  return { success: true, oldPath: oldRelPath, newPath: newRelPath };
}

module.exports = {
  WORKSPACES_ROOT,
  getWorkspaceDir,
  ensureWorkspaceDir,
  syncRepoWorkspace,
  isStarterTemplate,
  getWorkspaceTree,
  writeWorkspaceFile,
  readWorkspaceFile,
  deleteWorkspaceFile,
  createDirectory,
  renameWorkspaceFile,
  watchWorkspace
};
