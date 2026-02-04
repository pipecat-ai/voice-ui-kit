import {
  type BotOutputText,
  type ConversationMessage,
  type ConversationMessagePart,
} from "@/types/conversation";
import {
  applySpokenBotOutputProgress,
  type BotOutputMessageCursor,
} from "@/stores/botOutput";
import { create } from "zustand";

interface ConversationState {
  messages: ConversationMessage[];
  messageCallbacks: Map<string, (message: ConversationMessage) => void>;
  // Simple state per message for tracking spoken position
  botOutputMessageState: Map<string, BotOutputMessageCursor>;

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
  updateAssistantBotOutput: (
    text: string,
    final: boolean,
    spoken: boolean, // true if text has been spoken, false if unspoken
    aggregatedBy?: string, // aggregation type (e.g., "code", "link", "sentence", "word")
  ) => void;
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
  return parts.every((p) => {
    if (typeof p.text === "string") {
      return p.text.trim().length === 0;
    }
    // Check BotOutputText objects
    if (
      typeof p.text === "object" &&
      p.text !== null &&
      "spoken" in p.text &&
      "unspoken" in p.text
    ) {
      const botText = p.text as BotOutputText;
      return (
        botText.spoken.trim().length === 0 &&
        botText.unspoken.trim().length === 0
      );
    }
    // For ReactNode, consider it non-empty
    return false;
  });
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

const normalizeMessagesForUI = (
  messages: ConversationMessage[],
): ConversationMessage[] => {
  return mergeMessages(filterEmptyMessages(messages.sort(sortByCreatedAt)));
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
  botOutputMessageState: new Map(),

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
      botOutputMessageState: new Map(),
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
      const processedMessages = normalizeMessagesForUI(updatedMessages);

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
      const processedMessages = normalizeMessagesForUI(messages);

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

      // Check if message is empty
      if (isMessageEmpty(lastMessage)) {
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

      const processedMessages = normalizeMessagesForUI(messages);

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
        const processedMessages = normalizeMessagesForUI(messages);
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
      const processedMessages = normalizeMessagesForUI(updatedMessages);

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

        const processedMessages = normalizeMessagesForUI(messages);

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
      const processedMessages = normalizeMessagesForUI(updatedMessages);
      callAllMessageCallbacks(state.messageCallbacks, newMessage);
      return { messages: processedMessages };
    });
  },

  updateAssistantBotOutput: (text, final, spoken, aggregatedBy) => {
    const now = new Date();
    set((state) => {
      const messages = [...state.messages];
      const botOutputMessageState = new Map(state.botOutputMessageState);

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
        // Initialize message state
        botOutputMessageState.set(messageId, {
          currentPartIndex: 0,
          currentCharIndex: 0,
          partFinalFlags: [],
        });
      } else {
        // Update existing assistant message
        const lastMessage = messages[lastAssistantIndex];
        messageId = lastMessage.createdAt;

        messages[lastAssistantIndex] = {
          ...lastMessage,
          final: final ? true : lastMessage.final,
          updatedAt: now.toISOString(),
        };

        // Ensure message state exists
        if (!botOutputMessageState.has(messageId)) {
          botOutputMessageState.set(messageId, {
            currentPartIndex: 0,
            currentCharIndex: 0,
            partFinalFlags: [],
          });
        }
      }

      const messageState = botOutputMessageState.get(messageId)!;
      const message =
        messages[
          lastAssistantIndex === -1 ? messages.length - 1 : lastAssistantIndex
        ];
      const parts = [...(message.parts || [])];

      if (!spoken) {
        // UNSPOKEN EVENT: Create/update message parts immediately
        // Only append when both current and last part are word-level; sentence-level
        // and other types each get their own part so spoken events can match 1:1.
        const isDefaultType =
          aggregatedBy === "sentence" ||
          aggregatedBy === "word" ||
          !aggregatedBy;
        const lastPart = parts[parts.length - 1];
        const shouldAppend =
          lastPart &&
          aggregatedBy === "word" &&
          lastPart.aggregatedBy === "word" &&
          typeof lastPart.text === "string";

        if (shouldAppend) {
          // Append to last part (word-level only)
          const lastPartText = lastPart.text as string;
          const separator =
            lastPartText && !lastPartText.endsWith(" ") && !text.startsWith(" ")
              ? " "
              : "";
          parts[parts.length - 1] = {
            ...lastPart,
            text: lastPartText + separator + text,
          };
        } else {
          // Create new part (sentence-level, custom types, or first word chunk)
          // Default to inline; custom types get displayMode from metadata in the hook
          const defaultDisplayMode = isDefaultType ? "inline" : undefined;
          const newPart: ConversationMessagePart = {
            text: text, // Store full text as string
            final: false, // Will be evaluated in hook based on metadata
            createdAt: now.toISOString(),
            aggregatedBy,
            displayMode: defaultDisplayMode,
          };
          parts.push(newPart);
          // Extend partFinalFlags array
          messageState.partFinalFlags.push(false);
        }

        // Update message with new parts
        messages[
          lastAssistantIndex === -1 ? messages.length - 1 : lastAssistantIndex
        ] = {
          ...message,
          parts,
        };
      } else {
        // SPOKEN EVENT: advance cursor into existing text, or add as new part if
        // there is none (bots that only send spoken: true, never unspoken).
        const advanced =
          parts.length > 0 &&
          applySpokenBotOutputProgress(messageState, parts, text);

        if (!advanced) {
          // No unspoken content to advance: add this text as a part already fully spoken
          const isDefaultType =
            aggregatedBy === "sentence" ||
            aggregatedBy === "word" ||
            !aggregatedBy;
          const defaultDisplayMode = isDefaultType ? "inline" : undefined;
          const newPart: ConversationMessagePart = {
            text,
            final: false,
            createdAt: now.toISOString(),
            aggregatedBy,
            displayMode: defaultDisplayMode,
          };
          parts.push(newPart);
          messageState.partFinalFlags.push(true);
          messageState.currentPartIndex = parts.length - 1;
          messageState.currentCharIndex = text.length;

          messages[
            lastAssistantIndex === -1
              ? messages.length - 1
              : lastAssistantIndex
          ] = {
            ...message,
            parts,
          };
        }
      }

      const processedMessages = mergeMessages(messages.sort(sortByCreatedAt));

      return {
        messages: processedMessages,
        botOutputMessageState,
      };
    });
  },
}));
