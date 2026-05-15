const WorkspaceMessage = require("../model/workspaceMessage.model");
const Workspace = require("../model/workspace.model");
const { io } = require("../SocketIO/SocketServer");

const sendWorkspaceMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: workspaceId } = req.params;
    const senderId = req.user._id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    const isMember = workspace.members.some(
      (m) => m.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "You are not a member of this workspace" });
    }

    const newMessage = new WorkspaceMessage({
      workspaceId,
      senderId,
      message,
    });
    await newMessage.save();

    // ✅ Emit to all other workspace members
    try {
      workspace.members.forEach((memberId) => {
        if (memberId.toString() !== senderId.toString()) {
          io.to(memberId.toString()).emit("newWorkspaceMessage", {
            message: newMessage,
            workspaceId: workspaceId.toString(),
          });
        }
      });
    } catch (err) {
      console.log("Socket emit error:", err);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendWorkspaceMessage", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getWorkspaceMessages = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user._id;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json([]);

    const isMember = workspace.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) return res.status(403).json({ error: "Forbidden" });

    const messages = await WorkspaceMessage.find({ workspaceId })
      .populate("senderId", "fullName email")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getWorkspaceMessages", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    const myWorkspaces = await Workspace.find({ members: userId }).select("_id name");
    const workspaceIds = myWorkspaces.map(w => w._id);

    const messages = await WorkspaceMessage.find({ workspaceId: { $in: workspaceIds } })
      .populate("senderId", "fullName avatar")
      .populate("workspaceId", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    const activity = messages.map(m => ({
      id: m._id,
      type: 'MESSAGE',
      title: m.senderId.fullName,
      description: m.message,
      time: m.createdAt,
      meta: `#${m.workspaceId.name}`,
      status: 'INFO',
      link: '/chat'
    }));

    res.status(200).json(activity);
  } catch (error) {
    console.log("Error in getRecentActivity", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { sendWorkspaceMessage, getWorkspaceMessages, getRecentActivity };