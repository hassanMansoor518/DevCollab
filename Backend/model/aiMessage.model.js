const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    contextFiles: [
      {
        path: String,
        content: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("AiMessage", aiMessageSchema);
