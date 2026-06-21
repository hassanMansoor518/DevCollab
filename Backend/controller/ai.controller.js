import * as ai from '../services/ai.service.js';
import Message from '../model/message.model.js';
import Conversation from '../model/conversation.model.js';
import WorkspaceMessage from '../model/workspaceMessage.model.js';
import Workspace from '../model/workspace.model.js';
import User from '../model/user.model.js';
import Project from '../model/project.model.js';
import AiMessage from '../model/aiMessage.model.js';
import { getReceiverSocketIds, io } from '../SocketIO/SocketServer.js';

export const getResult = async (req, res) => {
  try {
    const { prompt, conversationId, projectId } = req.query;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = req.user._id;

    // =========================
    // 🔥 PERSIST USER MESSAGE
    // =========================
    if (projectId) {
      await AiMessage.create({
        projectId,
        userId,
        role: 'user',
        message: prompt,
      });
    }

    // =========================
    // 🔥 CONTEXT INJECTION
    // =========================
    let projectContext = null;
    let chatHistory = [];

    if (projectId) {
      const project = await Project.findById(projectId);
      if (project) {
        projectContext = {
          name: project.projectName,
          githubRepo: project.githubRepo,
          structure: project.projectStructure,
          summary: project.indexedCodeSummary,
        };

        // Fetch recent history for memory (limit to 10 for tokens)
        chatHistory = await AiMessage.find({ projectId, userId })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        chatHistory = chatHistory.reverse();
      }
    }

    let resultText;
    try {
      resultText = await ai.generateResult(prompt, projectContext, chatHistory, req.user?.aiSettings);
    } catch (aiError) {
      console.error("AI Service Failed:", aiError);

      return res.status(500).json({
        success: false,
        error: {
          message: "AI service temporarily unavailable",
          type: "AIServiceError",
          details: aiError.message,
        }
      });
    }

    // =========================
    // 🔥 PERSIST AI RESPONSE
    // =========================
    if (projectId) {
      const aiResponse = await AiMessage.create({
        projectId,
        userId,
        role: 'assistant',
        message: resultText,
      });

      return res.status(201).json({
        message: resultText,
        _id: aiResponse._id,
        isAI: true,
        role: 'assistant'
      });
    }

    // Ensure AI user exists (for standard chat flows)
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
      success: false,
      error: {
        message: 'Internal server error',
        type: 'InternalServerError',
        details: error.message,
      }
    });
  }
};

export const getChatHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user._id;

    if (!projectId) {
      return res.status(400).json({ message: 'Project ID is required' });
    }

    const messages = await AiMessage.find({ projectId, userId })
      .sort({ createdAt: 1 })
      .lean();

    // Map for frontend compatibility
    const formattedMessages = messages.map(msg => ({
      _id: msg._id,
      message: msg.message,
      isAI: msg.role === 'assistant',
      role: msg.role,
      createdAt: msg.createdAt
    }));

    res.status(200).json(formattedMessages);
  } catch (error) {
    console.error('Get Chat History Error:', error);
    res.status(500).json({ message: 'Failed to fetch chat history' });
  }
};

export const analyzeCode = async (req, res) => {
  try {
    const { code, filename, language } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Code is required for analysis',
          type: 'ValidationError'
        }
      });
    }

    const analysisResult = await ai.analyzeCode({ code, filename, language }, req.user?.aiSettings);

    return res.status(200).json(analysisResult);
  } catch (error) {
    console.error('Analyze Code Error:', error);

    return res.status(500).json({
      success: false,
      error: {
        message: 'AI code analysis temporarily unavailable',
        type: 'AIServiceError',
        details: error.message,
      }
    });
  }
};

export const fixIssue = async (req, res) => {
  try {
    const { code, filename, language, issueTitle, issueDescription } = req.body;

    if (!code || !issueTitle) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Code and issueTitle are required',
          type: 'ValidationError'
        }
      });
    }

    const result = await ai.fixCodeIssue({ code, filename, language, issueTitle, issueDescription }, req.user?.aiSettings);

    return res.status(200).json(result);
  } catch (error) {
    console.error('Fix Issue Error:', error);

    return res.status(500).json({
      success: false,
      error: {
        message: 'Failed to apply code fix via AI',
        type: 'AIServiceError',
        details: error.message,
      }
    });
  }
}