
require('dotenv').config()
const express = require("express");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/auth.routes");
const messageRoutes = require("./routes/message.route");
const aiRoutes = require("./routes/ai.route");
const conversationRoutes = require("./routes/conversation.route");
const cors = require("cors");
const { app, server } = require("./SocketIO/SocketServer");


const connectDB = require("./db/db");
connectDB();
const Port = process.env.PORT

app.use(cors({
  origin: "http://localhost:4002",
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/ai", aiRoutes);
app.use('/api/conversation', conversationRoutes);


app.get("/", (req, res) => {
  res.send("home page");
});
server.listen(Port, () => {
  console.log(`Server running at http://localhost:${Port}`);
});