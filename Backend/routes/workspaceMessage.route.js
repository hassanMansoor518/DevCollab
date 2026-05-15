const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/secureRoute");
const {
  sendWorkspaceMessage,
  getWorkspaceMessages,
  getRecentActivity,
} = require("../controller/workspaceMessage.controller");

router.post("/send/:id", protectRoute, sendWorkspaceMessage);
router.get("/get/:id", protectRoute, getWorkspaceMessages);
router.get("/recent-activity", protectRoute, getRecentActivity);

module.exports = router;