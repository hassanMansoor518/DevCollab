import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

const useAIMessages = create((set, get) => ({
  aiMessages: [],
  loading: false,

  fetchHistory: async (projectId) => {
    if (!projectId) return;
    set({ loading: true });
    try {
      const res = await axios.get(`/api/ai/history/${projectId}`);
      set({ aiMessages: res.data });
    } catch (err) {
      console.error("Fetch AI History Error:", err);
    } finally {
      set({ loading: false });
    }
  },

  addMessage: (msg, isAI = false) => {
    const text = typeof msg === "string" ? msg : msg?.message || "";
    const newMessage = {
      _id: uuidv4(),
      message: text,
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
    const text = typeof realMessage === "string" ? realMessage : realMessage?.message || "";
    set({
      aiMessages: get().aiMessages.map((m) =>
        m._id === tempId
          ? {
            _id: Date.now().toString(),
            message: text,
            isAI: true,
          }
          : m
      ),
    });
  },

  clearMessages: () => set({ aiMessages: [] }),
}));

export default useAIMessages;