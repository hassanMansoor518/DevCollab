import express from "express";
const router = express.Router();
import * as reportController from "../controller/report.controller.js";
import secureRoute from "../middleware/secureRoute.js";

// All report routes require authentication
router.use(secureRoute);

// Generate report
router.post("/:projectId/generate", reportController.generateReport);

// Get all reports
router.get("/", reportController.getAllReports);

// Get all reports for a project
router.get("/project/:projectId", reportController.getReportsByProject);

// Get single report
router.get("/:reportId", reportController.getReport);

// Delete report
router.delete("/:reportId", reportController.deleteReport);

// Download report
router.get("/:reportId/download", reportController.downloadReport);

export default router;
