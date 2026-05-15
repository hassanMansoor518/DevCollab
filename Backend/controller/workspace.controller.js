const Workspace = require("../model/workspace.model");

// Get single workspace
const getWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId)
      .populate("members");

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch workspace" });
  }
};

// Add member (optimized + safe)
const addMember = async (req, res) => {
  try {
    const { userId } = req.body;

    const workspace = await Workspace.findById(req.params.workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const alreadyMember = workspace.members.some(
      (m) => m.toString() === userId.toString()
    );

    if (alreadyMember) {
      return res.status(400).json({ message: "User already a member" });
    }

    workspace.members.push(userId);
    await workspace.save();

    const updatedWorkspace = await Workspace.findById(workspace._id).populate("members");

    res.json(updatedWorkspace);
  } catch (err) {
    res.status(500).json({ message: "Failed to add member" });
  }
};

// Get all workspaces for user
const getAllWorkspace = async (req, res) => {
  try {
    const userId = req.user._id;

    const workspaces = await Workspace.find({
      members: userId,
    }).populate("members");

    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
};

// ✅ DELETE WORKSPACE (NEW)
const deleteWorkspace = async (req, res) => {
  try {
    const workspace = await Workspace.findById(req.params.workspaceId);

    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    await Workspace.findByIdAndDelete(req.params.workspaceId);

    res.json({ message: "Workspace deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete workspace" });
  }
};

module.exports = {
  getWorkspace,
  addMember,
  getAllWorkspace,
  deleteWorkspace,
};