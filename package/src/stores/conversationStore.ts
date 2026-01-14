import {
  type BotOutputText,
  type ConversationMessage,
  type ConversationMessagePart,
} from "@/types/conversation";
import { create } from "zustand";

interface ConversationState {
  messages: ConversationMessage[];
  messageCallbacks: Map<string, (message: ConversationMessage) => void>;
  // Store BotOutput text streams (BotOutput mode)
  botOutputSpokenStreams: Map<string, string>; // messageId -> accumulated spoken text
  botOutputUnspokenStreams: Map<string, string>; // messageId -> accumulated unspoken text
  // Store BotOutput aggregation types per message
  botOutputAggregationTypes: Map<string, string>; // messageId -> last aggregation type
  // Track last unspoken aggregation type to determine if we should use position-based splitting
  botOutputUnspokenAggregationTypes: Map<string, string>; // messageId -> last unspoken aggregation type
  // Track spoken position in unspoken text (character index)
  // Only used when unspoken is sentence-level and spoken is word/sentence-level
  botOutputSpokenPositions: Map<string, number>; // messageId -> position in unspoken text

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
  // Helper to find position of spoken text in unspoken text
  findSpokenPositionInUnspoken: (
    spoken: string,
    unspoken: string,
    startPosition: number,
  ) => number;
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

// Helper function to normalize text for matching (lowercase, remove punctuation)
const normalizeForMatching = (text: string): string => {
  return text.toLowerCase().replace(/[^\w\s]/g, "");
};

// Helper function to find where spoken words appear in unspoken text
const findSpokenPositionInUnspoken = (
  spoken: string,
  unspoken: string,
  startPosition: number,
): number => {
  if (!spoken || !unspoken || startPosition >= unspoken.length) {
    return startPosition;
  }

  // Normalize spoken text for matching (lowercase, remove punctuation)
  const normalizedSpoken = normalizeForMatching(spoken);
  const spokenWords = normalizedSpoken.split(/\s+/).filter((w) => w.length > 0);

  if (spokenWords.length === 0) {
    return startPosition;
  }

  // Find where we are in the unspoken words
  const unspokenSubstring = unspoken.slice(startPosition);
  const normalizedUnspokenSubstring = normalizeForMatching(unspokenSubstring);
  const unspokenSubstringWords = normalizedUnspokenSubstring
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Try to match spoken words sequentially against unspoken words
  // Handle contractions: if a spoken word doesn't match exactly, check if it's a prefix
  // (e.g., "I" should match "I'm" -> "im" after normalization)
  let matchedWords = 0;
  for (
    let i = 0;
    i < unspokenSubstringWords.length && matchedWords < spokenWords.length;
    i++
  ) {
    const spokenWord = spokenWords[matchedWords];
    const unspokenWord = unspokenSubstringWords[i];

    if (unspokenWord === spokenWord) {
      // Exact match
      matchedWords++;
    } else if (unspokenWord.startsWith(spokenWord)) {
      // Prefix match (handles contractions like "I" matching "I'm")
      matchedWords++;
    } else {
      // Sequential matching: if a word doesn't match, stop (don't reset)
      break;
    }
  }

  if (matchedWords === 0) {
    // No match found, return start position
    return startPosition;
  }

  // Find the character position after the matched words in the original unspoken text
  // Walk through the unspoken text from startPosition and count words
  // Only letters and numbers are word characters - everything else (including apostrophes) is punctuation
  const isWordChar = (char: string): boolean => {
    return /[a-zA-Z0-9]/.test(char);
  };

  let wordCount = 0;
  let i = startPosition;
  let inWord = false;

  // Continue until we've counted all matched words AND passed the end of the last word
  while (i < unspoken.length) {
    const char = unspoken[i];
    const charIsWord = isWordChar(char);

    if (charIsWord && !inWord) {
      // Start of a new word
      inWord = true;
      wordCount++;
      // If we've matched all words, we need to continue to find the end of this word
      if (wordCount === matchedWords) {
        // Continue until we find the end of this word (letters and numbers only)
        i++;
        while (i < unspoken.length && isWordChar(unspoken[i])) {
          i++;
        }
        // Now i is at the first non-letter/non-number character after the last matched word
        // Continue including ALL characters (letters, numbers, apostrophes, punctuation, etc.)
        // until we hit a space - this handles contractions like "I'm" where "I" matches "I'm"
        while (i < unspoken.length) {
          const nextChar = unspoken[i];
          if (nextChar === " ") {
            // Include space after the word/contraction, then stop
            i++;
            break;
          } else {
            // Include any character (letters, numbers, apostrophes, punctuation, em dashes, etc.)
            // This ensures contractions like "I'm" are fully included when matching "I"
            i++;
          }
        }
        // Return position after the last matched word and its trailing characters/space
        return i;
      }
    } else if (!charIsWord && inWord) {
      // End of a word
      inWord = false;
    }

    i++;
  }

  // If we reached the end of the string, return the end position
  return unspoken.length;
};

export const useConversationStore = create<ConversationState>()((set) => ({
  messages: [],
  messageCallbacks: new Map(),
  botOutputSpokenStreams: new Map(),
  botOutputUnspokenStreams: new Map(),
  botOutputAggregationTypes: new Map(),
  botOutputUnspokenAggregationTypes: new Map(),
  botOutputSpokenPositions: new Map(),

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
      botOutputSpokenStreams: new Map(),
      botOutputUnspokenStreams: new Map(),
      botOutputAggregationTypes: new Map(),
      botOutputUnspokenAggregationTypes: new Map(),
      botOutputSpokenPositions: new Map(),
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
      const messageId = lastMessage.createdAt;
      const hasTextInStreams =
        state.botOutputSpokenStreams.get(messageId) ||
        state.botOutputUnspokenStreams.get(messageId);

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
      const messageId = lastMessage.createdAt;

      // Check if message has text in streams
      const hasTextInStreams =
        state.botOutputSpokenStreams.get(messageId) ||
        state.botOutputUnspokenStreams.get(messageId);

      if (isMessageEmpty(lastMessage) && !hasTextInStreams) {
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

  findSpokenPositionInUnspoken: (spoken, unspoken, startPosition) => {
    return findSpokenPositionInUnspoken(spoken, unspoken, startPosition);
  },

  updateAssistantBotOutput: (text, final, spoken, aggregatedBy) => {
    const now = new Date();
    set((state) => {
      const messages = [...state.messages];
      const botOutputSpokenStreams = new Map(state.botOutputSpokenStreams);
      const botOutputUnspokenStreams = new Map(state.botOutputUnspokenStreams);
      const botOutputAggregationTypes = new Map(
        state.botOutputAggregationTypes,
      );
      const botOutputUnspokenAggregationTypes = new Map(
        state.botOutputUnspokenAggregationTypes,
      );
      const botOutputSpokenPositions = new Map(state.botOutputSpokenPositions);

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

      // Store aggregation type if provided
      if (aggregatedBy !== undefined) {
        botOutputAggregationTypes.set(messageId, aggregatedBy);
      }

      // Update the appropriate text stream
      if (spoken) {
        const currentText = botOutputSpokenStreams.get(messageId) || "";
        // Add space separator if needed
        const separator =
          currentText && !currentText.endsWith(" ") && !text.startsWith(" ")
            ? " "
            : "";
        const newSpokenText = currentText + separator + text;
        botOutputSpokenStreams.set(messageId, newSpokenText);

        // Only use position-based splitting for sentence-level unspoken + word/sentence-level spoken
        const unspokenAggregationType =
          botOutputUnspokenAggregationTypes.get(messageId);
        const isSentenceLevelUnspoken = unspokenAggregationType === "sentence";
        const isWordOrSentenceSpoken =
          aggregatedBy === "word" ||
          aggregatedBy === "sentence" ||
          !aggregatedBy;

        if (isSentenceLevelUnspoken && isWordOrSentenceSpoken) {
          // Update spoken position by matching against unspoken text
          const unspokenText = botOutputUnspokenStreams.get(messageId) || "";
          if (unspokenText) {
            const currentPosition =
              botOutputSpokenPositions.get(messageId) || 0;

            // Match incrementally: find where the new portion appears starting from current position
            const newSpokenPortion = separator + text;

            // If we're at position 0, match the full accumulated text to establish initial position
            // Otherwise, match only the new portion incrementally
            const textToMatch =
              currentPosition === 0 ? newSpokenText : newSpokenPortion;
            const startPos = currentPosition === 0 ? 0 : currentPosition;

            const newPosition = findSpokenPositionInUnspoken(
              textToMatch,
              unspokenText,
              startPos,
            );
            botOutputSpokenPositions.set(messageId, newPosition);
          }
        }
      } else {
        const currentText = botOutputUnspokenStreams.get(messageId) || "";
        // Add space separator if needed
        const separator =
          currentText && !currentText.endsWith(" ") && !text.startsWith(" ")
            ? " "
            : "";
        const newUnspokenText = currentText + separator + text;
        botOutputUnspokenStreams.set(messageId, newUnspokenText);

        // Store the unspoken aggregation type
        if (aggregatedBy !== undefined) {
          botOutputUnspokenAggregationTypes.set(messageId, aggregatedBy);
        }

        // When a new sentence-level unspoken chunk arrives, reset the spoken position
        if (aggregatedBy === "sentence") {
          botOutputSpokenPositions.set(messageId, 0);
        }
      }

      // Don't filter out messages that have text in the text streams
      const processedMessages = mergeMessages(messages.sort(sortByCreatedAt));

      return {
        messages: processedMessages,
        botOutputSpokenStreams,
        botOutputUnspokenStreams,
        botOutputAggregationTypes,
        botOutputUnspokenAggregationTypes,
        botOutputSpokenPositions,
      };
    });
  },
}));
