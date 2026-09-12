const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    number: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sourceBranch: {
      type: String,
      required: true,
      trim: true,
    },
    targetBranch: {
      type: String,
      required: true,
      trim: true,
      default: "main",
    },
    // open | merged | closed
    status: {
      type: String,
      enum: ["open", "merged", "closed"],
      default: "open",
      index: true,
    },
    mergedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },
    mergedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// Compound index for unique PR numbers per project
pullRequestSchema.index({ projectId: 1, number: 1 }, { unique: true });

module.exports = mongoose.model("PullRequest", pullRequestSchema);
