import {
  type BotOutputText,
  type ConversationMessage,
  type ConversationMessagePart,
} from "@/types/conversation";
import { create } from "zustand";

interface ConversationState {
  messages: ConversationMessage[];
  messageCallbacks: Map<string, (message: ConversationMessage) => void>;
  // Store BotOutput aggregation types per message (for metadata lookup)
  botOutputAggregationTypes: Map<string, string>; // messageId -> last aggregation type
  // Simple state per message for tracking spoken position
  botOutputMessageState: Map<
    string,
    {
      currentPartIndex: number; // Which part we're currently speaking
      currentCharIndex: number; // Character position within that part
      partFinalFlags: boolean[]; // Per-part: true if fully spoken or not meant to be spoken
    }
  >;

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

// Helper function to find where spoken text appears in unspoken text within a single part
// Simplified: only matches sequentially, returns current position on mismatch
const findSpokenPositionInUnspoken = (
  spoken: string,
  unspoken: string,
  startPosition: number,
): number => {
  if (!spoken || !unspoken || startPosition >= unspoken.length) {
    return startPosition;
  }

  // If the spoken text starts with a space (from separator), skip any leading whitespace in unspoken
  let actualStartPosition = startPosition;
  let spokenTextForMatching = spoken;
  if (spoken.startsWith(" ") && startPosition < unspoken.length) {
    // Skip any leading whitespace (spaces, newlines, tabs) in unspoken text
    while (
      actualStartPosition < unspoken.length &&
      /\s/.test(unspoken[actualStartPosition])
    ) {
      actualStartPosition++;
    }
    // Remove leading space from spoken for matching
    spokenTextForMatching = spoken.trimStart();
  } else if (startPosition === 0 && startPosition < unspoken.length) {
    // If we're at the start of the part (position 0), skip any leading whitespace
    // This handles cases where a part starts with newlines or other whitespace
    while (
      actualStartPosition < unspoken.length &&
      /\s/.test(unspoken[actualStartPosition])
    ) {
      actualStartPosition++;
    }
  }

  // Normalize spoken text for matching (lowercase, remove punctuation)
  const normalizedSpoken = normalizeForMatching(spokenTextForMatching);
  const spokenWords = normalizedSpoken.split(/\s+/).filter((w) => w.length > 0);

  if (spokenWords.length === 0) {
    return actualStartPosition;
  }

  // Find where we are in the unspoken words
  const unspokenSubstring = unspoken.slice(actualStartPosition);
  const normalizedUnspokenSubstring = normalizeForMatching(unspokenSubstring);
  const unspokenSubstringWords = normalizedUnspokenSubstring
    .split(/\s+/)
    .filter((w) => w.length > 0);

  // Try to match spoken words sequentially against unspoken words
  // Handle contractions: if a spoken word doesn't match exactly, check if it's a prefix
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
      // Mismatch: return current position (don't advance)
      return actualStartPosition;
    }
  }

  // If no words matched, return current position (mismatch)
  if (matchedWords === 0) {
    return actualStartPosition;
  }

  // Find the character position after the matched words
  const isWordChar = (char: string): boolean => {
    return /[a-zA-Z0-9]/.test(char);
  };

  let wordCount = 0;
  let i = actualStartPosition;
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
        // Continue until we find the end of this word
        i++;
        while (i < unspoken.length && isWordChar(unspoken[i])) {
          i++;
        }
        // Continue including ALL characters until we hit a space
        while (i < unspoken.length) {
          const nextChar = unspoken[i];
          if (nextChar === " ") {
            // Include space after the word, then stop
            i++;
            break;
          } else {
            // Include any character (punctuation, etc.)
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

  // If we reached the end, return the end position
  if (matchedWords > 0) {
    return unspoken.length;
  }

  // No match found, return current position
  return actualStartPosition;
};

export const useConversationStore = create<ConversationState>()((set) => ({
  messages: [],
  messageCallbacks: new Map(),
  botOutputAggregationTypes: new Map(),
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
      botOutputAggregationTypes: new Map(),
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

  findSpokenPositionInUnspoken: (spoken, unspoken, startPosition) => {
    return findSpokenPositionInUnspoken(spoken, unspoken, startPosition);
  },

  updateAssistantBotOutput: (text, final, spoken, aggregatedBy) => {
    const now = new Date();
    set((state) => {
      const messages = [...state.messages];
      const botOutputAggregationTypes = new Map(
        state.botOutputAggregationTypes,
      );
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
        // Store aggregation type
        if (aggregatedBy !== undefined) {
          botOutputAggregationTypes.set(messageId, aggregatedBy);
        }

        // Determine if this should be a new part or appended to last part
        // Default types: "word" and "sentence" - sentence should be separate parts
        // Custom types (anything else) need metadata to determine behavior
        const isSentence = aggregatedBy === "sentence";
        const isWord = aggregatedBy === "word";
        const isDefaultType = isSentence || isWord || !aggregatedBy;
        const lastPart = parts[parts.length - 1];
        const shouldAppend =
          lastPart &&
          lastPart.aggregatedBy === aggregatedBy &&
          !isSentence &&
          typeof lastPart.text === "string";

        if (shouldAppend) {
          // Append to last part (for word-level chunks)
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
          // Create new part
          // Set displayMode only for default types (word/sentence are inline)
          // Custom types will get displayMode from metadata in the hook
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
        // SPOKEN EVENT: Only update position state
        // Store aggregation type
        if (aggregatedBy !== undefined) {
          botOutputAggregationTypes.set(messageId, aggregatedBy);
        }

        // Find current part to match against
        if (parts.length === 0) {
          // No parts yet, can't update position
          const processedMessages = mergeMessages(
            messages.sort(sortByCreatedAt),
          );
          return {
            messages: processedMessages,
            botOutputAggregationTypes,
            botOutputMessageState,
          };
        }

        // Find the next part that should be spoken (skip parts that are fully spoken)
        // Start from current part index and find next part that's not fully spoken
        let partToMatch = messageState.currentPartIndex;
        while (
          partToMatch < parts.length &&
          messageState.partFinalFlags[partToMatch]
        ) {
          partToMatch++;
        }

        if (partToMatch >= parts.length) {
          // All remaining parts are final/not meant to be spoken, nothing to do
          const processedMessages = mergeMessages(
            messages.sort(sortByCreatedAt),
          );
          return {
            messages: processedMessages,
            botOutputAggregationTypes,
            botOutputMessageState,
          };
        }

        // Update current part index if we skipped ahead
        if (partToMatch > messageState.currentPartIndex) {
          messageState.currentPartIndex = partToMatch;
          messageState.currentCharIndex = 0;
        }

        const currentPart = parts[messageState.currentPartIndex];
        if (typeof currentPart.text !== "string") {
          // Current part is not a string (shouldn't happen for BotOutput), skip
          const processedMessages = mergeMessages(
            messages.sort(sortByCreatedAt),
          );
          return {
            messages: processedMessages,
            botOutputAggregationTypes,
            botOutputMessageState,
          };
        }

        const partText = currentPart.text;
        const currentCharIndex = messageState.currentCharIndex;

        // Match spoken text against current part starting from current position
        // Text may include leading space separator from ConversationProvider
        const newPosition = findSpokenPositionInUnspoken(
          text,
          partText,
          currentCharIndex,
        );

        // Only advance if we actually matched words (not just whitespace)
        // Check if the new position is beyond just leading whitespace
        let whitespaceEnd = currentCharIndex;
        while (
          whitespaceEnd < partText.length &&
          /\s/.test(partText[whitespaceEnd])
        ) {
          whitespaceEnd++;
        }

        // If position advanced beyond whitespace, it's a real match
        if (newPosition > whitespaceEnd) {
          // Match found - update position
          messageState.currentCharIndex = newPosition;

          // Check if part is fully spoken
          if (newPosition >= partText.length) {
            messageState.partFinalFlags[messageState.currentPartIndex] = true;

            // Move to next part if available
            if (messageState.currentPartIndex < parts.length - 1) {
              messageState.currentPartIndex++;
              messageState.currentCharIndex = 0;
            }
          }
        } else {
          // No match - this could mean:
          // 1. The part isn't meant to be spoken (custom aggregation with isSpoken: false)
          // 2. The spoken text is for a later part (mismatch scenario)
          // Try to find if the spoken text matches any later part
          let foundMatch = false;
          for (
            let nextPartIdx = messageState.currentPartIndex + 1;
            nextPartIdx < parts.length;
            nextPartIdx++
          ) {
            const nextPart = parts[nextPartIdx];
            if (typeof nextPart.text === "string") {
              const nextPartMatch = findSpokenPositionInUnspoken(
                text,
                nextPart.text,
                0,
              );
              // Only consider it a match if we actually matched words (not just whitespace)
              // Check if the match position is beyond just leading whitespace
              const nextPartText = nextPart.text;
              let whitespaceEnd = 0;
              while (
                whitespaceEnd < nextPartText.length &&
                /\s/.test(nextPartText[whitespaceEnd])
              ) {
                whitespaceEnd++;
              }
              // Only skip if we matched beyond just whitespace
              if (nextPartMatch > whitespaceEnd) {
                // Found a match in a later part - skip to it
                // Mark all parts between current and next as final (they're not meant to be spoken or were skipped)
                for (
                  let i = messageState.currentPartIndex;
                  i < nextPartIdx;
                  i++
                ) {
                  messageState.partFinalFlags[i] = true;
                }
                messageState.currentPartIndex = nextPartIdx;
                messageState.currentCharIndex = nextPartMatch;
                foundMatch = true;
                break;
              }
            }
          }

          // If no match found in later parts and we're at position 0, this part might not be meant to be spoken
          // Mark it as final and move to next part to avoid getting stuck
          if (
            !foundMatch &&
            currentCharIndex === 0 &&
            messageState.currentPartIndex < parts.length - 1
          ) {
            messageState.partFinalFlags[messageState.currentPartIndex] = true;
            messageState.currentPartIndex++;
            messageState.currentCharIndex = 0;
          }
          // If we're not at position 0 and no match found, it's a temporary mismatch
          // Keep current position unchanged and wait for matching text
        }
      }

      const processedMessages = mergeMessages(messages.sort(sortByCreatedAt));

      return {
        messages: processedMessages,
        botOutputAggregationTypes,
        botOutputMessageState,
      };
    });
  },
}));
