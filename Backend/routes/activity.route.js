const express = require("express");
const router = express.Router();
const { getActivities, getWorkspaceActivities } = require("../controller/activity.controller");
const protectRoute = require("../middleware/secureRoute");

router.get("/", protectRoute, getActivities);

router.get("/workspace/:workspaceId", protectRoute, getWorkspaceActivities);

module.exports = router;
