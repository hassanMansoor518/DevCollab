const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { getWorkspaceDir, ensureWorkspaceDir } = require("./workspaceFs.service");
const devServerManager = require("./DevServerManager");

let pty = null;
try {
  pty = require("node-pty");
} catch (err) {
  console.warn("⚠️ node-pty not available, falling back to standard child_process pty emulation:", err.message);
}

class TerminalManager {
  constructor() {
    /**
     * Map of active sessions: sessionId -> SessionObject
     * SessionObject: {
     *   id: string,
     *   projectId: string,
     *   userId: string,
     *   socket: Socket,
     *   socketId: string,
     *   proc: pty.IPty | ChildProcess,
     *   isPty: boolean,
     *   shell: string,
     *   cwd: string,
     *   cols: number,
     *   rows: number,
     *   status: 'running' | 'exited',
     *   createdAt: Date
     * }
     */
    this.sessions = new Map();
  }

  /**
   * Determine the appropriate shell path and arguments based on OS and requested shell type
   */
  resolveShell(shellType) {
    const isWindows = os.platform() === "win32";

    if (isWindows) {
      if (shellType === "cmd") {
        return { shell: "cmd.exe", args: [] };
      }
      if (shellType === "bash" || shellType === "git-bash") {
        const gitBashPaths = [
          "C:\\Program Files\\Git\\bin\\bash.exe",
          "C:\\Program Files (x86)\\Git\\bin\\bash.exe",
          path.join(process.env.LOCALAPPDATA || "", "Programs\\Git\\bin\\bash.exe")
        ];
        for (const p of gitBashPaths) {
          if (require("fs").existsSync(p)) return { shell: p, args: ["--login", "-i"] };
        }
      }
      // Default to PowerShell on Windows with interactive mode
      return { shell: "powershell.exe", args: ["-NoLogo"] };
    }

    // Unix (macOS / Linux)
    const defaultShell = process.env.SHELL || "/bin/bash";
    if (shellType === "zsh" && require("fs").existsSync("/bin/zsh")) {
      return { shell: "/bin/zsh", args: ["-l"] };
    }
    if (shellType === "sh" && require("fs").existsSync("/bin/sh")) {
      return { shell: "/bin/sh", args: ["-l"] };
    }
    return { shell: defaultShell, args: ["-l"] };
  }

  /**
   * Create or re-attach to a terminal session
   */
  createSession({ sessionId, projectId, socket, shellType = "powershell", cols = 80, rows = 24, userId = null }) {
    if (!sessionId) {
      sessionId = `term_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    // 1. If an existing session is already running, re-attach socket instead of killing
    if (this.sessions.has(sessionId)) {
      const existing = this.sessions.get(sessionId);
      if (existing && existing.status === "running") {
        if (existing.disconnectTimeout) {
          clearTimeout(existing.disconnectTimeout);
          existing.disconnectTimeout = null;
        }

        console.log(`[Terminal] Re-attaching socket ${socket ? socket.id : "none"} to existing running session ${sessionId} (pid=${existing.proc?.pid})`);
        existing.socket = socket;
        existing.socketId = socket ? socket.id : null;

        if (cols && rows) {
          this.resize(sessionId, cols, rows);
        }

        if (socket && socket.connected) {
          socket.emit("terminal:ready", {
            sessionId,
            shell: existing.shell,
            cwd: existing.cwd,
            isPty: existing.isPty
          });

          // Replay scrollback buffer so terminal screen is restored
          if (existing.scrollback && existing.scrollback.length > 0) {
            socket.emit("terminal:output", {
              sessionId,
              data: existing.scrollback
            });
          }
        }

        return existing;
      }

      // If existing was exited, clean it up before creating new one
      this.kill(sessionId);
    }

    // Ensure real workspace directory exists for this project
    const workDir = projectId ? ensureWorkspaceDir(projectId) : os.homedir();
    const { shell, args } = this.resolveShell(shellType);
    const isWindows = os.platform() === "win32";

    console.log(`[Terminal] session created sessionId=${sessionId} projectId=${projectId || "(none)"}`);
    console.log(`[Terminal] workspace: ${projectId || "(none)"}`);
    console.log(`[Terminal] cwd: ${workDir}`);
    console.log(`[Terminal] shell: ${shell} ${args.join(" ")}`);

    const env = {
      ...process.env,
      TERM: "xterm-256color",
      COLORTERM: "truecolor",
      FORCE_COLOR: "1",
      DEVCOLLAB_PROJECT_ID: projectId || "",
      DEVCOLLAB_WORKSPACE_DIR: workDir
    };

    let proc = null;
    let isPty = false;

    // Try node-pty first for full PTY support
    if (pty) {
      try {
        const ptyOptions = {
          name: "xterm-256color",
          cols: cols || 80,
          rows: rows || 24,
          cwd: workDir,
          env,
          ...(isWindows ? { useConpty: false } : {})
        };
        proc = pty.spawn(shell, args, ptyOptions);
        isPty = true;
        console.log(`[Terminal] pid: ${proc.pid} (node-pty)`);
      } catch (err) {
        console.warn("⚠️ Failed to spawn with node-pty, falling back to child_process:", err.message);
      }
    }

    // Fallback to child_process.spawn
    if (!proc) {
      try {
        proc = spawn(shell, args, {
          cwd: workDir,
          env,
          stdio: ["pipe", "pipe", "pipe"]
        });
        isPty = false;
        console.log(`[Terminal] pid: ${proc.pid} (child_process)`);
      } catch (err) {
        console.error("❌ Failed to spawn shell:", err);
        if (socket && socket.connected) {
          socket.emit("terminal:output", {
            sessionId,
            data: `\r\n\x1b[31m[Process Error: Failed to spawn shell '${shell}': ${err.message}]\x1b[0m\r\n`
          });
        }
        return null;
      }
    }

    const sessionObj = {
      id: sessionId,
      projectId,
      userId,
      socket,
      socketId: socket ? socket.id : null,
      proc,
      isPty,
      shell: path.basename(shell),
      cwd: workDir,
      cols: cols || 80,
      rows: rows || 24,
      status: "running",
      scrollback: "",
      disconnectTimeout: null,
      createdAt: new Date()
    };

    this.sessions.set(sessionId, sessionObj);

    const appendScrollback = (data) => {
      sessionObj.scrollback += data;
      // Keep last 100KB of scrollback
      if (sessionObj.scrollback.length > 100000) {
        sessionObj.scrollback = sessionObj.scrollback.slice(-100000);
      }
    };

    // Attach output streams
    if (isPty) {
      proc.onData((data) => {
        appendScrollback(data);
        if (projectId) {
          devServerManager.parseOutput(projectId, data);
        }
        if (sessionObj.socket && sessionObj.socket.connected) {
          sessionObj.socket.emit("terminal:output", { sessionId, data });
        }
      });

      proc.onExit(({ exitCode, signal }) => {
        console.log(`[Terminal] exit: sessionId=${sessionId} exitCode=${exitCode} signal=${signal || "none"}`);
        sessionObj.status = "exited";
        if (projectId) {
          devServerManager.unregisterServer(projectId);
        }
        if (sessionObj.socket && sessionObj.socket.connected) {
          sessionObj.socket.emit("terminal:exit", { sessionId, exitCode, signal });
        }
        this.sessions.delete(sessionId);
      });
    } else {
      // Child process stdio listeners
      proc.stdout.on("data", (chunk) => {
        const text = chunk.toString("utf8");
        appendScrollback(text);
        if (projectId) {
          devServerManager.parseOutput(projectId, text);
        }
        if (sessionObj.socket && sessionObj.socket.connected) {
          sessionObj.socket.emit("terminal:output", { sessionId, data: text });
        }
      });

      proc.stderr.on("data", (chunk) => {
        const text = chunk.toString("utf8");
        appendScrollback(text);
        if (projectId) {
          devServerManager.parseOutput(projectId, text);
        }
        if (sessionObj.socket && sessionObj.socket.connected) {
          sessionObj.socket.emit("terminal:output", { sessionId, data: text });
        }
      });

      proc.on("exit", (exitCode, signal) => {
        console.log(`[Terminal] exit: sessionId=${sessionId} exitCode=${exitCode} signal=${signal || "none"}`);
        sessionObj.status = "exited";
        if (projectId) {
          devServerManager.unregisterServer(projectId);
        }
        if (sessionObj.socket && sessionObj.socket.connected) {
          sessionObj.socket.emit("terminal:exit", { sessionId, exitCode, signal });
        }
        this.sessions.delete(sessionId);
      });

      proc.on("error", (err) => {
        console.error(`[Terminal] error: sessionId=${sessionId}`, err.message);
        if (sessionObj.socket && sessionObj.socket.connected) {
          sessionObj.socket.emit("terminal:output", {
            sessionId,
            data: `\r\n\x1b[31m[Process Error: ${err.message}]\x1b[0m\r\n`
          });
        }
      });
    }

    // Send ready confirmation
    if (socket && socket.connected) {
      socket.emit("terminal:ready", {
        sessionId,
        shell: path.basename(shell),
        cwd: workDir,
        isPty
      });
    }

    return sessionObj;
  }

  /**
   * Write input data directly to terminal PTY
   */
  write(sessionId, data) {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "running") return;

    // If user sent Ctrl+C (\x03), check if dev server was active and notify
    if (data === "\x03" || data === "\u0003") {
      if (session.projectId) {
        devServerManager.unregisterServer(session.projectId);
      }
    }

    try {
      if (session.isPty) {
        session.proc.write(data);
      } else if (session.proc.stdin && !session.proc.stdin.destroyed) {
        session.proc.stdin.write(data);
      }
    } catch (err) {
      console.error(`Error writing to terminal session ${sessionId}:`, err.message);
    }
  }

  /**
   * Resize the terminal window
   */
  resize(sessionId, cols, rows) {
    const session = this.sessions.get(sessionId);
    if (!session || session.status !== "running") return;

    session.cols = cols;
    session.rows = rows;

    if (session.isPty && typeof session.proc.resize === "function") {
      try {
        session.proc.resize(Math.max(cols, 10), Math.max(rows, 4));
      } catch (err) {
        console.warn(`Error resizing terminal session ${sessionId}:`, err.message);
      }
    }
  }

  /**
   * Kill an active terminal session
   */
  kill(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.disconnectTimeout) {
      clearTimeout(session.disconnectTimeout);
      session.disconnectTimeout = null;
    }

    try {
      if (session.isPty) {
        session.proc.kill();
      } else if (session.proc) {
        if (os.platform() === "win32") {
          spawn("taskkill", ["/pid", session.proc.pid, "/f", "/t"]);
        } else {
          session.proc.kill("SIGTERM");
        }
      }
    } catch (err) {
      console.warn(`Failed to cleanly kill session ${sessionId}:`, err.message);
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Restart a terminal session
   */
  restart(sessionId, socket) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const { projectId, shell, cols, rows, userId } = session;
    this.kill(sessionId);

    return this.createSession({
      sessionId,
      projectId,
      socket: socket || session.socket,
      shellType: shell,
      cols,
      rows,
      userId
    });
  }

  /**
   * Clean up disconnected socket with a grace period
   */
  cleanupSocket(socketId) {
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.socketId === socketId) {
        session.socket = null;
        session.socketId = null;

        // Give 5-minute grace period before terminating abandoned sessions
        if (!session.disconnectTimeout) {
          session.disconnectTimeout = setTimeout(() => {
            if (!session.socketId) {
              console.log(`[Terminal] Session ${sessionId} timed out after disconnect, terminating`);
              this.kill(sessionId);
            }
          }, 5 * 60 * 1000);
        }
      }
    }
  }

  /**
   * List sessions for a project
   */
  listSessions(projectId) {
    const list = [];
    for (const [sessionId, session] of this.sessions.entries()) {
      if (!projectId || session.projectId === projectId) {
        list.push({
          sessionId,
          projectId: session.projectId,
          shell: session.shell,
          cwd: session.cwd,
          status: session.status,
          createdAt: session.createdAt
        });
      }
    }
    return list;
  }
}

// Export singleton instance
const terminalManager = new TerminalManager();
module.exports = terminalManager;
