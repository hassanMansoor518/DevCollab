const mongoose = require("mongoose");

const workspaceFileSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    path: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["file", "dir"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    parentPath: {
      type: String,
      default: "",
    },
    isBinary: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

workspaceFileSchema.index({ projectId: 1, path: 1 }, { unique: true });

module.exports = mongoose.model("WorkspaceFile", workspaceFileSchema);
