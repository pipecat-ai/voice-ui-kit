import {
  type ConversationMessage,
  type ConversationMessagePart,
} from "@/types/conversation";
import { create } from "zustand";

interface ConversationState {
  messages: ConversationMessage[];
  messageCallbacks: Map<string, (message: ConversationMessage) => void>;
  // Store separate text streams for LLM and TTS
  llmTextStreams: Map<string, string>; // messageId -> accumulated LLM text
  ttsTextStreams: Map<string, string>; // messageId -> accumulated TTS text

  // Actions
  registerMessageCallback: (
    id: string,
    callback?: (message: ConversationMessage) => void,
  ) => void;
  unregisterMessageCallback: (id: string) => void;
  clearMessages: () => void;
  addMessage: (
    message: Omit<ConversationMessage, "createdAt" | "updatedAt">,
  ) => void;
  updateLastMessage: (
    role: "user" | "assistant",
    updates: Partial<ConversationMessage>,
  ) => void;
  finalizeLastMessage: (role: "user" | "assistant") => void;
  removeEmptyLastMessage: (role: "user" | "assistant") => void;
  injectMessage: (message: {
    role: "user" | "assistant" | "system";
    parts: ConversationMessagePart[];
  }) => void;
  upsertUserTranscript: (
    text: string | React.ReactNode,
    final: boolean,
  ) => void;
  updateAssistantText: (
    text: string,
    final: boolean,
    source: "llm" | "tts",
  ) => void;
  startAssistantLlmStream: () => void;
}

export const sortByCreatedAt = (
  a: ConversationMessage,
  b: ConversationMessage,
): number => {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
};

export const isMessageEmpty = (message: ConversationMessage): boolean => {
  const parts = message.parts || [];
  if (parts.length === 0) return true;
  return parts.every((p) =>
    typeof p.text === "string" ? p.text.trim().length === 0 : false,
  );
};

export const filterEmptyMessages = (
  messages: ConversationMessage[],
): ConversationMessage[] => {
  return messages.filter((message, index, array) => {
    if (!isMessageEmpty(message)) return true;

    // For empty messages, keep only if no following non-empty message with same role
    const nextMessageWithSameRole = array
      .slice(index + 1)
      .find((m) => m.role === message.role && !isMessageEmpty(m));

    return !nextMessageWithSameRole;
  });
};

export const mergeMessages = (
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
      currentMessage.role !== "system" &&
      timeDiff < 30000;

    if (shouldMerge) {
      mergedMessages[mergedMessages.length - 1] = {
        ...lastMerged,
        parts: [...(lastMerged.parts || []), ...(currentMessage.parts || [])],
        updatedAt: currentMessage.updatedAt || currentMessage.createdAt,
        final: currentMessage.final !== false,
      };
    } else {
      mergedMessages.push({ ...currentMessage });
    }
  }

  return mergedMessages;
};

// Helper function to call all registered callbacks
const callAllMessageCallbacks = (
  callbacks: Map<string, (message: ConversationMessage) => void>,
  message: ConversationMessage,
) => {
  callbacks.forEach((callback) => {
    try {
      callback(message);
    } catch (error) {
      console.error("Error in message callback:", error);
    }
  });
};

export const useConversationStore = create<ConversationState>()((set) => ({
  messages: [],
  messageCallbacks: new Map(),
  llmTextStreams: new Map(),
  ttsTextStreams: new Map(),

  registerMessageCallback: (id, callback) =>
    set((state) => {
      const newState = { ...state };
      newState.messageCallbacks.set(id, callback || (() => {}));
      return newState;
    }),

  unregisterMessageCallback: (id) =>
    set((state) => {
      const newState = { ...state };
      newState.messageCallbacks.delete(id);
      return newState;
    }),

  clearMessages: () =>
    set({
      messages: [],
      llmTextStreams: new Map(),
      ttsTextStreams: new Map(),
    }),

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

      callAllMessageCallbacks(state.messageCallbacks, message);
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
      } as ConversationMessage;

      messages[lastMessageIndex] = updatedMessage;
      const processedMessages = mergeMessages(
        filterEmptyMessages(messages.sort(sortByCreatedAt)),
      );

      callAllMessageCallbacks(state.messageCallbacks, updatedMessage);
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

      // Check if message is empty in both parts and text streams
      const hasTextInStreams =
        state.llmTextStreams.get(lastMessage.createdAt) ||
        state.ttsTextStreams.get(lastMessage.createdAt);

      if (isMessageEmpty(lastMessage) && !hasTextInStreams) {
        // Remove empty message only if it has no text in streams either
        messages.splice(lastMessageIndex, 1);
      } else {
        // Finalize message and its last part
        const parts = [...(lastMessage.parts || [])];
        if (parts.length > 0) {
          parts[parts.length - 1] = {
            ...parts[parts.length - 1],
            final: true,
          };
        }
        messages[lastMessageIndex] = {
          ...lastMessage,
          parts,
          final: true,
          updatedAt: new Date().toISOString(),
        };
        callAllMessageCallbacks(
          state.messageCallbacks,
          messages[lastMessageIndex],
        );
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
      if (isMessageEmpty(lastMessage)) {
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
      final: true,
      parts: [...messageData.parts],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    set((state) => {
      const updatedMessages = [...state.messages, message];
      const processedMessages = mergeMessages(
        filterEmptyMessages(updatedMessages.sort(sortByCreatedAt)),
      );

      callAllMessageCallbacks(state.messageCallbacks, message);
      return { messages: processedMessages };
    });
  },

  upsertUserTranscript: (text, final) => {
    const now = new Date();
    set((state) => {
      const messages = [...state.messages];

      // Find last user message
      const lastUserIndex = messages.findLastIndex((m) => m.role === "user");

      if (lastUserIndex !== -1 && !messages[lastUserIndex].final) {
        // Update existing user message
        const target = { ...messages[lastUserIndex] };
        const parts: ConversationMessagePart[] = Array.isArray(target.parts)
          ? [...target.parts]
          : [];

        const lastPart = parts[parts.length - 1];
        if (!lastPart || lastPart.final) {
          // Start a new part
          parts.push({ text, final, createdAt: now.toISOString() });
        } else {
          // Update in-progress part
          parts[parts.length - 1] = {
            ...lastPart,
            text,
            final,
          };
        }

        const updatedMessage: ConversationMessage = {
          ...target,
          final: final ? true : target.final,
          parts,
          updatedAt: now.toISOString(),
        };

        messages[lastUserIndex] = updatedMessage;

        const processedMessages = mergeMessages(
          filterEmptyMessages(messages.sort(sortByCreatedAt)),
        );

        callAllMessageCallbacks(state.messageCallbacks, updatedMessage);
        return { messages: processedMessages };
      }

      // Create a new user message initialized with this transcript
      const newMessage: ConversationMessage = {
        role: "user",
        final,
        parts: [
          {
            text,
            final,
            createdAt: now.toISOString(),
          },
        ],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };

      const updatedMessages = [...messages, newMessage];
      const processedMessages = mergeMessages(
        filterEmptyMessages(updatedMessages.sort(sortByCreatedAt)),
      );
      callAllMessageCallbacks(state.messageCallbacks, newMessage);
      return { messages: processedMessages };
    });
  },

  updateAssistantText: (text, final, source) => {
    const now = new Date();
    set((state) => {
      const messages = [...state.messages];
      const llmTextStreams = new Map(state.llmTextStreams);
      const ttsTextStreams = new Map(state.ttsTextStreams);

      const lastAssistantIndex = messages.findLastIndex(
        (msg) => msg.role === "assistant",
      );

      let messageId: string;

      if (lastAssistantIndex === -1) {
        // Create new assistant message
        messageId = now.toISOString();
        const newMessage: ConversationMessage = {
          role: "assistant",
          final,
          parts: [],
          createdAt: messageId,
          updatedAt: messageId,
        };
        messages.push(newMessage);
      } else {
        // Update existing assistant message
        const lastMessage = messages[lastAssistantIndex];
        messageId = lastMessage.createdAt;

        messages[lastAssistantIndex] = {
          ...lastMessage,
          final: final ? true : lastMessage.final,
          updatedAt: now.toISOString(),
        };
      }

      // Update the appropriate text stream
      if (source === "llm") {
        const currentText = llmTextStreams.get(messageId) || "";
        llmTextStreams.set(messageId, currentText + text);
      } else {
        const currentText = ttsTextStreams.get(messageId) || "";
        // Add space between TTS chunks for proper word separation
        const separator =
          currentText && !currentText.endsWith(" ") && !text.startsWith(" ")
            ? " "
            : "";
        ttsTextStreams.set(messageId, currentText + separator + text);
      }

      // Don't filter out messages that have text in the text streams
      const processedMessages = mergeMessages(messages.sort(sortByCreatedAt));

      return {
        messages: processedMessages,
        llmTextStreams,
        ttsTextStreams,
      };
    });
  },

  startAssistantLlmStream: () => {
    set((state) => {
      const messages = [...state.messages];
      const llmTextStreams = new Map(state.llmTextStreams);
      const now = new Date();

      const lastIndex = messages.length - 1;
      // Get the last assistant message
      const lastAssistantIndex = messages.findLastIndex(
        (msg) => msg.role === "assistant",
      );
      const lastAssistant =
        lastAssistantIndex !== -1 ? messages[lastAssistantIndex] : undefined;

      // Check if the last assistant message is final
      if (!lastAssistant || lastIndex !== lastAssistantIndex) {
        // Create a new assistant message
        const newMessage: ConversationMessage = {
          role: "assistant",
          final: false,
          parts: [],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        messages.push(newMessage);
      } else if (lastIndex === lastAssistantIndex) {
        // The last assistant message is not final, so we need to add a space
        // to the LLM stream to separate it from the previous content
        const messageId = lastAssistant.createdAt;
        const currentText = llmTextStreams.get(messageId) || "";

        // Add a space if the current text doesn't end with one
        if (currentText && !currentText.endsWith(" ")) {
          llmTextStreams.set(messageId, currentText + " ");
        }

        messages[lastAssistantIndex] = {
          ...lastAssistant,
          final: false,
          updatedAt: now.toISOString(),
        };
      }

      const processedMessages = mergeMessages(
        filterEmptyMessages(messages.sort(sortByCreatedAt)),
      );

      return {
        messages: processedMessages,
        llmTextStreams,
      };
    });
  },
}));
