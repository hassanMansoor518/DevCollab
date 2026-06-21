import { useState } from "react";
import axios from "axios";
import useAIMessages from "../context/useAIMessages";
import useProjectStore from "../zustand/useProjectStore";
import useConversation from "../zustand/useConversation.js";

const useSendAiMessage = () => {
  const [loading, setLoading] = useState(false);

  const { addMessage: addAiPageMessage, addTempMessage, replaceTempMessage } = useAIMessages();
  const { selectedProject, indexProject } = useProjectStore();
  const { selectedConversation, selectedWorkspace, messages, setMessage } = useConversation();

  const sendAiMessage = async (prompt, isAiPage = false) => {
    if (!prompt.trim()) return;

    // ====== CASE 1: DEDICATED AI ASSISTANT PAGE ======
    if (isAiPage) {
      if (!selectedProject) {
        addAiPageMessage(prompt, false);
        const tempId = addTempMessage();
        replaceTempMessage(tempId, "Please select a project first from the top dropdown.");
        return;
      }

      setLoading(true);
      addAiPageMessage(prompt, false);
      const tempId = addTempMessage();

      try {
        if (!selectedProject.projectStructure) {
          replaceTempMessage(tempId, "Analyzing repository structure for the first time... ⏳");
          await indexProject(selectedProject._id);
        }

        const res = await axios.get(
          "/api/ai/get-result",
          {
            params: { 
              prompt, 
              projectId: selectedProject._id 
            },
          }
        );

        const aiText = res.data?.message;
        replaceTempMessage(tempId, aiText || "No response from AI.");

      } catch (error) {
        console.error("AI Error:", error);
        const errMsg = error.response?.data?.error?.message || error.response?.data?.message || "Failed to get AI response. Please ensure the repository is connected and indexed.";
        replaceTempMessage(
          tempId,
          errMsg
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // ====== CASE 2: REGULAR CHAT PAGE (DM OR WORKSPACE) ======
    const activeChatId = selectedConversation?._id || selectedWorkspace?._id;
    if (!activeChatId) {
      console.warn("No active conversation or workspace to send AI prompt");
      return;
    }

    setLoading(true);

    const authUser = JSON.parse(localStorage.getItem("ChatApp"));
    const tempUserMsg = {
      _id: "temp-" + Date.now(),
      senderId: {
        _id: authUser?.user?._id || "user",
        fullName: authUser?.user?.fullName || "You"
      },
      message: `@ai ${prompt}`,
      createdAt: new Date().toISOString(),
    };
    
    // We append the user's prompt directly in the stream
    const conversationMessages = Array.isArray(messages) ? messages : [];
    setMessage([...conversationMessages, tempUserMsg]);

    // Append AI placeholder
    const tempAiId = "temp-ai-" + Date.now();
    const tempAiMsg = {
      _id: tempAiId,
      isAI: true,
      message: "Gemini is typing... ⚡",
      createdAt: new Date().toISOString(),
    };
    
    setMessage([...conversationMessages, tempUserMsg, tempAiMsg]);

    try {
      const res = await axios.get(
        "/api/ai/get-result",
        {
          params: {
            prompt,
            conversationId: activeChatId,
          },
        }
      );

      // Once loaded, update state to replace the placeholder with authentic server message
      const store = useConversation.getState();
      const currentMsgs = Array.isArray(store.messages) ? store.messages : [];
      const updatedMessages = currentMsgs.map((m) =>
        m._id === tempAiId ? res.data : m
      );
      store.setMessage(updatedMessages);

    } catch (error) {
      console.error("Chat AI Error:", error);
      const errMsg = error.response?.data?.error?.message || error.response?.data?.message || "Failed to fetch Gemini response. Please try again.";
      const store = useConversation.getState();
      const currentMsgs = Array.isArray(store.messages) ? store.messages : [];
      const updatedMessages = currentMsgs.map((m) =>
        m._id === tempAiId 
          ? { ...m, message: `⚠️ ${errMsg}` } 
          : m
      );
      store.setMessage(updatedMessages);
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendAiMessage };
};

export default useSendAiMessage;