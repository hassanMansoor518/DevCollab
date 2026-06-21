const Workspace = require("../model/workspace.model");

const isSameId = (a, b) => a?.toString() === b?.toString();

const isMember = (workspace, userId) =>
  workspace.members.some((memberId) => isSameId(memberId, userId));

const isAdmin = (workspace, userId) => {
  if (workspace.admins?.some((adminId) => isSameId(adminId, userId))) return true;
  return !workspace.admins?.length && isSameId(workspace.members?.[0], userId);
};

const ensureLegacyAdmin = async (workspace) => {
  let updated = false;
  if (!workspace.admins?.length && workspace.members?.length) {
    workspace.admins = [workspace.members[0]];
    updated = true;
  }
  if (!workspace.owner && workspace.admins?.length) {
    workspace.owner = workspace.admins[0];
    updated = true;
  }
  if (updated) {
    await workspace.save();
  }
  return workspace;
};

const populateWorkspace = (id) =>
  Workspace.findById(id).populate("members", "fullName email avatar").populate("admins", "fullName email avatar");

const requireWorkspaceMember = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return { error: { status: 404, message: "Workspace not found" } };
  await ensureLegacyAdmin(workspace);
  if (!isMember(workspace, userId)) {
    return { error: { status: 403, message: "You are not a member of this workspace" } };
  }
  return { workspace };
};

const requireWorkspaceAdmin = async (workspaceId, userId) => {
  const result = await requireWorkspaceMember(workspaceId, userId);
  if (result.error) return result;
  if (!isAdmin(result.workspace, userId)) {
    return { error: { status: 403, message: "Only workspace admins can perform this action" } };
  }
  return result;
};

const requireWorkspaceOwner = async (workspaceId, userId) => {
  const result = await requireWorkspaceMember(workspaceId, userId);
  if (result.error) return result;
  if (!isSameId(result.workspace.owner, userId)) {
    return { error: { status: 403, message: "Only workspace owners can perform this action" } };
  }
  return result;
};

const getWorkspace = async (req, res) => {
  try {
    const result = await requireWorkspaceMember(req.params.workspaceId, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });

    const workspace = await populateWorkspace(result.workspace._id);
    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch workspace" });
  }
};

const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId is required" });

    const result = await requireWorkspaceAdmin(req.params.workspaceId, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });

    const { workspace } = result;
    const alreadyMember = isMember(workspace, userId);

    if (alreadyMember) {
      return res.status(400).json({ message: "User already a member" });
    }

    workspace.members.push(userId);
    await workspace.save();

    res.json(await populateWorkspace(workspace._id));
  } catch (err) {
    res.status(500).json({ message: "Failed to add member" });
  }
};

const getAllWorkspace = async (req, res) => {
  try {
    const userId = req.user._id;
    const workspaces = await Workspace.find({ members: userId })
      .populate("members", "fullName email avatar")
      .populate("admins", "fullName email avatar")
      .sort({ updatedAt: -1 });

    await Promise.all(workspaces.map((workspace) => ensureLegacyAdmin(workspace)));

    res.json(workspaces);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch workspaces" });
  }
};

const deleteWorkspace = async (req, res) => {
  try {
    const result = await requireWorkspaceAdmin(req.params.workspaceId, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });

    await Workspace.findByIdAndDelete(req.params.workspaceId);
    res.json({ message: "Workspace deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete workspace" });
  }
};

const createWorkspace = async (req, res) => {
  try {
    const { name, projectId } = req.body;
    const creatorId = req.user._id;

    const workspace = new Workspace({
      name: name || "New Workspace",
      projectId: projectId || null,
      owner: creatorId,
      members: [creatorId],
      admins: [creatorId],
    });

    await workspace.save();
    res.status(201).json(await populateWorkspace(workspace._id));
  } catch (err) {
    res.status(500).json({ message: "Failed to create workspace" });
  }
};

const removeMember = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;

    const result = await requireWorkspaceAdmin(workspaceId, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });

    const { workspace } = result;

    const removingSelf = isSameId(userId, req.user._id);
    const isLeavingAdmin = removingSelf && isAdmin(workspace, userId);
    const remainingAdmins = workspace.admins.filter((adminId) => !isSameId(adminId, userId));

    if (removingSelf) {
      if (isLeavingAdmin && !remainingAdmins.length) {
        return res.status(400).json({ message: "Assign another admin before leaving or delete workspace." });
      }
    } else {
      if (!remainingAdmins.length && workspace.admins.some((adminId) => isSameId(adminId, userId))) {
        return res.status(400).json({ message: "Workspace must have at least one admin" });
      }
    }

    workspace.members = workspace.members.filter((memberId) => !isSameId(memberId, userId));
    if (workspace.admins.some((adminId) => isSameId(adminId, userId))) {
      workspace.admins = remainingAdmins;
    }

    await workspace.save();

    res.json(await populateWorkspace(workspaceId));
  } catch (err) {
    res.status(500).json({ message: "Failed to remove member" });
  }
};

const updateWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name } = req.body;

    const result = await requireWorkspaceAdmin(workspaceId, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });

    if (name) result.workspace.name = name;
    await result.workspace.save();

    res.json(await populateWorkspace(workspaceId));
  } catch (err) {
    res.status(500).json({ message: "Failed to update workspace" });
  }
};

const updateAdmin = async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const { isAdmin: shouldBeAdmin } = req.body;

    const result = await requireWorkspaceAdmin(workspaceId, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });

    const { workspace } = result;
    if (!isMember(workspace, userId)) {
      return res.status(400).json({ message: "User must be a workspace member before becoming admin" });
    }

    if (shouldBeAdmin) {
      if (!workspace.admins.some((adminId) => isSameId(adminId, userId))) {
        workspace.admins.push(userId);
      }
    } else {
      if (isSameId(userId, req.user._id)) {
        return res.status(400).json({ message: "Admins cannot remove their own admin access" });
      }
      const nextAdmins = workspace.admins.filter((adminId) => !isSameId(adminId, userId));
      if (!nextAdmins.length) {
        return res.status(400).json({ message: "Workspace must have at least one admin" });
      }
      workspace.admins = nextAdmins;
    }

    await workspace.save();
    res.json(await populateWorkspace(workspaceId));
  } catch (err) {
    res.status(500).json({ message: "Failed to update admin rights" });
  }
};

const transferOwnership = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { newOwnerId } = req.body;

    const result = await requireWorkspaceOwner(workspaceId, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });

    const { workspace } = result;

    if (!isMember(workspace, newOwnerId)) {
      return res.status(400).json({ message: "New owner must be a member of the workspace" });
    }

    workspace.owner = newOwnerId;
    
    if (!workspace.admins.some((adminId) => isSameId(adminId, newOwnerId))) {
      workspace.admins.push(newOwnerId);
    }

    await workspace.save();
    res.json(await populateWorkspace(workspaceId));
  } catch (err) {
    res.status(500).json({ message: "Failed to transfer ownership" });
  }
};

const updateWorkspaceSettings = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { settings } = req.body;

    const result = await requireWorkspaceAdmin(workspaceId, req.user._id);
    if (result.error) return res.status(result.error.status).json({ message: result.error.message });

    if (settings) {
      result.workspace.settings = { ...result.workspace.settings, ...settings };
    }
    await result.workspace.save();

    res.json(await populateWorkspace(workspaceId));
  } catch (err) {
    res.status(500).json({ message: "Failed to update workspace settings" });
  }
};

module.exports = {
  getWorkspace,
  addMember,
  getAllWorkspace,
  deleteWorkspace,
  createWorkspace,
  updateWorkspace,
  removeMember,
  updateAdmin,
  transferOwnership,
  updateWorkspaceSettings,
};
