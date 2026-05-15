const express = require("express");
const router = express.Router();
const { getActivities } = require("../controller/activity.controller");
const protectRoute = require("../middleware/secureRoute");

router.get("/", protectRoute, getActivities);

module.exports = router;
