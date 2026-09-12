const http = require("http");
const EventEmitter = require("events");

class DevServerManager extends EventEmitter {
  constructor() {
    super();
    /**
     * Active dev servers Map: projectId -> Map of port -> ServerInfo
     * ServerInfo: {
     *   projectId: string,
     *   port: number,
     *   host: string,
     *   status: 'starting' | 'running' | 'stopped' | 'failed',
     *   framework: string,
     *   url: string,
     *   proxyUrl: string,
     *   detectedAt: Date,
     *   lastHealthCheck: Date,
     *   healthOk: boolean
     * }
     */
    this.servers = new Map();
    this.socketServer = null;
  }

  setSocketServer(io) {
    this.socketServer = io;
  }

  /**
   * Broadcast dev server status change to all connected clients
   */
  broadcastStatus(projectId, serverInfo) {
    if (this.socketServer) {
      this.socketServer.emit("workspace:dev-server-status", {
        projectId,
        server: serverInfo,
        activeServers: this.getServersForProject(projectId)
      });
    }
    this.emit("status-change", { projectId, server: serverInfo });
  }

  /**
   * Parse output chunk from terminal PTY to detect dev server startup
   */
  parseOutput(projectId, data) {
    if (!projectId || !data || typeof data !== "string") return;

    // Common dev server regex patterns
    // 1. Vite: "Local:   http://localhost:5173/" or "http://127.0.0.1:5173/" or "➜  Local:   http://localhost:5173/"
    // 2. Next.js: "Ready in 1200ms" / "started server on 0.0.0.0:3000, url: http://localhost:3000"
    // 3. Create React App / Webpack: "Compiled successfully" / "Local:            http://localhost:3000"
    // 4. Express / Node / Generic: "Server running on port 4000" / "Listening on http://localhost:8080"

    const portPatterns = [
      /https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0):(\d+)/i,
      /(?:running on|listening on|port|ready on|server on|started on)\s+(?:port\s+)?(?:https?:\/\/[a-z0-9.-]+:)?(\d+)/i,
      /Local:\s+http:\/\/[a-z0-9.-]+:(\d+)/i,
      /Network:\s+http:\/\/[a-z0-9.-]+:(\d+)/i,
    ];

    let detectedPort = null;
    for (const pattern of portPatterns) {
      const match = data.match(pattern);
      if (match && match[1]) {
        const p = parseInt(match[1], 10);
        // Exclude system backend ports (e.g. 5000, 4002 if matching backend itself) unless running in workspace
        if (p > 1024 && p < 65535) {
          detectedPort = p;
          break;
        }
      }
    }

    if (detectedPort) {
      let framework = "node";
      const lower = data.toLowerCase();
      if (lower.includes("vite")) framework = "vite";
      else if (lower.includes("next")) framework = "nextjs";
      else if (lower.includes("react-scripts") || lower.includes("compiled successfully")) framework = "react";
      else if (lower.includes("express")) framework = "express";
      else if (lower.includes("astro")) framework = "astro";
      else if (lower.includes("nuxt") || lower.includes("vue")) framework = "vue";
      else if (lower.includes("angular")) framework = "angular";

      this.registerServer(projectId, detectedPort, framework);
    }
  }

  /**
   * Register a new or updated dev server
   */
  async registerServer(projectId, port, framework = "vite") {
    if (!this.servers.has(projectId)) {
      this.servers.set(projectId, new Map());
    }

    const projectServers = this.servers.get(projectId);
    const existing = projectServers.get(port);

    const serverInfo = existing || {
      projectId,
      port,
      host: "0.0.0.0",
      status: "starting",
      framework,
      url: `http://127.0.0.1:${port}`,
      proxyUrl: `/api/project/${projectId}/preview/${port}/`,
      proxyPath: `/api/project/${projectId}/preview/${port}/`,
      detectedAt: new Date(),
      lastHealthCheck: null,
      healthOk: false
    };

    console.log(`[DevServer]
workspaceId=${projectId}
host=${serverInfo.host}
port=${port}
framework=${framework}
status=${serverInfo.status}`);

    projectServers.set(port, serverInfo);
    this.broadcastStatus(projectId, serverInfo);

    // Run health check with retries
    this.checkHealth(projectId, port);
  }

  /**
   * Perform HTTP health check against local dev server
   */
  checkHealth(projectId, port, attempts = 5) {
    const projectServers = this.servers.get(projectId);
    if (!projectServers || !projectServers.has(port)) return;

    const serverInfo = projectServers.get(port);

    console.log(`[HealthCheck] target=http://127.0.0.1:${port} status=checking attemptsLeft=${attempts}`);

    const req = http.get(`http://127.0.0.1:${port}`, { timeout: 1500 }, (res) => {
      serverInfo.status = "running";
      serverInfo.healthOk = true;
      serverInfo.lastHealthCheck = new Date();

      console.log(`[HealthCheck]
target=http://127.0.0.1:${port}
statusCode=${res.statusCode}
response=OK (dev server reachable)`);

      console.log(`[Preview]
target=http://127.0.0.1:${port}
proxyUrl=/api/project/${projectId}/preview/${port}/
status=RUNNING`);

      this.broadcastStatus(projectId, serverInfo);
    });

    req.on("error", (err) => {
      console.log(`[HealthCheck] target=http://127.0.0.1:${port} waiting for server: ${err.message}`);
      if (attempts > 1 && serverInfo.status !== "stopped") {
        setTimeout(() => this.checkHealth(projectId, port, attempts - 1), 1000);
      } else if (serverInfo.status !== "stopped") {
        serverInfo.status = "starting";
        this.broadcastStatus(projectId, serverInfo);
      }
    });

    req.on("timeout", () => {
      req.destroy();
      console.log(`[HealthCheck] target=http://127.0.0.1:${port} timed out`);
      if (attempts > 1 && serverInfo.status !== "stopped") {
        setTimeout(() => this.checkHealth(projectId, port, attempts - 1), 1000);
      }
    });
  }

  /**
   * Unregister / stop dev server (e.g. on Ctrl+C or session kill)
   */
  unregisterServer(projectId, port) {
    const projectServers = this.servers.get(projectId);
    if (!projectServers) return;

    if (port) {
      const serverInfo = projectServers.get(port);
      if (serverInfo) {
        serverInfo.status = "stopped";
        serverInfo.healthOk = false;
        console.log(`[DevServer] workspaceId=${projectId} port=${port} STOPPED`);
        this.broadcastStatus(projectId, serverInfo);
        projectServers.delete(port);
      }
    } else {
      // Unregister all for project
      for (const [p, serverInfo] of projectServers.entries()) {
        serverInfo.status = "stopped";
        serverInfo.healthOk = false;
        console.log(`[DevServer] workspaceId=${projectId} port=${p} STOPPED`);
        this.broadcastStatus(projectId, serverInfo);
      }
      projectServers.clear();
    }
  }

  /**
   * Get active dev servers for project
   */
  getServersForProject(projectId) {
    const projectServers = this.servers.get(projectId);
    if (!projectServers) return [];
    return Array.from(projectServers.values());
  }
}

const devServerManager = new DevServerManager();
module.exports = devServerManager;
