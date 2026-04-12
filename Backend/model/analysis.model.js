const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    commitSha: String,
    result: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Analysis", analysisSchema);