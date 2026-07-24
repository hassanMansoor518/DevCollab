const { Server } = require("socket.io");
const http = require("http");
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/user.model.js");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://dev-collab-quzpx6aqi-hassanmansoor518-gmailcoms-projects.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST"],
  },
});

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

io.on("connection", (socket) => {
  console.log("🟢 socket connected:", socket.id);

  let userId;
  const cookieString = socket.handshake.headers?.cookie;
  const token = getTokenFromCookie(cookieString);

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id?.toString();
    } catch (err) {
      console.warn("❌ Invalid socket token");
    }
  }

  if (!userId) userId = socket.handshake.query.userId?.toString();

  if (!userId) {
    console.warn("⚠️ socket connected without userId");
    return;
  }

  socket.userId = userId;

  if (pendingDisconnects[userId]) {
    clearTimeout(pendingDisconnects[userId]);
    delete pendingDisconnects[userId];
  }

  if (!users[userId]) users[userId] = new Set();
  const wasOffline = users[userId].size === 0;

  users[userId].add(socket.id);

  console.log("🟢 Online users:", Object.keys(users));

  if (wasOffline) {
    setUserOnlineStatus(userId, true);
  }

  io.emit("onlineUsers", Object.keys(users));

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
