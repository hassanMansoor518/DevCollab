const express = require("express");
const router = express.Router();

const protectRoute = require("../middleware/secureRoute");

const {
  getWorkspace,
  addMember,
  getAllWorkspace,
  deleteWorkspace, // ✅ ADD THIS
} = require("../controller/workspace.controller");

const {
  createWorkspace,
  updateWorkspace,
  removeMember,
} = require("../controller/workspace.controller");

// Get all workspaces for logged-in user
router.get("/all-workspace", protectRoute, getAllWorkspace);

// Create new workspace
router.post("/", protectRoute, createWorkspace);

// Get single workspace
router.get("/:workspaceId", protectRoute, getWorkspace);

// Add member to workspace
router.post("/:workspaceId/add-member", protectRoute, addMember);

// ❌ DELETE workspace (NEW)
router.delete("/:workspaceId", protectRoute, deleteWorkspace);

// Remove member from workspace
router.delete("/:workspaceId/member/:userId", protectRoute, removeMember);

// Update workspace (rename)
router.put("/:workspaceId", protectRoute, updateWorkspace);

module.exports = router;