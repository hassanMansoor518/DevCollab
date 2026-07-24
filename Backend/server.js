
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

const reportRoutes = require("./routes/report.route.js");
const connectDB = require("./db/db");
connectDB();
const Port = process.env.PORT;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Matches ALL Vercel preview/branch deployments for this project automatically
const vercelPreviewRegex = /^https:\/\/dev-collab[a-z0-9-]*\.vercel\.app$/;

const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,   // Set this in Railway env vars for production domain
  "http://localhost:5173",
  "http://localhost:3000",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow no-origin requests (Postman, mobile apps, curl)
    if (!origin) return callback(null, true);

    if (vercelPreviewRegex.test(origin) || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true
}));
// ──────────────────────────────────────────────────────────────────────────────

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use('/api/conversation', conversationRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/project', projectRoutes);
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