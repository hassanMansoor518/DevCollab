const SystemActivity = require("../model/systemActivity.model");
const Project = require("../model/project.model");

const getActivities = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find projects the user is a member of
    const userProjects = await Project.find({ members: userId }).select("_id");
    const projectIds = userProjects.map(p => p._id);

    // Fetch activities related to these projects OR generic events (like adding this user to a team)
    const activities = await SystemActivity.find({
      $or: [
        { "metadata.projectId": { $in: projectIds } },
        { "metadata.userId": userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching system activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getWorkspaceActivities = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const activities = await SystemActivity.find({
      "metadata.workspaceId": workspaceId
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json(activities);
  } catch (error) {
    console.error("Error fetching workspace activities:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getActivities, getWorkspaceActivities };
