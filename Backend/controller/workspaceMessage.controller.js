const WorkspaceMessage = require("../model/workspaceMessage.model");
const Workspace = require("../model/workspace.model");
const { getReceiverSocketIds, io } = require("../SocketIO/SocketServer");

// Send a message within a workspace
const sendWorkspaceMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: workspaceId } = req.params;
    const senderId = req.user._id;

    // 1. Verify workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // 2. Verify sender is a member of this workspace
    const isMember = workspace.members.some(
      (m) => m.toString() === senderId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ message: "Forbidden: You are not a member of this workspace" });
    }

    // 3. Create and save new message
    const newMessage = new WorkspaceMessage({
      workspaceId,
      senderId,
      message,
    });
    await newMessage.save();

    // 4. Populate sender details (e.g. fullName)
    await newMessage.populate("senderId", "fullName");

    // 5. Emit socket event to all workspace members who are online (except the sender)
    try {
      workspace.members.forEach((memberId) => {
        if (memberId.toString() !== senderId.toString()) {
          const receiverSocketIds = getReceiverSocketIds(memberId.toString());
          if (receiverSocketIds && receiverSocketIds.length) {
            receiverSocketIds.forEach((sid) => {
              io.to(sid).emit("newWorkspaceMessage", {
                message: newMessage,
                workspaceId: workspaceId.toString(),
              });
            });
          }
        }
      });
    } catch (err) {
      console.error("Socket emit error in sendWorkspaceMessage:", err);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error in sendWorkspaceMessage:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Retrieve all messages for a workspace
const getWorkspaceMessages = async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const userId = req.user._id;

    // 1. Verify workspace exists
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return res.status(404).json([]);
    }

    // 2. Verify user is a member of the workspace
    const isMember = workspace.members.some(
      (m) => m.toString() === userId.toString()
    );
    if (!isMember) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // 3. Fetch messages and populate sender details
    const messages = await WorkspaceMessage.find({ workspaceId })
      .populate("senderId", "fullName")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error in getWorkspaceMessages:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Retrieve recent activity (messages) for workspaces the user is a member of
const getRecentActivity = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Find all workspaces the user is a member of
    const workspaces = await Workspace.find({ members: userId }).select("_id");
    const workspaceIds = workspaces.map((w) => w._id);

    // 2. Fetch recent messages
    const recentMessages = await WorkspaceMessage.find({
      workspaceId: { $in: workspaceIds },
    })
      .populate("senderId", "fullName")
      .populate("workspaceId", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json(recentMessages);
  } catch (error) {
    console.error("Error in getRecentActivity:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a workspace message (only sender can edit)
const updateWorkspaceMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    const existing = await WorkspaceMessage.findById(messageId);
    if (!existing) return res.status(404).json({ message: "Message not found" });

    if (existing.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    existing.message = message;
    existing.edited = true;
    await existing.save();

    await existing.populate("senderId", "fullName");

    // emit update event to workspace members
    try {
      const workspace = await Workspace.findById(existing.workspaceId);
      workspace.members.forEach((memberId) => {
        const receiverSocketIds = getReceiverSocketIds(memberId.toString());
        if (receiverSocketIds && receiverSocketIds.length) {
          receiverSocketIds.forEach((sid) => {
            io.to(sid).emit("updateWorkspaceMessage", { message: existing, workspaceId: workspace._id.toString() });
          });
        }
      });
    } catch (err) {
      console.error("Socket emit error in updateWorkspaceMessage:", err);
    }

    res.json(existing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update message" });
  }
};

// Delete a workspace message (only sender can delete)
const deleteWorkspaceMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const existing = await WorkspaceMessage.findById(messageId);
    if (!existing) return res.status(404).json({ message: "Message not found" });

    if (existing.senderId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await WorkspaceMessage.findByIdAndDelete(messageId);

    // emit delete event to workspace members
    try {
      const workspace = await Workspace.findById(existing.workspaceId);
      workspace.members.forEach((memberId) => {
        const receiverSocketIds = getReceiverSocketIds(memberId.toString());
        if (receiverSocketIds && receiverSocketIds.length) {
          receiverSocketIds.forEach((sid) => {
            io.to(sid).emit("deleteWorkspaceMessage", { messageId, workspaceId: workspace._id.toString() });
          });
        }
      });
    } catch (err) {
      console.error("Socket emit error in deleteWorkspaceMessage:", err);
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete message" });
  }
};

module.exports = {
  sendWorkspaceMessage,
  getWorkspaceMessages,
  getRecentActivity,
  updateWorkspaceMessage,
  deleteWorkspaceMessage,
};
