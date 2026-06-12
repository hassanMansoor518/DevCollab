const mongoose = require("mongoose");

const workspaceSchema = new mongoose.Schema(
  {
    name: String,
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    settings: {
      allowMemberInvites: { type: Boolean, default: false },
      messageRetentionDays: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Workspace", workspaceSchema);
