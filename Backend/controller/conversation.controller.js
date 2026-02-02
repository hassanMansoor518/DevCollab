const Conversation = require('../model/conversation.model');

// GET or CREATE a conversation between current user and given user id
async function getOrCreateConversation(req, res) {
  try {
    const otherUserId = req.params.id;
    const currentUserId = req.user._id;

    if (!otherUserId) {
      return res.status(400).json({ message: 'Missing user id' });
    }

    let conversation = await Conversation.findOne({ members: { $all: [currentUserId, otherUserId] } });

    if (!conversation) {
      conversation = await Conversation.create({ members: [currentUserId, otherUserId] });
    }

    // populate messages for convenience
    conversation = await Conversation.findById(conversation._id).populate('messages');

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { getOrCreateConversation };