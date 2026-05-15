// import { create } from "zustand";

// const useConversation = create((set) => ({
//   // Selected conversation
//   selectedConversation: null,
//   setSelectedConversation: (selectedConversation) => set({ selectedConversation }),

//   // Messages
//   messages: [],
//   setMessage: (messages) => set({ messages }),

//   // Typing state per conversationId
//   typingState: {},
//   setTypingState: (conversationId, typing, userId) =>
//     set((state) => ({
//       typingState: {
//         ...(state.typingState || {}),
//         [conversationId]: { typing, userId },
//       },
//     })),
//   clearTypingState: (conversationId) =>
//     set((state) => {
//       const copy = { ...(state.typingState || {}) };
//       delete copy[conversationId];
//       return { typingState: copy };
//     }),

//   // ✅ Online users
//   onlineUsers: [],
//   setOnlineUsers: (users) => set({ onlineUsers: users }),
// }));

// export default useConversation;

import { create } from "zustand";

const useConversation = create((set, get) => ({
  selectedConversation: null,
  selectedWorkspace: null,
  messages: [],

  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),

  setSelectedWorkspace: (workspace) =>
    set({ selectedWorkspace: workspace }),

  setMessage: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
}));

export default useConversation;