const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    projectName: { type: String, required: true },
    description: String,
    team: String,
    visibility: String,

    // Fixed: was [String], now proper ObjectId refs
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    githubRepo: String,

    // New: draft vs active support
    status: { type: String, enum: ["active", "draft"], default: "active" },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
    },

    githubData: {
      html_url: String,
      description: String,
      stars: Number,
      forks: Number,
      languages: [String],
    },

    projectStructure: { type: Object },
    indexedCodeSummary: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);