import { create } from "zustand";
import { type ConversationMessage } from "@/types/conversation";

interface ConversationState {
  messages: ConversationMessage[];
  onMessageAdded?: (message: ConversationMessage) => void;

  // Actions
  setOnMessageAdded: (
    callback?: (message: ConversationMessage) => void,
  ) => void;
  clearMessages: () => void;
  addMessage: (
    message: Omit<ConversationMessage, "createdAt" | "updatedAt">,
  ) => void;
  updateLastMessage: (
    role: "user" | "assistant",
    updates: Partial<ConversationMessage>,
  ) => void;
  appendToLastMessage: (role: "user" | "assistant", text: string) => void;
  finalizeLastMessage: (role: "user" | "assistant") => void;
  removeEmptyLastMessage: (role: "user" | "assistant") => void;
  injectMessage: (message: {
    role: "user" | "assistant" | "system";
    content: string | React.ReactNode;
  }) => void;
}

const sortByCreatedAt = (
  a: ConversationMessage,
  b: ConversationMessage,
): number => {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

const filterEmptyMessages = (
  messages: ConversationMessage[],
): ConversationMessage[] => {
  return messages.filter((message, index, array) => {
    if (typeof message.content === "string") {
      if (message.content) return true;
    } else {
      // For ReactNode content, always keep it
      return true;
    }

    // For empty string messages, check if there's a non-empty message with the same role following it
    const nextMessageWithSameRole = array
      .slice(index + 1)
      .find(
        (m) =>
          m.role === message.role &&
          (typeof m.content === "string" ? m.content : true),
      );

    return !nextMessageWithSameRole;
  });
};

const mergeMessages = (
  messages: ConversationMessage[],
): ConversationMessage[] => {
  const mergedMessages: ConversationMessage[] = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMessage = messages[i];
    const lastMerged = mergedMessages[mergedMessages.length - 1];

    const timeDiff = lastMerged
      ? Math.abs(
          new Date(currentMessage.createdAt).getTime() -
            new Date(lastMerged.createdAt).getTime(),
        )
      : Infinity;

    const shouldMerge =
      lastMerged &&
      lastMerged.role === currentMessage.role &&
      currentMessage.role !== "system" && // Never merge system messages
      timeDiff < 30000; // 30 seconds threshold

    if (shouldMerge) {
      mergedMessages[mergedMessages.length - 1] = {
        ...lastMerged,
        content: `${lastMerged.content} ${currentMessage.content}`,
        updatedAt: currentMessage.updatedAt || currentMessage.createdAt,
        final: currentMessage.final !== false,
      };
    } else {
      mergedMessages.push({ ...currentMessage });
    }
  }

  return mergedMessages;
};

export const useConversationStore = create<ConversationState>((set) => ({
  messages: [],
  onMessageAdded: undefined,

  setOnMessageAdded: (callback) => set({ onMessageAdded: callback }),

  clearMessages: () => set({ messages: [] }),

  addMessage: (messageData) => {
    const now = new Date();
    const message: ConversationMessage = {
      ...messageData,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    set((state) => {
      const updatedMessages = [...state.messages, message];
      const processedMessages = mergeMessages(
        filterEmptyMessages(updatedMessages.sort(sortByCreatedAt)),
      );

      state.onMessageAdded?.(message);
      return { messages: processedMessages };
    });
  },

  updateLastMessage: (role, updates) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessageIndex = messages.findLastIndex(
        (msg) => msg.role === role,
      );

      if (lastMessageIndex === -1) return state;

      const updatedMessage = {
        ...messages[lastMessageIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      messages[lastMessageIndex] = updatedMessage;
      const processedMessages = mergeMessages(
        filterEmptyMessages(messages.sort(sortByCreatedAt)),
      );

      state.onMessageAdded?.(updatedMessage);
      return { messages: processedMessages };
    });
  },

  appendToLastMessage: (role, text) => {
    const now = new Date();
    set((state) => {
      const messages = [...state.messages];
      const lastMessageIndex = messages.findLastIndex(
        (msg) => msg.role === role,
      );

      if (lastMessageIndex === -1) {
        // No existing message, create new one
        const newMessage: ConversationMessage = {
          role,
          content: text,
          final: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        const updatedMessages = [...messages, newMessage];
        const processedMessages = mergeMessages(
          filterEmptyMessages(updatedMessages.sort(sortByCreatedAt)),
        );

        state.onMessageAdded?.(newMessage);
        return { messages: processedMessages };
      }

      const lastMessage = messages[lastMessageIndex];
      const isRecent =
        now.getTime() - new Date(lastMessage.createdAt).getTime() < 10000;

      let updatedMessage: ConversationMessage;

      if (!lastMessage.content) {
        // Replace empty message
        updatedMessage = {
          ...lastMessage,
          content: text,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
      } else if (isRecent) {
        // Append to recent message
        updatedMessage = {
          ...lastMessage,
          content: lastMessage.content + text,
          updatedAt: now.toISOString(),
        };
      } else {
        // Create new message
        const newMessage: ConversationMessage = {
          role,
          content: text,
          final: false,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        const updatedMessages = [...messages, newMessage];
        const processedMessages = mergeMessages(
          filterEmptyMessages(updatedMessages.sort(sortByCreatedAt)),
        );

        state.onMessageAdded?.(newMessage);
        return { messages: processedMessages };
      }

      messages[lastMessageIndex] = updatedMessage;
      const processedMessages = mergeMessages(
        filterEmptyMessages(messages.sort(sortByCreatedAt)),
      );

      return { messages: processedMessages };
    });
  },

  finalizeLastMessage: (role) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessageIndex = messages.findLastIndex(
        (msg) => msg.role === role,
      );

      if (lastMessageIndex === -1) return state;

      const lastMessage = messages[lastMessageIndex];

      if (!lastMessage.content) {
        // Remove empty message
        messages.splice(lastMessageIndex, 1);
      } else {
        // Finalize message
        messages[lastMessageIndex] = {
          ...lastMessage,
          final: true,
          updatedAt: new Date().toISOString(),
        };
        state.onMessageAdded?.(messages[lastMessageIndex]);
      }

      const processedMessages = mergeMessages(
        filterEmptyMessages(messages.sort(sortByCreatedAt)),
      );

      return { messages: processedMessages };
    });
  },

  removeEmptyLastMessage: (role) => {
    set((state) => {
      const messages = [...state.messages];
      const lastMessageIndex = messages.findLastIndex(
        (msg) => msg.role === role,
      );

      if (lastMessageIndex === -1) return state;

      const lastMessage = messages[lastMessageIndex];
      if (!lastMessage.content) {
        messages.splice(lastMessageIndex, 1);
        const processedMessages = mergeMessages(
          filterEmptyMessages(messages.sort(sortByCreatedAt)),
        );
        return { messages: processedMessages };
      }

      return state;
    });
  },

  injectMessage: (messageData) => {
    const now = new Date();
    const message: ConversationMessage = {
      role: messageData.role,
      content: messageData.content,
      final: true,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    set((state) => {
      const updatedMessages = [...state.messages, message];
      const processedMessages = mergeMessages(
        filterEmptyMessages(updatedMessages.sort(sortByCreatedAt)),
      );

      state.onMessageAdded?.(message);
      return { messages: processedMessages };
    });
  },
}));
