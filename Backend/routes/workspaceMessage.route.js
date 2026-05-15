const express = require("express");
const router = express.Router();
const protectRoute = require("../middleware/secureRoute");
const {
  sendWorkspaceMessage,
  getWorkspaceMessages,
} = require("../controller/workspaceMessage.controller");

router.post("/send/:id", protectRoute, sendWorkspaceMessage);
router.get("/get/:id", protectRoute, getWorkspaceMessages);

module.exports = router;