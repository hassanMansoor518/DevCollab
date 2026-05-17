import { useState } from "react";
import axios from "axios";
import useAIMessages from "../context/useAIMessages";
import useProjectStore from "../zustand/useProjectStore";

const useSendAiMessage = () => {
  const [loading, setLoading] = useState(false);

  const { addMessage, addTempMessage, replaceTempMessage } = useAIMessages();
  const { selectedProject, indexProject } = useProjectStore();

  const sendAiMessage = async (prompt) => {
    if (!prompt.trim()) return;

    if (!selectedProject) {
      addMessage(prompt, false);
      const tempId = addTempMessage();
      replaceTempMessage(tempId, "Please select a project first from the top dropdown.");
      return;
    }

    setLoading(true);

    // 1. user message
    addMessage(prompt, false);

    // 2. temp AI message
    const tempId = addTempMessage();

    try {
      // Auto-index if structure is missing
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
      replaceTempMessage(
        tempId,
        "Failed to get AI response. Please ensure the repository is connected and indexed."
      );
    } finally {
      setLoading(false);
    }
  };

  return { loading, sendAiMessage };
};

export default useSendAiMessage;