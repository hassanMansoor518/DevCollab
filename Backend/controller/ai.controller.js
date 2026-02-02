
import * as ai from '../services/ai.service.js';
import Message from '../model/message.model.js';
import Conversation from '../model/conversation.model.js';
import User from '../model/user.model.js';
import { getReceiverSocketId, io } from '../SocketIO/SocketServer.js';




export const getResult = async (req, res) => {
    try {
        const { prompt, conversationId } = req.query;

        // Generate AI text
        const resultText = await ai.generateResult(prompt);

        // Ensure an AI user exists
        let aiUser = await User.findOne({ email: 'ai@chatapp.local' });
        if (!aiUser) {
            aiUser = await User.create({ fullName: 'AI Bot', email: 'ai@chatapp.local', password: '' });
        }

        const senderId = aiUser._id;

        // Prefer the provided conversation (this should be the human-human conversation)
        let conversation = null;
        if (conversationId) {
            conversation = await Conversation.findById(conversationId);
        }

        if (conversation) {
            // Determine the other human in the conversation (receiver)
            const receiverId = conversation.members.find((m) => m.toString() !== req.user._id.toString());

            // Create and save AI message attached to the same conversation
            const newMessage = new Message({ senderId, receiverId, message: resultText });
            conversation.messages.push(newMessage._id);
            await Promise.all([newMessage.save(), conversation.save()]);

            // Emit socket event to the other human (if online)
            try {
                const receiverSocketId = getReceiverSocketId(receiverId.toString());
                if (receiverSocketId) io.to(receiverSocketId).emit('newMessage', { message: newMessage, conversationId: conversation._id.toString() });
            } catch (err) {
                console.log('Socket emit error (AI):', err);
            }

            return res.status(201).json(newMessage);
        }

        // If no conversation provided/found, fallback to AI-human conversation
        const receiverId = req.user._id; // human who triggered
        let fallbackConversation = await Conversation.findOne({ members: { $all: [senderId, receiverId] } });
        if (!fallbackConversation) {
            fallbackConversation = await Conversation.create({ members: [senderId, receiverId] });
        }

        const newMessage = new Message({ senderId, receiverId, message: resultText });
        fallbackConversation.messages.push(newMessage._id);
        await Promise.all([newMessage.save(), fallbackConversation.save()]);

        // Emit socket to the human who triggered (if online)
        try {
            const receiverSocketId = getReceiverSocketId(receiverId.toString());
            if (receiverSocketId) io.to(receiverSocketId).emit('newMessage', { message: newMessage, conversationId: fallbackConversation._id.toString() });
        } catch (err) {
            console.log('Socket emit error (AI-fallback):', err);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Error in AI getResult:', error);
        res.status(500).send({ message: error.message });
    }
}


