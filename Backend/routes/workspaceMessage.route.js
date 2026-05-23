const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/secureRoute");
const {
  sendWorkspaceMessage,
  getWorkspaceMessages,
  getRecentActivity,
  updateWorkspaceMessage,
  deleteWorkspaceMessage,
} = require("../controller/workspaceMessage.controller");

router.post("/send/:id", protectRoute, sendWorkspaceMessage);
router.get("/get/:id", protectRoute, getWorkspaceMessages);
router.get("/recent-activity", protectRoute, getRecentActivity);

// Update workspace message
router.put("/:messageId", protectRoute, updateWorkspaceMessage);

// Delete workspace message
router.delete("/:messageId", protectRoute, deleteWorkspaceMessage);

module.exports = router;