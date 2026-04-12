const express = require("express");
const router = express.Router();
const {
  getWorkspace,
  addMember,
  getAllWorkspace
} = require("../controller/workspace.controller");


router.get("/all-workspace", getAllWorkspace); // specific route first
router.get("/:workspaceId", getWorkspace);     // dynamic route last
router.post("/:workspaceId/add-member", addMember);

module.exports = router;