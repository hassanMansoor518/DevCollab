const Workspace = require("../model/workspace.model");

const getWorkspace = async (req, res) => {
  const workspace = await Workspace.findById(req.params.workspaceId)
    .populate("members.user");

  res.json(workspace);
};

const addMember = async (req, res) => {
  const { userId, role } = req.body;

  const workspace = await Workspace.findById(req.params.workspaceId);

  workspace.members.push({
    user: userId,
    role: role || "developer"
  });

  await workspace.save();

  res.json({ message: "Member added" });
};


// Get all workspaces
const getAllWorkspace = async (req, res) => {
  try {
    // Option 1: Get all workspaces in the DB
    const workspaces = await Workspace.find().populate("members.user");

    // Option 2 (optional): Get only workspaces where current user is a member
    // const userId = req.user._id; // if using auth middleware
    // const workspaces = await Workspace.find({ "members.user": userId }).populate("members.user");

    res.json(workspaces);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
};

module.exports = {
  getWorkspace,
  addMember,
  getAllWorkspace
};