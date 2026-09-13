
require('dotenv').config()
const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.route");
const aiRoutes = require("./routes/ai.route");
const conversationRoutes = require("./routes/conversation.route");
const cors = require("cors");
const { app, server } = require("./SocketIO/SocketServer");
const inviteRoutes = require("./routes/Invite.route");
const projectRoutes = require("./routes/project.route");
const workspaceRoutes = require("./routes/workspace.route");
const workspaceMessageRoutes = require("./routes/workspaceMessage.route");
const activityRoutes = require("./routes/activity.route");
const supportRoutes = require("./routes/support.route");

const agentRoutes = require("./routes/agent.route");
const reportRoutes = require("./routes/report.route.js");
const connectDB = require("./db/db");
connectDB();
const Port = process.env.PORT;

// ─── CORS ─────────────────────────────────────────────────────────────────────
const parseAllowedOrigins = () => {
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
  ];
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  const allowed = parseAllowedOrigins();
  if (allowed.includes(cleanOrigin)) return true;
  if (/^https:\/\/dev-collab.*\.vercel\.app$/i.test(cleanOrigin)) return true;
  if (/^https:\/\/.*\.vercel\.app$/i.test(cleanOrigin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(cleanOrigin)) return true;
  return false;
};

app.use(cors({
  origin: function (origin, callback) {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true
}));
// ──────────────────────────────────────────────────────────────────────────────

const previewProxyRoutes = require("./routes/previewProxy");

// ─── Dev Server Reverse Proxy (Must be mounted before body-parser for raw streams)
app.use("/api/project", previewProxyRoutes);
app.use("/preview", previewProxyRoutes);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/project', projectRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/workspace", workspaceRoutes);
app.use("/api/workspace/message", workspaceMessageRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/support", supportRoutes);

app.get("/", (req, res) => {
  res.send("home page");
});

server.listen(Port, () => {
  console.log(`Server running at http://localhost:${Port}`);
});