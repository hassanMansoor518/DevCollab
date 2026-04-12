const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: String,

    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);