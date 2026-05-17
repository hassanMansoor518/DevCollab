const aiController = require("../controller/ai.controller.js");

const express = require("express");
const secureRoute = require("../middleware/secureRoute.js");

const router = express.Router();

router.get("/get-result", secureRoute, aiController.getResult);
router.get("/history/:projectId", secureRoute, aiController.getChatHistory);
router.post("/analyze-code", aiController.analyzeCode);
router.post("/fix-issue", aiController.fixIssue);

module.exports = router;
