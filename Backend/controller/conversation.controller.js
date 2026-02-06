const Conversation = require('../model/conversation.model');

async function getOrCreateConversation(req, res) {
  try {
    const otherUserId = req.params.id;
    const currentUserId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ message: 'Missing user id' });
    }

    let conversation = await Conversation.findOne({
      members: { $all: [currentUserId, otherUserId] }
    })
      .populate("members", "fullName email") // ✅ ADD THIS
      .populate("messages");                 // keep this

    if (!conversation) {
      conversation = await Conversation.create({
        members: [currentUserId, otherUserId]
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("members", "fullName email") // ✅ ADD THIS
        .populate("messages");
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { getOrCreateConversation };
