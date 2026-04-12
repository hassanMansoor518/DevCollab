const express = require("express");
const router = express.Router();
const Invite = require("../model/invite.model");

// Send invite
router.post("/invite", async (req, res) => {
  const { senderId, receiverId, role } = req.body;
  try {
    const existing = await Invite.findOne({ sender: senderId, receiver: receiverId, status: "pending" });
    if (existing) return res.status(400).json({ message: "Invite already sent" });

    const invite = await Invite.create({ sender: senderId, receiver: receiverId, role, status: "pending" });
    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept invite
router.post("/invite/accept", async (req, res) => {
  const { inviteId } = req.body;
  try {
    const invite = await Invite.findByIdAndUpdate(inviteId, { status: "accepted" }, { new: true });
    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cancel invite
router.post("/invite/cancel", async (req, res) => {
  const { inviteId } = req.body;
  try {
    const invite = await Invite.findByIdAndUpdate(inviteId, { status: "cancelled" }, { new: true });
    res.json(invite);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active team members (sender OR receiver view)
router.get("/team/active/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // All accepted invites where user is either sender or receiver
    const invites = await Invite.find({ 
        status: "accepted",
        $or: [{ sender: userId }, { receiver: userId }]
    }).populate("sender receiver", "fullName email");

    // Map members: if current user is sender, show receiver; if current user is receiver, show sender
    const activeMembers = invites.map(inv => 
        inv.sender._id.toString() === userId ? inv.receiver : inv.sender
    );

    res.json(activeMembers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get pending invites for receiver
router.get("/team/pending/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const invites = await Invite.find({ receiver: userId, status: "pending" })
      .populate("sender", "fullName email");
    res.json(invites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

