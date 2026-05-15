const express = require("express");
const router = express.Router();
const SystemActivity = require("../model/systemActivity.model");
const protectRoute = require("../middleware/secureRoute");

router.get("/", protectRoute, async (req, res) => {
  try {
    const activities = await SystemActivity.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("metadata.projectId", "projectName")
      .populate("metadata.userId", "fullName")
      .populate("metadata.reportId", "title");

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching system activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
