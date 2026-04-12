const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["pending", "accepted", "cancelled"], default: "pending" },
  role: { type: String, enum: ["Developer", "Admin", "Viewer"], default: "Developer" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Invite", inviteSchema);
