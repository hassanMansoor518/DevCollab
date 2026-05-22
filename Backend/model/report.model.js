const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    projectName: { type: String },
    title: { type: String, required: true },
    filename: { type: String, required: true },
    language: { type: String, required: true },
    healthScore: { type: Number, default: 0 },
    complexity: { type: String, default: "N/A" },
    riskLevel: { type: String, default: "Medium" },
    maintainability: { type: String, default: "N/A" },
    totalIssues: { type: Number, default: 0 },
    status: { type: String, default: "Generated" },

    // Detailed Report Content
    executiveSummary: { type: String },
    codeQualityOverview: { type: String },
    securityIssues: [{ type: String }],
    performanceConcerns: [{ type: String }],
    maintainabilityAnalysis: { type: String },
    bugSeverityBreakdown: {
      critical: { type: Number, default: 0 },
      high: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low: { type: Number, default: 0 },
    },
    suggestedFixes: [{ type: String }],
    aiRecommendations: [{ type: String }],
    finalRiskAssessment: { type: String },

    rawAnalysis: { type: Object }, // Store the original AI analysis JSON
    sourceCode: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
