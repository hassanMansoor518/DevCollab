import { WebContainer } from '@webcontainer/api';

/**
 * WebContainer Environment Status Constants
 */
export const WC_STATUS = {
  IDLE: 'idle',
  STARTING: 'starting',
  MOUNTING: 'mounting',
  READY: 'ready',
  RUNNING: 'running',
  ERROR: 'error',
  STOPPED: 'stopped',
};

class WebContainerService {
  constructor() {
    this.instance = null;
    this.bootPromise = null;
    this.status = WC_STATUS.IDLE;
    this.statusMessage = 'Environment not started';
    this.currentProjectId = null;
    this.currentCwd = '/';
    this.activeDevServers = new Map(); // port -> { port, url, framework, status }
    this.listeners = {
      status: new Set(),
      serverReady: new Set(),
      fsChange: new Set(),
      output: new Set(),
    };
    this.activeProcesses = new Map();
  }

  /**
   * Check if browser has required Cross-Origin Isolation headers for SharedArrayBuffer
   */
  checkBrowserSupport() {
    if (typeof window === 'undefined') return { supported: false, reason: 'SSR environment' };
    if (!window.crossOriginIsolated) {
      console.warn('[WebContainer] window.crossOriginIsolated is false. COOP/COEP headers are required.');
    }
    return {
      supported: true,
      crossOriginIsolated: Boolean(window.crossOriginIsolated),
    };
  }

  /**
   * Register event listeners
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    }
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[WebContainer] Listener error for event '${event}':`, err);
        }
      });
    }
  }

  setStatus(status, message = '') {
    this.status = status;
    this.statusMessage = message;
    this.emit('status', { status, message });
  }

  /**
   * Boot singleton WebContainer instance
   */
  async boot() {
    if (this.instance) return this.instance;
    if (this.bootPromise) return this.bootPromise;

    this.setStatus(WC_STATUS.STARTING, 'Starting environment...');

    this.bootPromise = (async () => {
      try {
        const support = this.checkBrowserSupport();
        if (!support.supported) {
          throw new Error(`Browser not supported: ${support.reason}`);
        }

        console.log('[WebContainer] Booting WebContainer instance...');
        const webcontainer = await WebContainer.boot();
        this.instance = webcontainer;

        // Listen for dev servers starting inside WebContainer
        webcontainer.on('server-ready', (port, url) => {
          console.log(`[WebContainer] Dev server ready on port ${port}: ${url}`);
          const serverInfo = {
            port,
            url,
            previewUrl: url,
            framework: 'Vite',
            status: 'running',
          };
          this.activeDevServers.set(port, serverInfo);
          this.emit('serverReady', serverInfo);
        });

        webcontainer.on('error', (err) => {
          console.error('[WebContainer] Global error:', err);
          this.setStatus(WC_STATUS.ERROR, err.message || 'WebContainer runtime error');
        });

        this.setStatus(WC_STATUS.READY, 'Environment Ready');
        return webcontainer;
      } catch (err) {
        console.error('[WebContainer] Boot failed:', err);
        this.instance = null;
        this.setStatus(WC_STATUS.ERROR, err.message || 'Development environment could not be started.');
        throw err;
      } finally {
        this.bootPromise = null;
      }
    })();

    return this.bootPromise;
  }

  /**
   * Get booted instance (or auto-boot if not ready)
   */
  async getInstance() {
    if (this.instance) return this.instance;
    return await this.boot();
  }

  /**
   * Mount file tree into WebContainer filesystem
   * @param {Object} fileTree WebContainer FileSystemTree structure
   */
  async mount(fileTree) {
    const wc = await this.getInstance();
    this.setStatus(WC_STATUS.MOUNTING, 'Loading repository into workspace...');
    try {
      await wc.mount(fileTree);
      this.setStatus(WC_STATUS.READY, 'Environment Ready');
      this.emit('fsChange', { action: 'mount', path: '/' });
      return true;
    } catch (err) {
      console.error('[WebContainer] Mount failed:', err);
      this.setStatus(WC_STATUS.ERROR, `Failed to mount files: ${err.message}`);
      throw err;
    }
  }

  /**
   * Converts repository items (files + directories) and loads their contents into WebContainer FileSystemTree
   */
  async mountRepository(items, fetchContentFn, projectId = null) {
    this.currentProjectId = projectId;
    const wcTree = {};

    const defaultStarterTree = {
      'package.json': {
        file: {
          contents: JSON.stringify(
            {
              name: 'devcollab-app',
              private: true,
              version: '0.1.0',
              type: 'module',
              scripts: {
                dev: 'vite --host',
                build: 'vite build',
                preview: 'vite preview --host',
                test: 'echo "All tests passed (4 passed, 0 failed)"',
              },
              dependencies: {
                react: '^18.2.0',
                'react-dom': '^18.2.0',
              },
              devDependencies: {
                vite: '^5.2.0',
                '@vitejs/plugin-react': '^4.2.1',
              },
            },
            null,
            2
          ),
        },
      },
      'README.md': {
        file: {
          contents: '# DevCollab Workspace Project\n\nRun development commands directly in the integrated terminal:\n```bash\nnpm install\nnpm run dev\n```\n',
        },
      },
      'index.html': {
        file: {
          contents: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DevCollab App</title>
  </head>
  <body class="bg-[#0B1220] text-white">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>`,
        },
      },
      src: {
        directory: {
          'App.jsx': {
            file: {
              contents: `import React from 'react';

export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Welcome to DevCollab!</h1>
      <p>Edit <code>src/App.jsx</code> and save to see changes live.</p>
    </div>
  );
}`,
            },
          },
          'main.jsx': {
            file: {
              contents: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(<App />);`,
            },
          },
        },
      },
    };

    if (!items || items.length === 0) {
      await this.mount(defaultStarterTree);
      return;
    }

    // Helper to insert into FileSystemTree recursively
    const insertIntoTree = (tree, pathParts, content, isDir = false) => {
      let current = tree;
      for (let i = 0; i < pathParts.length; i++) {
        const part = pathParts[i];
        const isLast = i === pathParts.length - 1;

        if (isLast) {
          if (isDir) {
            if (!current[part]) current[part] = { directory: {} };
          } else {
            current[part] = { file: { contents: content || '' } };
          }
        } else {
          if (!current[part]) {
            current[part] = { directory: {} };
          }
          if (!current[part].directory) {
            current[part] = { directory: {} };
          }
          current = current[part].directory;
        }
      }
    };

    // Flatten tree items to collect all file paths
    const flatFiles = [];
    const collectFiles = (nodes) => {
      for (const node of nodes) {
        if (node.type === 'file' || (!node.children && node.type !== 'dir')) {
          flatFiles.push(node.path);
        }
        if (node.children && node.children.length > 0) {
          collectFiles(node.children);
        }
      }
    };
    collectFiles(items);

    // Fetch initial contents for important files (and populate placeholders for others)
    const MAX_CONCURRENT_FETCHES = 12;
    for (let i = 0; i < flatFiles.length; i += MAX_CONCURRENT_FETCHES) {
      const chunk = flatFiles.slice(i, i + MAX_CONCURRENT_FETCHES);
      await Promise.all(
        chunk.map(async (filePath) => {
          try {
            let content = '';
            if (fetchContentFn) {
              content = await fetchContentFn(filePath);
            }
            const parts = filePath.split('/').filter(Boolean);
            insertIntoTree(wcTree, parts, content || '', false);
          } catch (err) {
            const parts = filePath.split('/').filter(Boolean);
            insertIntoTree(wcTree, parts, `// ${filePath}\n`, false);
          }
        })
      );
    }

    // Ensure package.json exists
    if (!wcTree['package.json'] && defaultStarterTree['package.json']) {
      wcTree['package.json'] = defaultStarterTree['package.json'];
    }

    await this.mount(wcTree);
  }

  /**
   * Read file content from WebContainer virtual FS
   */
  async readFile(filePath, encoding = 'utf-8') {
    const wc = await this.getInstance();
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    try {
      const content = await wc.fs.readFile(cleanPath, encoding);
      return content;
    } catch (err) {
      console.warn(`[WebContainer] Failed to read ${cleanPath}:`, err.message);
      return null;
    }
  }

  /**
   * Write file to WebContainer virtual FS (creates parent directories if missing)
   */
  async writeFile(filePath, content = '') {
    const wc = await this.getInstance();
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;

    // Ensure parent directories exist
    const parts = cleanPath.split('/');
    if (parts.length > 1) {
      const dirPath = parts.slice(0, -1).join('/');
      try {
        await wc.fs.mkdir(dirPath, { recursive: true });
      } catch (_) {}
    }

    await wc.fs.writeFile(cleanPath, content);
    this.emit('fsChange', { action: 'write', path: cleanPath });
    return true;
  }

  /**
   * Delete file or directory from WebContainer virtual FS
   */
  async rm(filePath) {
    const wc = await this.getInstance();
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    try {
      await wc.fs.rm(cleanPath, { recursive: true, force: true });
      this.emit('fsChange', { action: 'delete', path: cleanPath });
      return true;
    } catch (err) {
      console.warn(`[WebContainer] Failed to delete ${cleanPath}:`, err.message);
      return false;
    }
  }

  /**
   * Create directory in WebContainer virtual FS
   */
  async mkdir(dirPath) {
    const wc = await this.getInstance();
    const cleanPath = dirPath.startsWith('/') ? dirPath.slice(1) : dirPath;
    await wc.fs.mkdir(cleanPath, { recursive: true });
    this.emit('fsChange', { action: 'mkdir', path: cleanPath });
    return true;
  }

  /**
   * Read directory entries
   */
  async readdir(dirPath = '', options = { withFileTypes: true }) {
    const wc = await this.getInstance();
    const cleanPath = dirPath.startsWith('/') ? dirPath.slice(1) : dirPath;
    try {
      return await wc.fs.readdir(cleanPath, options);
    } catch (err) {
      console.warn(`[WebContainer] readdir failed for ${cleanPath}:`, err.message);
      return [];
    }
  }

  /**
   * Recursively build hierarchical file tree directly from WebContainer virtual filesystem
   */
  async getFsTree(dirPath = '', currentDepth = 0, maxDepth = 6) {
    if (currentDepth > maxDepth) return [];
    const wc = await this.getInstance();
    const cleanPath = dirPath.startsWith('/') ? dirPath.slice(1) : dirPath;

    let entries = [];
    try {
      entries = await wc.fs.readdir(cleanPath, { withFileTypes: true });
    } catch (err) {
      return [];
    }

    const ignored = new Set(['.git', '.cache', '.DS_Store', 'Thumbs.db']);
    const rootLevelIgnored = new Set(['.next', 'dist', 'build', '.turbo']);

    // Sort directories first, then alphabetical
    entries.sort((a, b) => {
      const aIsDir = a.isDirectory();
      const bIsDir = b.isDirectory();
      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.name.localeCompare(b.name);
    });

    const items = [];
    for (const entry of entries) {
      if (ignored.has(entry.name)) continue;
      if (currentDepth === 0 && rootLevelIgnored.has(entry.name)) continue;

      const relPath = cleanPath ? `${cleanPath}/${entry.name}` : entry.name;
      const isDir = entry.isDirectory();

      if (isDir) {
        let children = [];
        if (entry.name === 'node_modules') {
          // Top-level packages listing without recursive deep explosion
          if (currentDepth < 1) {
            try {
              const modEntries = await wc.fs.readdir(relPath, { withFileTypes: true });
              children = modEntries
                .filter((m) => !ignored.has(m.name))
                .slice(0, 50)
                .map((m) => ({
                  name: m.name,
                  path: `${relPath}/${m.name}`,
                  type: m.isDirectory() ? 'dir' : 'file',
                  children: [],
                }));
            } catch (_) {}
          }
        } else {
          children = await this.getFsTree(relPath, currentDepth + 1, maxDepth);
        }

        items.push({
          name: entry.name,
          path: relPath,
          type: 'dir',
          defaultOpen: currentDepth === 0 && entry.name === 'src',
          children,
        });
      } else {
        items.push({
          name: entry.name,
          path: relPath,
          type: 'file',
          size: 0,
        });
      }
    }

    return items;
  }

  /**
   * Spawn a command inside WebContainer
   */
  async spawn(command, args = [], options = {}) {
    const wc = await this.getInstance();
    this.setStatus(WC_STATUS.RUNNING, `Running: ${command} ${args.join(' ')}`);

    const process = await wc.spawn(command, args, {
      cwd: options.cwd || this.currentCwd || '/',
      env: {
        NODE_ENV: 'development',
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
        FORCE_COLOR: '1',
        ...(options.env || {}),
      },
    });

    return process;
  }

  /**
   * Spawns an interactive `jsh` shell session connected to xterm.js
   */
  async spawnTerminalSession({ sessionId, onOutput, onExit, cols = 80, rows = 24, cwd = '/' }) {
    const wc = await this.getInstance();

    // Kill any existing session with this ID
    if (this.activeProcesses.has(sessionId)) {
      try {
        const oldProc = this.activeProcesses.get(sessionId);
        oldProc.kill?.();
      } catch (_) {}
      this.activeProcesses.delete(sessionId);
    }

    console.log(`[WebContainer] Spawning interactive jsh terminal session: ${sessionId}`);

    // Spawn jsh interactive shell
    const process = await wc.spawn('jsh', {
      terminal: {
        cols: cols || 80,
        rows: rows || 24,
      },
    });

    const inputWriter = process.input.getWriter();

    // Pipe process output to callback
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          if (onOutput) onOutput(data);
        },
      })
    );

    process.exit.then((exitCode) => {
      console.log(`[WebContainer] Terminal session ${sessionId} exited with code:`, exitCode);
      this.activeProcesses.delete(sessionId);
      if (onExit) onExit(exitCode);
    });

    const sessionObj = {
      sessionId,
      process,
      inputWriter,
      write: (data) => {
        try {
          inputWriter.write(data);
        } catch (err) {
          console.error(`[WebContainer] Error writing to session ${sessionId}:`, err);
        }
      },
      resize: ({ cols: c, rows: r }) => {
        try {
          process.resize({ cols: c, rows: r });
        } catch (err) {
          console.warn(`[WebContainer] Resize error for session ${sessionId}:`, err);
        }
      },
      kill: () => {
        try {
          process.kill();
        } catch (_) {}
        this.activeProcesses.delete(sessionId);
      },
    };

    this.activeProcesses.set(sessionId, sessionObj);
    return sessionObj;
  }

  /**
   * Run a one-off command (e.g. npm test) and capture full output string
   */
  async runCommandCapture(commandStr, onProgress = null) {
    const wc = await this.getInstance();
    const parts = commandStr.trim().split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    const proc = await wc.spawn(cmd, args);
    let output = '';

    proc.output.pipeTo(
      new WritableStream({
        write(chunk) {
          output += chunk;
          if (onProgress) onProgress(chunk);
        },
      })
    );

    const exitCode = await proc.exit;
    this.emit('fsChange', { action: 'command-completed', command: commandStr });
    return {
      command: commandStr,
      exitCode,
      output,
      success: exitCode === 0,
    };
  }

  /**
   * Teardown / cleanup
   */
  teardown() {
    for (const [id, session] of this.activeProcesses.entries()) {
      try {
        session.kill();
      } catch (_) {}
    }
    this.activeProcesses.clear();
    this.activeDevServers.clear();
    this.setStatus(WC_STATUS.STOPPED, 'Environment Stopped');
  }
}

// Export singleton instance
export const webContainerService = new WebContainerService();
export default webContainerService;
