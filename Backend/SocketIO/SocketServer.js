import { Server } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:4002",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// { userId: Set(socketId) }
const users = {};
const pendingDisconnects = {};

export const getReceiverSocketIds = (receiverId) => {
  return users[receiverId] ? Array.from(users[receiverId]) : [];
};

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
      userId = decoded.id;
    } catch (err) {
      console.warn("❌ Invalid socket token");
    }
  }

  // fallback (dev only)
  if (!userId) userId = socket.handshake.query.userId;

  if (!userId) {
    console.warn("⚠️ socket connected without userId");
    return;
  }

  // 🔥 persist userId on socket
  socket.userId = userId;

  // cancel pending disconnect
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

  // ✅ FIXED EVENT NAME
  io.emit("onlineUsers", Object.keys(users));

  // typing event
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
  });
});

export { app, io, server };
