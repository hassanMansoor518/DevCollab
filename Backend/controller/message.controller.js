const Message = require('../model/message.model');
const Conversation = require('../model/conversation.model');
const { getReceiverSocketIds, io } = require('../SocketIO/SocketServer');

async function sendMessage(req, res) {
    try {
        const { message } = req.body;
        const { id: conversationId } = req.params;
        const senderId = req.user._id;

        // Find conversation by id
        let conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        // Determine the receiver (other participant in conversation)
        const receiverId = conversation.members.find((m) => m.toString() !== senderId.toString());
        if (!receiverId) {
            return res.status(400).json({ message: 'No receiver found in conversation' });
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            message,
        });

        conversation.messages.push(newMessage._id);

        await Promise.all([conversation.save(), newMessage.save()]); // run parallel

        // emit socket event to receiver if online
        try {
            const receiverSocketIds = getReceiverSocketIds(receiverId.toString());
            if (receiverSocketIds && receiverSocketIds.length) {
                receiverSocketIds.forEach((sid) => io.to(sid).emit('newMessage', { message: newMessage, conversationId: conversation._id.toString() }));
            }
        } catch (err) {
            console.log('Socket emit error:', err);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sending message", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}


const getMessage = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId).populate('messages');
    if (!conversation) {
      return res.status(404).json([]);
    }

    // Ensure requester is a member of the conversation
    const isMember = conversation.members.some((m) => m.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.status(200).json(conversation.messages);
  } catch (error) {
    console.log("Error in getMessage", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Update a direct conversation message (only sender)
const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    const existing = await Message.findById(messageId);
    if (!existing) return res.status(404).json({ message: 'Message not found' });

    if (existing.senderId.toString() !== userId.toString()) return res.status(403).json({ message: 'Forbidden' });

    existing.message = message;
    await existing.save();

    // notify receiver(s)
    try {
      const receiverSocketIds = getReceiverSocketIds(existing.receiverId.toString());
      if (receiverSocketIds && receiverSocketIds.length) {
        receiverSocketIds.forEach((sid) => io.to(sid).emit('updateMessage', { message: existing }));
      }
    } catch (err) {
      console.log('Socket emit error on updateMessage', err);
    }

    res.json(existing);
  } catch (err) {
    console.log('Error in updateMessage', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a direct conversation message (only sender)
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const existing = await Message.findById(messageId);
    if (!existing) return res.status(404).json({ message: 'Message not found' });

    if (existing.senderId.toString() !== userId.toString()) return res.status(403).json({ message: 'Forbidden' });

    // remove message document
    await Message.findByIdAndDelete(messageId);

    // remove from conversation messages array
    await Conversation.findOneAndUpdate({ messages: messageId }, { $pull: { messages: messageId } });

    // notify receiver
    try {
      const receiverSocketIds = getReceiverSocketIds(existing.receiverId.toString());
      if (receiverSocketIds && receiverSocketIds.length) {
        receiverSocketIds.forEach((sid) => io.to(sid).emit('deleteMessage', { messageId }));
      }
    } catch (err) {
      console.log('Socket emit error on deleteMessage', err);
    }

    res.json({ message: 'Deleted' });
  } catch (err) {
    console.log('Error in deleteMessage', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


module.exports = { sendMessage, getMessage, updateMessage, deleteMessage };