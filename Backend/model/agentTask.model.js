const mongoose = require("mongoose");

const agentTaskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    prompt: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      enum: [
        "IDLE",
        "ANALYZING",
        "PLANNING",
        "WAITING_FOR_APPROVAL",
        "EXECUTING",
        "RUNNING_COMMAND",
        "RUNNING_TESTS",
        "ANALYZING_ERROR",
        "FIXING",
        "VERIFYING",
        "COMPLETED",
        "FAILED",
        "CANCELLED",
        "PAUSED",
      ],
      default: "IDLE",
    },
    summary: {
      type: String,
      default: "",
    },
    activeTaskText: {
      type: String,
      default: "",
    },
    plan: [
      {
        id: Number,
        text: String,
        status: {
          type: String,
          enum: ["completed", "in_progress", "pending", "failed"],
          default: "pending",
        },
        filesInvolved: [String],
      },
    ],
    filesChanged: [
      {
        path: String,
        status: {
          type: String, // "M" (modified), "A" (added), "D" (deleted)
          default: "M",
        },
        originalContent: { type: String, default: "" },
        newContent: { type: String, default: "" },
        explanation: { type: String, default: "" },
        applied: { type: Boolean, default: false },
      },
    ],
    checkpoints: [
      {
        checkpointId: String,
        description: String,
        createdAt: { type: Date, default: Date.now },
        snapshot: Object, // Map of filePath -> content
      },
    ],
    currentCheckpointIndex: {
      type: Number,
      default: -1,
    },
    terminalOutput: [
      {
        timestamp: { type: Date, default: Date.now },
        command: String,
        output: String,
        exitCode: Number,
      },
    ],
    messages: [
      {
        role: { type: String, enum: ["user", "agent", "system"] },
        message: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        text: String,
      },
    ],
    activeFile: String,
    selectedCode: String,
    openTabs: [String],
    mode: {
      type: String,
      enum: ["fast", "smart", "autonomous", "auto"],
      default: "fast",
    },
    errorDetails: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
  },
  { timestamps: true, versionKey: false, strict: false }
);

module.exports = mongoose.model("AgentTask", agentTaskSchema);
