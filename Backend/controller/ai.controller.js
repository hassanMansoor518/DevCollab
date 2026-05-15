import * as ai from '../services/ai.service.js';
import Message from '../model/message.model.js';
import Conversation from '../model/conversation.model.js';
import WorkspaceMessage from '../model/workspaceMessage.model.js';
import Workspace from '../model/workspace.model.js';
import User from '../model/user.model.js';
import { getReceiverSocketIds, io } from '../SocketIO/SocketServer.js';

export const getResult = async (req, res) => {
  try {
    const { prompt, conversationId } = req.query;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // =========================
    // 🔥 FIX: AI call safety
    // =========================
    let resultText;
    try {
      resultText = await ai.generateResult(prompt);
    } catch (aiError) {
      console.error("AI Service Failed:", aiError);

      return res.status(500).json({
        message: "AI service temporarily unavailable",
        error: aiError.message,
      });
    }

    // Ensure AI user exists
    let aiUser = await User.findOne({ email: 'ai@chatapp.local' });

    if (!aiUser) {
      aiUser = await User.create({
        fullName: 'AI Bot',
        email: 'ai@chatapp.local',
        password: '',
      });
    }

    const senderId = aiUser._id;

    // =========================
    // WORKSPACE FLOW
    // =========================
    if (conversationId) {
      const workspace = await Workspace.findById(conversationId);

      if (workspace) {
        const newMessage = new WorkspaceMessage({
          workspaceId: conversationId,
          senderId,
          message: resultText,
          isAI: true,
        });

        await newMessage.save();

        workspace.members.forEach((memberId) => {
          io.to(memberId.toString()).emit('newWorkspaceMessage', {
            message: newMessage,
            workspaceId: conversationId,
          });
        });

        return res.status(201).json(newMessage);
      }

      // =========================
      // DM CONVERSATION FLOW
      // =========================
      const conversation = await Conversation.findById(conversationId);

      if (conversation) {
        const receiverId = conversation.members.find(
          (m) => m.toString() !== req.user._id.toString()
        );

        const newMessage = new Message({
          senderId,
          receiverId,
          message: resultText,
          isAI: true,
        });

        conversation.messages.push(newMessage._id);

        await Promise.all([newMessage.save(), conversation.save()]);

        const socketIds = getReceiverSocketIds(receiverId.toString());

        socketIds?.forEach((sid) => {
          io.to(sid).emit('newMessage', {
            message: newMessage,
            conversationId: conversation._id.toString(),
          });
        });

        return res.status(201).json(newMessage);
      }
    }

    // =========================
    // FALLBACK FLOW
    // =========================
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const receiverId = req.user._id;

    let fallbackConversation = await Conversation.findOne({
      members: { $all: [senderId, receiverId] },
    });

    if (!fallbackConversation) {
      fallbackConversation = await Conversation.create({
        members: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: resultText,
      isAI: true,
    });

    fallbackConversation.messages.push(newMessage._id);

    await Promise.all([newMessage.save(), fallbackConversation.save()]);

    const socketIds = getReceiverSocketIds(receiverId.toString());

    socketIds?.forEach((sid) => {
      io.to(sid).emit('newMessage', {
        message: newMessage,
        conversationId: fallbackConversation._id.toString(),
      });
    });

    return res.status(201).json(newMessage);

  } catch (error) {
    console.error('Controller Error:', error);
    console.error('Stack:', error.stack);

    return res.status(500).json({
      message: 'Internal server error',
      error: error.message,
    });
  }
};

export const analyzeCode = async (req, res) => {
  try {
    const { code, filename, language } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code is required for analysis' });
    }

    const analysisResult = await ai.analyzeCode({ code, filename, language });
    
    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Analyze Code Error:', error);
    
    return res.status(500).json({
      message: 'AI code analysis temporarily unavailable',
      error: error.message,
    });
  }
};