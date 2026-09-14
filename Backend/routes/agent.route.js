const express = require("express");
const AgentTask = require("../model/agentTask.model");
const Project = require("../model/project.model");
const orchestrator = require("../agent/agent.orchestrator");
const checkpoints = require("../agent/agent.checkpoints");
const aiService = require("../services/ai.service");
const { io: socketIo } = require("../SocketIO/SocketServer");
require("dotenv").config();

const router = express.Router();

/**
 * 1. Submit or start a new Autonomous AI Coding Agent task
 */
router.post("/task", async (req, res) => {
  try {
    const { projectId, prompt, activeFile, selectedCode, openTabs, mode, userId } = req.body;

    if (!projectId || !prompt) {
      return res.status(400).json({ error: "projectId and prompt are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Create new persistent agent task in DB
    const newTask = await AgentTask.create({
      projectId,
      userId: userId || null,
      prompt,
      activeFile: activeFile || null,
      selectedCode: selectedCode || null,
      openTabs: Array.isArray(openTabs) ? openTabs : [],
      mode: mode || "fast",
      state: "ANALYZING",
      activeTaskText: "Starting AI Agent...",
      messages: [{ role: "user", message: prompt, timestamp: new Date() }],
      logs: [{ timestamp: new Date(), text: `Task created: "${prompt}" [Mode: ${(mode || 'fast').toUpperCase()}]` }],
    });

    const ioInstance = socketIo || req.app.get("io");

    // Launch orchestrator loop asynchronously in background
    orchestrator.runAgentLoop(newTask._id, ioInstance);

    res.status(201).json(newTask);
  } catch (err) {
    console.error("[Agent Router Error]:", err.message);
    res.status(500).json({ error: "Failed to initialize AI Agent task", details: err.message });
  }
});

/**
 * 2. Get status, plan, changes, diffs, checkpoints of a task
 */
router.get("/task/:taskId", async (req, res) => {
  try {
    const task = await AgentTask.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. Approve plan or file changes
 */
router.post("/task/:taskId/approve", async (req, res) => {
  try {
    const { path } = req.body;
    const io = socketIo || req.app.get("io");
    const task = await orchestrator.acceptTaskChanges(req.params.taskId, path, io);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. Reject file changes & restore original code
 */
router.post("/task/:taskId/reject", async (req, res) => {
  try {
    const { path } = req.body;
    const io = socketIo || req.app.get("io");
    const task = await orchestrator.rejectTaskChanges(req.params.taskId, path, io);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 5. Stop running agent task
 */
router.post("/task/:taskId/stop", async (req, res) => {
  try {
    const io = socketIo || req.app.get("io");
    const task = await orchestrator.stopTask(req.params.taskId, io);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6. Pause agent task
 */
router.post("/task/:taskId/pause", async (req, res) => {
  try {
    const io = socketIo || req.app.get("io");
    const task = await orchestrator.pauseTask(req.params.taskId, io);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. Resume agent task
 */
router.post("/task/:taskId/resume", async (req, res) => {
  try {
    const io = socketIo || req.app.get("io");
    const task = await orchestrator.resumeTask(req.params.taskId, io);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 8. Undo last change / rollback workspace
 */
router.post("/task/:taskId/undo", async (req, res) => {
  try {
    const task = await AgentTask.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const io = socketIo || req.app.get("io");
    const result = await checkpoints.undoLastCheckpoint(task, io);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 9. Redo next change
 */
router.post("/task/:taskId/redo", async (req, res) => {
  try {
    const task = await AgentTask.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const io = socketIo || req.app.get("io");
    const result = await checkpoints.redoNextCheckpoint(task, io);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 10. Retry failed task
 */
router.post("/task/:taskId/retry", async (req, res) => {
  try {
    const task = await AgentTask.findById(req.params.taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });
    task.state = "ANALYZING";
    task.retryCount = 0;
    task.logs.push({ timestamp: new Date(), text: "Retrying task execution" });
    await task.save();

    const io = socketIo || req.app.get("io");
    orchestrator.runAgentLoop(task._id, io);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 11. Fetch task execution history for a project
 */
router.get("/history/:projectId", async (req, res) => {
  console.log(`[API] agent history request`);
  console.log(`[API] projectId: ${req.params.projectId}`);
  console.log(`[API] route matched: /api/agent/history/:projectId`);
  try {
    const history = await AgentTask.find({ projectId: req.params.projectId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    console.log(`[API] response status: 200`);
    res.json(history);
  } catch (err) {
    console.log(`[API] response status: 500`);
    console.log(`[API] error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 12. Helper endpoint for inline AI selection actions
 */
router.post("/inline-action", async (req, res) => {
  try {
    const { action, code, language, filename } = req.body;
    if (!action || !code) {
      return res.status(400).json({ error: "action and code are required" });
    }

    const actionPrompts = {
      explain: "Explain what this code block does in simple engineering terms.",
      fix: "Find and fix any bugs, typos, or logic errors in this code block. Return corrected code.",
      refactor: "Refactor this code block for better readability, performance, and best practices.",
      test: "Generate unit tests for this code block.",
      comments: "Add clear, professional inline comments to this code block.",
      security: "Identify security vulnerabilities or bad practices in this code block.",
    };

    const instruction = actionPrompts[action] || "Improve this code block.";
    const prompt = `Task: ${instruction}\nFilename: ${filename || "code"}\nLanguage: ${language || "javascript"}\n\nCode snippet:\n\`\`\`${language || "text"}\n${code.slice(0, 6000)}\n\`\`\``;

    const result = await aiService.generateResult(prompt);
    res.json({ action, result });
  } catch (err) {
    console.error("[Inline AI Error]:", err.message);
    res.status(500).json({ error: "Inline AI action failed" });
  }
});

module.exports = router;
