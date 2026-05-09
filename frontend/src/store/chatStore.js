import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Chat Store — Zustand with localStorage persistence
 *
 * Manages conversation history per video, supporting:
 * - Session memory (last N messages sent to backend)
 * - Persistent chat across page refreshes
 * - Per-video chat isolation
 *
 * Scalability: localStorage is used for MVP. In production,
 * this would be backed by a server-side session store.
 */
const useChatStore = create(
  persist(
    (set, get) => ({
      // Map of videoId -> messages[]
      conversations: {},

      // Currently active video
      activeVideoId: null,

      // Get messages for a specific video
      getMessages: (videoId) => {
        return get().conversations[videoId] || [];
      },

      // Get last N messages for backend context
      getLastMessages: (videoId, count = 10) => {
        const messages = get().conversations[videoId] || [];
        return messages.slice(-count);
      },

      // Set active video
      setActiveVideo: (videoId) => {
        set({ activeVideoId: videoId });
      },

      // Add a message to the conversation
      addMessage: (videoId, message) => {
        set((state) => ({
          conversations: {
            ...state.conversations,
            [videoId]: [
              ...(state.conversations[videoId] || []),
              {
                ...message,
                id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                timestamp: Date.now(),
              },
            ],
          },
        }));
      },

      // Update the last message (for streaming)
      updateLastMessage: (videoId, updates) => {
        set((state) => {
          const messages = [...(state.conversations[videoId] || [])];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              ...updates,
            };
          }
          return {
            conversations: {
              ...state.conversations,
              [videoId]: messages,
            },
          };
        });
      },

      // Clear conversation for a video
      clearConversation: (videoId) => {
        set((state) => {
          const conversations = { ...state.conversations };
          delete conversations[videoId];
          return { conversations };
        });
      },

      // Clear all conversations
      clearAll: () => {
        set({ conversations: {}, activeVideoId: null });
      },
    }),
    {
      name: 'sherisense-chat-storage',
      version: 1,
    }
  )
);

export default useChatStore;
