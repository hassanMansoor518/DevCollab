const Conversation = require('../model/conversation.model');
const Message = require('../model/message.model');

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
      .populate("members", "fullName email avatar")
      .populate("messages");

    if (!conversation) {
      conversation = await Conversation.create({
        members: [currentUserId, otherUserId],
        userSettings: {
          [currentUserId]: { isPinned: false, isMuted: false, isBlocked: false },
          [otherUserId]: { isPinned: false, isMuted: false, isBlocked: false }
        }
      });

      conversation = await Conversation.findById(conversation._id)
        .populate("members", "fullName email avatar")
        .populate("messages");
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error('Error in getOrCreateConversation:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function updateUserSettings(req, res) {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user._id.toString();
    const { isPinned, isMuted, isBlocked } = req.body;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.members.some(member => member.toString() === currentUserId)) {
      return res.status(403).json({ message: 'Unauthorized access to this conversation' });
    }

    // Initialize map if missing
    if (!conversation.userSettings) {
      conversation.userSettings = new Map();
    }
    
    // Get existing settings or create new
    const currentSettings = conversation.userSettings.get(currentUserId) || {
      isPinned: false,
      isMuted: false,
      isBlocked: false
    };

    // Update settings
    if (isPinned !== undefined) currentSettings.isPinned = isPinned;
    if (isMuted !== undefined) currentSettings.isMuted = isMuted;
    if (isBlocked !== undefined) currentSettings.isBlocked = isBlocked;

    conversation.userSettings.set(currentUserId, currentSettings);
    
    await conversation.save();
    
    // Return the updated conversation populated
    const updatedConversation = await Conversation.findById(conversationId)
      .populate("members", "fullName email avatar")
      .populate("messages");

    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

async function clearConversationHistory(req, res) {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    if (!conversation.members.some(member => member.toString() === currentUserId)) {
      return res.status(403).json({ message: 'Unauthorized access to this conversation' });
    }

    // Delete all messages that belong to this conversation
    if (conversation.messages && conversation.messages.length > 0) {
      await Message.deleteMany({ _id: { $in: conversation.messages } });
    }

    // Clear the array
    conversation.messages = [];
    await conversation.save();

    const updatedConversation = await Conversation.findById(conversationId)
      .populate("members", "fullName email avatar")
      .populate("messages");

    res.status(200).json(updatedConversation);
  } catch (error) {
    console.error('Error in clearConversationHistory:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = { getOrCreateConversation, updateUserSettings, clearConversationHistory };
