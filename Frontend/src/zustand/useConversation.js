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

const useConversation = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),
  messages: [],
  setMessage: (messages) => set({ messages }),
}));
export default useConversation;