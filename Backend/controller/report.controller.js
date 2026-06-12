import Report from "../model/report.model.js";
import Project from "../model/project.model.js";
import { generateProfessionalReport } from "../services/ai.service.js";
import PDFDocument from "pdfkit";
import { logActivity } from "../services/activity.service.js";

// Generate a new report
export const generateReport = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filename, language, code, analysisResult } = req.body;

    if (!projectId || !filename || !language || !code) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Call AI Service
    const aiReportContent = await generateProfessionalReport({
      code,
      filename,
      language,
      analysisResult,
    });

    // Extract basic stats
    const healthScore = analysisResult?.healthScore || 0;
    const complexity = analysisResult?.complexity || "N/A";
    const maintainability = analysisResult?.maintainability || "N/A";
    const totalIssues = analysisResult?.issues?.length || 0;

    // Create Report in DB
    const report = new Report({
      user: req.user._id,
      projectId,
      projectName: project.projectName,
      title: `${project.projectName} - ${filename.split('/').pop()} Audit`,
      filename,
      language,
      healthScore,
      complexity,
      riskLevel: aiReportContent.riskLevel || "Medium",
      maintainability,
      totalIssues,
      executiveSummary: aiReportContent.executiveSummary,
      codeQualityOverview: aiReportContent.codeQualityOverview,
      securityIssues: aiReportContent.securityIssues,
      performanceConcerns: aiReportContent.performanceConcerns,
      maintainabilityAnalysis: aiReportContent.maintainabilityAnalysis,
      bugSeverityBreakdown: aiReportContent.bugSeverityBreakdown,
      suggestedFixes: aiReportContent.suggestedFixes,
      aiRecommendations: aiReportContent.aiRecommendations,
      finalRiskAssessment: aiReportContent.finalRiskAssessment,
      rawAnalysis: analysisResult,
      sourceCode: code,
    });

    await report.save();

    // Log Activity: REPORT_GENERATED
    await logActivity({
      type: "REPORT_GENERATED",
      title: "Audit Report Finalized",
      description: `A comprehensive technical audit for '${filename.split('/').pop()}' is now available.`,
      metadata: { projectId, reportId: report._id }
    });

    res.status(201).json({ message: "Report generated successfully", report });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all reports for a project
export const getReportsByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const reports = await Report.find({ projectId }).sort({ createdAt: -1 });
    res.status(200).json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all reports (across all projects for user)
export const getAllReports = async (req, res) => {
  try {
    // logged in user id
    const userId = req.user._id;

    // only current user reports
    const reports = await Report.find({
      user: userId,
    })
      .sort({ createdAt: -1 })
      .populate("projectId");

    res.status(200).json({
      reports,
    });
  } catch (error) {
    console.error("Error fetching all reports:", error);

    res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get single report
export const getReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json({ report });
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete report
export const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findByIdAndDelete(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Download report as PDF
export const downloadReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId).populate('projectId');

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Report_${report.filename.split('/').pop()}_${Date.now()}.pdf`
    );

    doc.pipe(res);

    // Header
    doc
      .fillColor("#444444")
      .fontSize(20)
      .text("SOFTWARE ENGINEERING AUDIT REPORT", { align: "center" })
      .moveDown();

    doc
      .strokeColor("#aaaaaa")
      .lineWidth(1)
      .moveTo(50, 100)
      .lineTo(550, 100)
      .stroke();

    // File Details Section
    doc.moveDown();
    doc.fontSize(14).fillColor("#333333").text("General Information", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    doc.text(`Project: ${report.projectName || report.projectId?.projectName || 'N/A'}`);
    doc.text(`Filename: ${report.filename}`);
    doc.text(`Language: ${report.language}`);
    doc.text(`Health Score: ${report.healthScore}/100`);
    doc.text(`Risk Level: ${report.riskLevel}`);
    doc.text(`Total Issues: ${report.totalIssues || 0}`);
    doc.text(`Date Generated: ${new Date(report.createdAt).toLocaleString()}`);
    doc.moveDown();

    // Executive Summary
    doc.fontSize(14).fillColor("#333333").text("Executive Summary", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    doc.text(report.executiveSummary || "N/A");
    doc.moveDown();

    // Code Quality
    doc.fontSize(14).fillColor("#333333").text("Code Quality Overview", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    doc.text(report.codeQualityOverview || "N/A");
    doc.moveDown();

    // Security Issues
    doc.fontSize(14).fillColor("#333333").text("Security Issues", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    if (report.securityIssues && report.securityIssues.length > 0) {
      report.securityIssues.forEach((issue, i) => {
        doc.text(`${i + 1}. ${issue}`);
      });
    } else {
      doc.text("No major security issues identified.");
    }
    doc.moveDown();

    // Performance
    doc.fontSize(14).fillColor("#333333").text("Performance Concerns", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    if (report.performanceConcerns && report.performanceConcerns.length > 0) {
      report.performanceConcerns.forEach((concern, i) => {
        doc.text(`${i + 1}. ${concern}`);
      });
    } else {
      doc.text("No major performance concerns identified.");
    }
    doc.moveDown();

    // Maintainability
    doc.fontSize(14).fillColor("#333333").text("Maintainability Analysis", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    doc.text(report.maintainabilityAnalysis || "N/A");
    doc.moveDown();

    // Bug Breakdown
    doc.fontSize(14).fillColor("#333333").text("Bug Severity Breakdown", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    doc.text(`Critical: ${report.bugSeverityBreakdown?.critical || 0}`);
    doc.text(`High: ${report.bugSeverityBreakdown?.high || 0}`);
    doc.text(`Medium: ${report.bugSeverityBreakdown?.medium || 0}`);
    doc.text(`Low: ${report.bugSeverityBreakdown?.low || 0}`);
    doc.moveDown();

    // Suggested Fixes
    doc.fontSize(14).fillColor("#333333").text("Suggested Fixes", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    if (report.suggestedFixes && report.suggestedFixes.length > 0) {
      report.suggestedFixes.forEach((fix, i) => {
        doc.text(`${i + 1}. ${fix}`);
      });
    } else {
      doc.text("No specific fixes suggested.");
    }
    doc.moveDown();

    // Recommendations
    doc.fontSize(14).fillColor("#333333").text("AI Recommendations", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    if (report.aiRecommendations && report.aiRecommendations.length > 0) {
      report.aiRecommendations.forEach((rec, i) => {
        doc.text(`${i + 1}. ${rec}`);
      });
    } else {
      doc.text("No specific recommendations provided.");
    }
    doc.moveDown();

    // Final Assessment
    doc.fontSize(14).fillColor("#333333").text("Final Risk Assessment", { underline: true });
    doc.fontSize(10).fillColor("#000000").moveDown(0.5);
    doc.text(report.finalRiskAssessment || "N/A");

    // Footer
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor("#aaaaaa").text(
        `Generated by Antigravity AI Code Analysis System - Page ${i + 1} of ${range.count}`,
        50,
        doc.page.height - 50,
        { align: "center" }
      );
    }

    doc.end();
  } catch (error) {
    console.error("Error downloading report:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
