
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

const reportRoutes = require("./routes/report.route.js").default || require("./routes/report.route.js");
const connectDB = require("./db/db");
connectDB();
const Port = process.env.PORT

app.use(cors({
  origin: ["http://localhost:4002", "https://ai-powered-chat-application-sigma.vercel.app"],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.get("/", (req, res) => {
  res.send("home page");
});
server.listen(Port, () => {
  console.log(`Server running at http://localhost:${Port}`);
});