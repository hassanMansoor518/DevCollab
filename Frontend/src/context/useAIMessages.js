import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

const useAIMessages = create((set, get) => ({
  aiMessages: [],

  addMessage: (msg, isAI = false) => {
    const newMessage = {
      _id: uuidv4(),
      message: typeof msg === "string" ? msg : msg?.message || "",
      isAI,
    };

    set({ aiMessages: [...get().aiMessages, newMessage] });
  },

  addTempMessage: () => {
    const tempId = "temp-" + Date.now();

    const tempMsg = {
      _id: tempId,
      message: "AI is thinking...",
      isAI: true,
      isTemp: true,
    };

    set({ aiMessages: [...get().aiMessages, tempMsg] });

    return tempId;
  },

  replaceTempMessage: (tempId, realMessage) => {
    set({
      aiMessages: get().aiMessages.map((m) =>
        m._id === tempId
          ? {
            _id: Date.now().toString(),
            message: realMessage,
            isAI: true,
          }
          : m
      ),
    });
  },

  clearMessages: () => set({ aiMessages: [] }),
}));

export default useAIMessages;