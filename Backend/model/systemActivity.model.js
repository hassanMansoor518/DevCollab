const mongoose = require("mongoose");

const systemActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "PROJECT_CREATED",
      "PROJECT_UPDATED",
      "PROJECT_DELETED",
      "COMMIT_PUSHED",
      "CODE_DEPLOYED",
      "AI_ANALYSIS_GENERATED",
      "REPORT_GENERATED",
      "TEAM_MEMBER_ADDED",
      "TEAM_MEMBER_REMOVED",
      "SETTINGS_UPDATED"
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  metadata: {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "Report" },
    extraInfo: Object
  }
}, { timestamps: true });

const SystemActivity = mongoose.model("SystemActivity", systemActivitySchema);
module.exports = SystemActivity;
