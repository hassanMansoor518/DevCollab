const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model.js");
const { spawn } = require("child_process");
const os = require("os");
const path = require("path");

const terminalManager = require("../services/TerminalManager");
const workspaceFs = require("../services/workspaceFs.service");
const devServerManager = require("../services/DevServerManager");
const previewProxy = require("../routes/previewProxy");

const app = express();
const server = http.createServer(app);

// ─── WebSocket Upgrade Handling for Dev Server Preview (HMR / WebSockets) ─────
server.on("upgrade", (req, socket, head) => {
  // If it's socket.io, let Socket.IO handle it
  if (req.url && req.url.startsWith("/socket.io")) {
    return;
  }

  // Handle preview proxy WebSocket upgrades
  const previewMatch = req.url.match(/^(?:\/api\/project\/([^/]+)\/preview|\/preview\/([^/]+))\/(\d+)/);
  if (previewMatch) {
    const projectId = previewMatch[1] || previewMatch[2];
    const port = parseInt(previewMatch[3], 10);
    if (!isNaN(port) && port > 0 && port < 65535) {
      console.log(`[Preview WS] Upgrading WebSocket connection for project ${projectId} on port ${port} (URL: ${req.url})`);
      const proxy = previewProxy.getProxyForProjectAndPort(projectId, port);
      if (proxy && typeof proxy.upgrade === "function") {
        proxy.upgrade(req, socket, head);
      }
    }
  }
});

const parseAllowedSocketOrigins = () => {
  const envOrigins = [
    process.env.ALLOWED_ORIGIN,
    process.env.ALLOWED_ORIGINS,
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
  ]
    .filter(Boolean)
    .flatMap((item) => item.split(",").map((s) => s.trim().replace(/\/+$/, "")));

  return [
    ...envOrigins,
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:4002",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4002",
    "https://dev-collab-neon.vercel.app",
    "https://dev-collab-git-main-hassanmansoor518-gmailcoms-projects.vercel.app",
    "https://dev-collab-r4a2jc21m-hassanmansoor518-gmailcoms-projects.vercel.app",
    "https://dev-collab-quzpx6aqi-hassanmansoor518-gmailcoms-projects.vercel.app",
  ];
};

const isAllowedSocketOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  const allowed = parseAllowedSocketOrigins();
  if (allowed.includes(cleanOrigin)) return true;
  if (/^https:\/\/dev-collab.*\.vercel\.app$/i.test(cleanOrigin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/i.test(cleanOrigin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin)) return true;
  return false;
};

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (isAllowedSocketOrigin(origin)) {
        callback(null, true);
      } else {
        console.warn(`[Socket CORS] Origin rejected: '${origin}'`);
        callback(null, true); // Fallback allow in permissive WebSocket environments
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
});

devServerManager.setSocketServer(io);
app.set("io", io);

const users = {};
const pendingDisconnects = {};
const callSessions = new Map();

const getReceiverSocketIds = (receiverId) => {
  return users[receiverId] ? Array.from(users[receiverId]) : [];
};

function getSocketIdsForUser(userId) {
  return users[userId] ? Array.from(users[userId]) : [];
}

function emitToUser(userId, event, payload) {
  getSocketIdsForUser(userId).forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
}

function cleanupCallSession(callId) {
  const session = callSessions.get(callId);
  if (!session) return;
  clearTimeout(session.timeout);
  callSessions.delete(callId);
}

async function setUserOnlineStatus(userId, isOnline) {
  if (!userId || userId.startsWith("guest_") || userId.length < 24) return;
  try {
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: isOnline ? undefined : new Date(),
    });
  } catch (err) {
    console.error("Failed to update online status", err);
  }
}

function getTokenFromCookie(cookieString = "") {
  if (!cookieString) return null;
  const cookies = cookieString.split(";").map(c => c.trim());
  for (const c of cookies) {
    if (c.startsWith("token=")) return c.split("=")[1];
  }
  return null;
}

// ─── Main socket handler ──────────────────────────────────────────────────────

io.on("connection", (socket) => {
  console.log("🟢 socket connected:", socket.id);

  let userId;
  const cookieString = socket.handshake.headers?.cookie;
  const rawAuthHeader = socket.handshake.headers?.authorization;
  const bearerToken = rawAuthHeader?.startsWith("Bearer ") ? rawAuthHeader.split(" ")[1] : null;

  const token =
    getTokenFromCookie(cookieString) ||
    socket.handshake.auth?.token ||
    socket.handshake.query?.token ||
    bearerToken;

  if (token) {
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "e972d971df9c5e979d26b7767950a8b5";
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = (decoded.id || decoded.userId || decoded._id)?.toString();
    } catch (err) {
      console.warn("❌ Invalid socket token signature, falling back to query userId");
    }
  }

  if (!userId) userId = socket.handshake.query.userId?.toString();
  if (!userId) {
    // Assign transient guest session ID so terminal and workspace socket features still work smoothly
    userId = `guest_${socket.id.slice(0, 8)}`;
    console.log(`ℹ️ Socket ${socket.id} connected with transient userId: ${userId}`);
  }

  socket.userId = userId;

  if (pendingDisconnects[userId]) {
    clearTimeout(pendingDisconnects[userId]);
    delete pendingDisconnects[userId];
  }

  if (!users[userId]) users[userId] = new Set();
  const wasOffline = users[userId].size === 0;

  users[userId].add(socket.id);

  if (wasOffline && !userId.startsWith("guest_")) {
    setUserOnlineStatus(userId, true);
  }

  io.emit("onlineUsers", Object.keys(users).filter((u) => !u.startsWith("guest_")));

  // ─── Multi-Terminal PTY Events ──────────────────────────────────────────────

  /**
   * Create or attach to a terminal session
   * Payload: { sessionId, projectId, shellType, cols, rows }
   */
  socket.on("terminal:create", ({ sessionId, projectId, shellType, cols, rows } = {}) => {
    if (projectId) {
      workspaceFs.watchWorkspace(projectId, (change) => {
        io.emit("workspace:fs-change", change);
      });
    }
    terminalManager.createSession({
      sessionId,
      projectId,
      socket,
      shellType,
      cols,
      rows,
      userId: socket.userId
    });
  });

  // Backward compatibility alias
  socket.on("terminal:start", ({ sessionId, projectId, shellType, cols, rows } = {}) => {
    if (projectId) {
      workspaceFs.watchWorkspace(projectId, (change) => {
        io.emit("workspace:fs-change", change);
      });
    }
    terminalManager.createSession({
      sessionId: sessionId || "default",
      projectId,
      socket,
      shellType,
      cols,
      rows,
      userId: socket.userId
    });
  });

  /**
   * User typed or sent raw keystrokes to terminal
   * Payload: { sessionId, data }
   */
  socket.on("terminal:input", (payload = {}) => {
    const sessionId = payload.sessionId || "default";
    const data = typeof payload.data === "string" ? payload.data : (typeof payload === "string" ? payload : "");
    terminalManager.write(sessionId, data);
  });

  /**
   * Terminal panel resized
   * Payload: { sessionId, cols, rows }
   */
  socket.on("terminal:resize", ({ sessionId = "default", cols = 80, rows = 24 } = {}) => {
    terminalManager.resize(sessionId, cols, rows);
  });

  /**
   * User explicitly requested to kill a terminal session
   * Payload: { sessionId }
   */
  socket.on("terminal:kill", ({ sessionId = "default" } = {}) => {
    terminalManager.kill(sessionId);
    socket.emit("terminal:output", {
      sessionId,
      data: "\r\n\x1b[33m[Terminal session terminated]\x1b[0m\r\n"
    });
  });

  /**
   * User requested to restart a terminal session
   * Payload: { sessionId }
   */
  socket.on("terminal:restart", ({ sessionId = "default" } = {}) => {
    terminalManager.restart(sessionId, socket);
  });

  // ─── Chat & call events ─────────────────────────────────────────────────────

  socket.on("typing", ({ to, conversationId, typing }) => {
    if (!to) return;
    getReceiverSocketIds(to).forEach((sid) => {
      io.to(sid).emit("typing", {
        from: socket.userId,
        conversationId,
        typing,
      });
    });
  });

  socket.on("clear-history", ({ conversationId, userId }) => {
    // Broadcast the clear history event to everyone to ensure it clears for the other participant instantly
    io.emit("clear-history", { conversationId, userId });
  });

  socket.on("call-user", ({ to, callType, callId, conversationId, caller }) => {
    const targetId = to?.toString();
    if (!targetId || !callId || !caller) return;

    const receiverSockets = getSocketIdsForUser(targetId);
    if (receiverSockets.length === 0) {
      emitToUser(socket.userId, "user-busy", { callId });
      return;
    }

    const existingSession = callSessions.get(callId);
    if (existingSession && existingSession.status !== "ended") {
      emitToUser(socket.userId, "user-busy", { callId });
      return;
    }

    const timeout = setTimeout(() => {
      emitToUser(socket.userId, "call-timeout", { callId });
      cleanupCallSession(callId);
    }, 25000);

    callSessions.set(callId, {
      callId,
      callerId: socket.userId,
      receiverId: targetId,
      callType,
      conversationId,
      status: "ringing",
      timeout,
    });

    receiverSockets.forEach((socketId) => {
      io.to(socketId).emit("incoming-call", {
        callId,
        callType,
        caller: {
          _id: caller._id,
          fullName: caller.fullName,
        },
        conversationId,
      });
    });
  });

  socket.on("accept-call", ({ callId, to }) => {
    const targetId = to?.toString();
    if (!callId || !targetId) return;
    const session = callSessions.get(callId);
    if (!session || session.status !== "ringing") {
      emitToUser(socket.userId, "user-busy", { callId });
      return;
    }

    session.status = "accepted";
    clearTimeout(session.timeout);
    session.timeout = null;
    callSessions.set(callId, session);

    emitToUser(session.callerId, "call-accepted", {
      callId,
      from: socket.userId,
      callType: session.callType,
    });
  });

  socket.on("reject-call", ({ callId, to }) => {
    const targetId = to?.toString();
    if (!callId || !targetId) return;
    const session = callSessions.get(callId);
    if (session) {
      emitToUser(session.callerId, "reject-call", { callId });
      cleanupCallSession(callId);
    } else {
      emitToUser(socket.userId, "user-busy", { callId });
    }
  });

  socket.on("end-call", ({ callId }) => {
    if (!callId) return;
    const session = callSessions.get(callId);
    if (!session) return;

    const targetId = session.callerId === socket.userId ? session.receiverId : session.callerId;
    if (targetId) {
      emitToUser(targetId, "end-call", { callId });
    }

    cleanupCallSession(callId);
  });

  socket.on("offer", ({ to, callId, sdp }) => {
    const targetId = to?.toString();
    if (!targetId || !callId || !sdp) return;
    emitToUser(targetId, "offer", { callId, sdp, from: socket.userId });
  });

  socket.on("answer", ({ to, callId, sdp }) => {
    const targetId = to?.toString();
    if (!targetId || !callId || !sdp) return;
    emitToUser(targetId, "answer", { callId, sdp, from: socket.userId });
  });

  socket.on("ice-candidate", ({ to, callId, candidate }) => {
    const targetId = to?.toString();
    if (!targetId || !callId || !candidate) return;
    emitToUser(targetId, "ice-candidate", { callId, candidate, from: socket.userId });
  });

  socket.on("disconnect", () => {
    console.log("🔴 socket disconnected:", socket.id);

    // Cleanup terminal sessions for this socket
    terminalManager.cleanupSocket(socket.id);

    const uid = socket.userId;
    if (!uid || !users[uid]) return;

    users[uid].delete(socket.id);

    if (users[uid].size === 0) {
      pendingDisconnects[uid] = setTimeout(async () => {
        if (!users[uid] || users[uid].size === 0) {
          delete users[uid];
          await setUserOnlineStatus(uid, false);
          io.emit("onlineUsers", Object.keys(users));
        }
        delete pendingDisconnects[uid];
      }, 5000);
    }

    for (const [callId, session] of Array.from(callSessions.entries())) {
      if (session.callerId === uid || session.receiverId === uid) {
        const targetId = session.callerId === uid ? session.receiverId : session.callerId;
        if (targetId) {
          emitToUser(targetId, "end-call", { callId });
        }
        cleanupCallSession(callId);
      }
    }
  });
});

module.exports = {
  app,
  io,
  server,
  getReceiverSocketIds
};
