import {
  type BotOutputEvent,
  type BotOutputText,
  type ConversationMessage,
  type ConversationMessagePart,
  type FunctionCallData,
} from "@/types/conversation";
import {
  applySpokenBotOutputProgress,
  type BotOutputMessageCursor,
  hasUnspokenContent,
  normalizeForMatching,
} from "@/stores/botOutput";
import { create } from "zustand";

interface ConversationState {
  messages: ConversationMessage[];
  // Simple state per message for tracking spoken position
  botOutputMessageState: Map<string, BotOutputMessageCursor>;
  // Raw BotOutput events per message (keyed by message createdAt), for debugging/replay
  botOutputEvents: Map<string, BotOutputEvent[]>;

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
  addFunctionCall: (data: {
    function_name?: string;
    tool_call_id?: string;
    args?: Record<string, unknown>;
  }) => void;
  updateFunctionCall: (
    tool_call_id: string,
    updates: Partial<
      Pick<
        FunctionCallData,
        | "status"
        | "result"
        | "cancelled"
        | "args"
        | "function_name"
        | "tool_call_id"
      >
    >,
  ) => boolean;
  /**
   * Update the most recent function call message that has status "started"
   * and no tool_call_id yet. Used when transitioning from Started → InProgress.
   */
  updateLastStartedFunctionCall: (
    updates: Partial<
      Pick<
        FunctionCallData,
        "status" | "tool_call_id" | "args" | "function_name"
      >
    >,
  ) => boolean;

  // High-level function call lifecycle handlers
  // These encapsulate the orchestration logic (fallback chains, out-of-order
  // detection) that was previously in ConversationProvider.
  handleFunctionCallStarted: (data: { function_name?: string }) => void;
  handleFunctionCallInProgress: (data: {
    function_name?: string;
    tool_call_id: string;
    args?: Record<string, unknown>;
  }) => void;
  handleFunctionCallStopped: (data: {
    function_name?: string;
    tool_call_id: string;
    result?: unknown;
    cancelled?: boolean;
  }) => void;
}

export const sortByCreatedAt = (
  a: ConversationMessage,
  b: ConversationMessage,
): number => {
  return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
};

export const isMessageEmpty = (message: ConversationMessage): boolean => {
  if (message.role === "function_call") return false;
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
      currentMessage.role !== "function_call" &&
      timeDiff < 30000;

    if (shouldMerge) {
      mergedMessages[mergedMessages.length - 1] = {
        ...lastMerged,
        parts: [...(lastMerged.parts || []), ...(currentMessage.parts || [])],
        updatedAt: currentMessage.updatedAt || currentMessage.createdAt,
        final: currentMessage.final !== false,
      };
    } else {
      mergedMessages.push(currentMessage);
    }
  }

  return mergedMessages;
};

const statusPriority: Record<string, number> = {
  started: 0,
  in_progress: 1,
  completed: 2,
};

/**
 * Deduplicate function call messages that share the same tool_call_id,
 * keeping the entry with the most advanced status.
 */
const deduplicateFunctionCalls = (
  messages: ConversationMessage[],
): ConversationMessage[] => {
  const bestByToolCallId = new Map<string, number>();
  const toRemove = new Set<number>();

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const tcid = msg.functionCall?.tool_call_id;
    if (msg.role !== "function_call" || !tcid) continue;

    const existingIdx = bestByToolCallId.get(tcid);
    if (existingIdx !== undefined) {
      const existingPriority =
        statusPriority[messages[existingIdx].functionCall!.status] ?? 0;
      const currentPriority = statusPriority[msg.functionCall!.status] ?? 0;

      if (currentPriority >= existingPriority) {
        toRemove.add(existingIdx);
        bestByToolCallId.set(tcid, i);
      } else {
        toRemove.add(i);
      }
    } else {
      bestByToolCallId.set(tcid, i);
    }
  }

  if (toRemove.size === 0) return messages;
  return messages.filter((_, i) => !toRemove.has(i));
};

const normalizeMessagesForUI = (
  messages: ConversationMessage[],
): ConversationMessage[] => {
  return mergeMessages(
    deduplicateFunctionCalls(
      filterEmptyMessages(messages.sort(sortByCreatedAt)),
    ),
  );
};

// Module-level callback registry — mutations here do not trigger store re-renders
const messageCallbacks = new Map<
  string,
  (message: ConversationMessage) => void
>();

// Helper function to call all registered callbacks
const callAllMessageCallbacks = (message: ConversationMessage) => {
  messageCallbacks.forEach((callback) => {
    try {
      callback(message);
    } catch (error) {
      console.error("Error in message callback:", error);
    }
  });
};

export const useConversationStore = create<ConversationState>()((set, get) => ({
  messages: [],
  botOutputMessageState: new Map(),
  botOutputEvents: new Map(),

  registerMessageCallback: (id, callback) => {
    messageCallbacks.set(id, callback || (() => {}));
  },

  unregisterMessageCallback: (id) => {
    messageCallbacks.delete(id);
  },

  clearMessages: () =>
    set({
      messages: [],
      botOutputMessageState: new Map(),
      botOutputEvents: new Map(),
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

      callAllMessageCallbacks(message);
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

      callAllMessageCallbacks(updatedMessage);
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
        callAllMessageCallbacks(messages[lastMessageIndex]);
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

    set((state) => {
      // If the most recent message is an active (non-final) assistant message,
      // backdate the injected message so it sorts before the assistant's
      // createdAt. This prevents the injected message from splitting the bot's
      // response across two bubbles and breaking the karaoke cursor.
      const lastMessage = state.messages[state.messages.length - 1];
      const lastAssistant =
        lastMessage?.role === "assistant" ? lastMessage : undefined;
      let timestamp: string;
      if (
        lastAssistant &&
        lastAssistant.final === false &&
        messageData.role === "system"
      ) {
        const assistantTime = new Date(lastAssistant.createdAt);
        timestamp = new Date(assistantTime.getTime() - 1).toISOString();
      } else {
        timestamp = now.toISOString();
      }

      const message: ConversationMessage = {
        role: messageData.role,
        final: true,
        parts: [...messageData.parts],
        createdAt: timestamp,
        updatedAt: now.toISOString(),
      };

      const updatedMessages = [...state.messages, message];
      const processedMessages = normalizeMessagesForUI(updatedMessages);

      callAllMessageCallbacks(message);
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
          parts,
          updatedAt: now.toISOString(),
        };

        messages[lastUserIndex] = updatedMessage;

        const processedMessages = normalizeMessagesForUI(messages);

        callAllMessageCallbacks(updatedMessage);
        return { messages: processedMessages };
      }

      // Create a new user message initialized with this transcript.
      // Message stays non-final; only parts track STT segment boundaries.
      // The message itself is finalized by finalizeLastMessage("user")
      // when UserStoppedSpeaking fires.
      const newMessage: ConversationMessage = {
        role: "user",
        final: false,
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
      callAllMessageCallbacks(newMessage);
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
          partSpokenOnly: [],
          hasReceivedUnspoken: false,
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
            partSpokenOnly: [],
            hasReceivedUnspoken: false,
          });
        }
      }

      // Store raw event for debugging/replay
      const botOutputEvents = new Map(state.botOutputEvents);
      const existingEvents = botOutputEvents.get(messageId) || [];
      botOutputEvents.set(messageId, [
        ...existingEvents,
        {
          text,
          spoken,
          aggregatedBy,
          receivedAt: now.toISOString(),
        },
      ]);

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
          typeof lastPart.text === "string" &&
          !messageState.partSpokenOnly[parts.length - 1];

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
          // Before creating a new unspoken part, check whether the trailing run
          // of spoken-only fallback parts forms a word-prefix of this new text.
          // If so, absorb them: S2S pipelines can emit word-level spoken events
          // for a sentence before the sentence-level unspoken event arrives.
          let scanStart = parts.length;
          while (
            scanStart > 0 &&
            messageState.partSpokenOnly[scanStart - 1] &&
            typeof parts[scanStart - 1].text === "string"
          ) {
            scanStart--;
          }

          // Character-level prefix match: concatenate the alphanumeric chars
          // of each trailing spoken-only part in order and check that the
          // running concatenation is a prefix of the new text's alphanumeric
          // chars. This handles TTS sub-word splits (e.g. "Pi"/"pec"/"at"
          // speaking "Pipecat") that a word-level matcher can't reconcile.
          let absorbed = 0;
          let absorbedAlnumCount = 0;
          if (scanStart < parts.length) {
            const alnumOnly = (s: string): string =>
              s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
            const textAlnum = alnumOnly(text);
            let running = 0;
            for (let i = scanStart; i < parts.length; i++) {
              const partAlnum = alnumOnly(parts[i].text as string);
              if (partAlnum.length === 0) {
                // Pure-punctuation fragment: absorb silently without extending
                // the running prefix (same semantics as applySpokenBotOutputProgress).
                absorbed++;
                continue;
              }
              const next = running + partAlnum.length;
              if (
                next <= textAlnum.length &&
                textAlnum.slice(running, next) === partAlnum
              ) {
                running = next;
                absorbedAlnumCount = running;
                absorbed++;
              } else {
                break;
              }
            }
          }

          // Translate the absorbed alphanumeric prefix count into a char
          // index inside the original (non-normalized) unspoken text,
          // advancing past any trailing punctuation and whitespace so the
          // cursor sits at the start of the next unspoken word.
          let absorbedCharIndex = 0;
          if (absorbedAlnumCount > 0) {
            const isAlnum = (c: string): boolean => /[\p{L}\p{N}]/u.test(c);
            let count = 0;
            for (let i = 0; i < text.length; i++) {
              if (isAlnum(text[i])) {
                count++;
                if (count === absorbedAlnumCount) {
                  let j = i + 1;
                  while (j < text.length && !isAlnum(text[j])) j++;
                  absorbedCharIndex = j;
                  break;
                }
              }
            }
          }

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

          if (absorbed > 0) {
            // Replace the absorbed spoken-only parts in place so the new
            // unspoken part sits where its spoken fragments originally landed
            // (before any trailing fallback parts that belong to later turns).
            const insertAt = scanStart;
            parts.splice(insertAt, absorbed, newPart);
            messageState.partFinalFlags.splice(insertAt, absorbed, false);
            messageState.partSpokenOnly.splice(insertAt, absorbed, false);

            if (absorbedCharIndex > 0) {
              messageState.currentPartIndex = insertAt;
              messageState.currentCharIndex = absorbedCharIndex;
              if (absorbedCharIndex >= text.length) {
                messageState.partFinalFlags[insertAt] = true;
              }
            }
          } else {
            parts.push(newPart);
            messageState.partFinalFlags.push(false);
            messageState.partSpokenOnly.push(false);
          }
        }

        messageState.hasReceivedUnspoken = true;

        // Update message with new parts
        messages[
          lastAssistantIndex === -1 ? messages.length - 1 : lastAssistantIndex
        ] = {
          ...message,
          parts,
        };
      } else {
        // SPOKEN EVENT: advance cursor into existing text, or add as new part
        // if there is none. Multi-word events (e.g. TTS emitting "Hello! I'm"
        // as a single chunk that crosses a sentence boundary) are split into
        // whitespace-separated tokens and processed one at a time so the
        // cursor can advance across unspoken-part boundaries.
        const tokens = text.trim().split(/\s+/).filter(Boolean);
        const leadingSpace = /^\s/.test(text) ? " " : "";
        const isDefaultType =
          aggregatedBy === "sentence" ||
          aggregatedBy === "word" ||
          !aggregatedBy;
        const defaultDisplayMode = isDefaultType ? "inline" : undefined;

        let partsMutated = false;
        for (let tokenIdx = 0; tokenIdx < tokens.length; tokenIdx++) {
          const tokenText =
            (tokenIdx === 0 ? leadingSpace : " ") + tokens[tokenIdx];
          const advanced =
            parts.length > 0 &&
            applySpokenBotOutputProgress(messageState, parts, tokenText);

          if (advanced) continue;

          if (messageState.hasReceivedUnspoken) {
            if (hasUnspokenContent(messageState, parts)) {
              // Mid-stream: the unspoken stream is authoritative for this
              // message and still has pending content to be spoken. An
              // unmatched spoken token here is TTS-granularity noise (e.g.
              // "Pi" / "pec" / "at" tokenization of "Pipecat"). Drop.
              continue;
            }
            if (normalizeForMatching(tokenText).trim().length === 0) {
              // Trailing punctuation after every part has been consumed has
              // nothing to attach to. Drop silently.
              continue;
            }
          }

          // Either no unspoken content has ever been seen (spoken-only bot),
          // or every part has been fully consumed and this token likely
          // belongs to the next sentence — whose unspoken event hasn't arrived
          // yet. Add as a spoken-only fallback so a later unspoken event can
          // absorb it.
          const newPart: ConversationMessagePart = {
            text: tokenText,
            final: false,
            createdAt: now.toISOString(),
            aggregatedBy,
            displayMode: defaultDisplayMode,
          };
          parts.push(newPart);
          messageState.partFinalFlags.push(true);
          messageState.partSpokenOnly.push(true);
          messageState.currentPartIndex = parts.length - 1;
          messageState.currentCharIndex = tokenText.length;
          partsMutated = true;
        }

        if (partsMutated) {
          messages[
            lastAssistantIndex === -1 ? messages.length - 1 : lastAssistantIndex
          ] = {
            ...message,
            parts,
          };
        }
      }

      const processedMessages = normalizeMessagesForUI(messages);

      return {
        messages: processedMessages,
        botOutputMessageState,
        botOutputEvents,
      };
    });
  },

  addFunctionCall: (data) => {
    set((state) => {
      // If a tool_call_id is provided, check for an existing entry to avoid duplicates
      if (data.tool_call_id) {
        const existingIndex = state.messages.findLastIndex(
          (msg) =>
            msg.role === "function_call" &&
            msg.functionCall?.tool_call_id === data.tool_call_id,
        );
        if (existingIndex !== -1) return state;
      }

      const now = new Date();

      // If the most recent message is an active (non-final) assistant message,
      // backdate the function call so it sorts before the assistant's
      // createdAt. This prevents the function call from splitting the bot's
      // response across two bubbles and breaking the karaoke cursor.
      const lastMessage = state.messages[state.messages.length - 1];
      let timestamp: string;
      if (lastMessage?.role === "assistant" && lastMessage.final === false) {
        const assistantTime = new Date(lastMessage.createdAt);
        timestamp = new Date(assistantTime.getTime() - 1).toISOString();
      } else {
        timestamp = now.toISOString();
      }

      const message: ConversationMessage = {
        role: "function_call",
        final: false,
        parts: [],
        createdAt: timestamp,
        updatedAt: now.toISOString(),
        functionCall: {
          function_name: data.function_name,
          tool_call_id: data.tool_call_id,
          args: data.args,
          status: "started",
        },
      };

      const updatedMessages = [...state.messages, message];
      const processedMessages = normalizeMessagesForUI(updatedMessages);
      callAllMessageCallbacks(message);
      return { messages: processedMessages };
    });
  },

  updateFunctionCall: (tool_call_id, updates) => {
    let found = false;
    set((state) => {
      const messages = [...state.messages];
      const index = messages.findLastIndex(
        (msg) =>
          msg.role === "function_call" &&
          msg.functionCall?.tool_call_id === tool_call_id,
      );
      if (index === -1) return state;

      found = true;
      const existing = messages[index];
      const updated: ConversationMessage = {
        ...existing,
        updatedAt: new Date().toISOString(),
        final: updates.status === "completed" ? true : existing.final,
        functionCall: {
          ...existing.functionCall!,
          ...updates,
        },
      };
      messages[index] = updated;

      const processedMessages = normalizeMessagesForUI(messages);
      callAllMessageCallbacks(updated);
      return { messages: processedMessages };
    });
    return found;
  },

  updateLastStartedFunctionCall: (updates) => {
    let found = false;
    set((state) => {
      const messages = [...state.messages];
      const index = messages.findLastIndex(
        (msg) =>
          msg.role === "function_call" &&
          msg.functionCall?.status === "started" &&
          !msg.functionCall?.tool_call_id,
      );
      if (index === -1) return state;

      found = true;
      const existing = messages[index];
      const updated: ConversationMessage = {
        ...existing,
        updatedAt: new Date().toISOString(),
        functionCall: {
          ...existing.functionCall!,
          ...updates,
        },
      };
      messages[index] = updated;

      const processedMessages = normalizeMessagesForUI(messages);
      callAllMessageCallbacks(updated);
      return { messages: processedMessages };
    });
    return found;
  },

  handleFunctionCallStarted: (data) => {
    const state = get();
    const lastFc = state.messages.findLast(
      (m: ConversationMessage) => m.role === "function_call",
    );

    // Check if InProgress already created an entry (events arrived out of order).
    // If the most recent function_call is beyond "started" and was created
    // within the last 2 seconds, skip creating a duplicate.
    if (
      lastFc?.functionCall &&
      lastFc.functionCall.status !== "started" &&
      Date.now() - new Date(lastFc.updatedAt ?? lastFc.createdAt).getTime() <
        2000
    ) {
      if (
        data.function_name &&
        !lastFc.functionCall.function_name &&
        lastFc.functionCall.tool_call_id
      ) {
        get().updateFunctionCall(lastFc.functionCall.tool_call_id, {
          function_name: data.function_name,
        });
      }
      return;
    }

    get().addFunctionCall({ function_name: data.function_name });
  },

  handleFunctionCallInProgress: (data) => {
    // Tier 1: Try to update the last "started" entry (from LLMFunctionCallStarted)
    const updated = get().updateLastStartedFunctionCall({
      function_name: data.function_name,
      tool_call_id: data.tool_call_id,
      args: data.args,
      status: "in_progress",
    });

    if (!updated) {
      // Tier 2: Try updating an existing entry by tool_call_id
      const found = get().updateFunctionCall(data.tool_call_id, {
        function_name: data.function_name,
        args: data.args,
        status: "in_progress",
      });

      if (!found) {
        // Tier 3: No existing entry at all; create a new one as in_progress
        get().addFunctionCall({
          function_name: data.function_name,
          tool_call_id: data.tool_call_id,
          args: data.args,
        });
        get().updateFunctionCall(data.tool_call_id, { status: "in_progress" });
      }
    }
  },

  handleFunctionCallStopped: (data) => {
    // Tier 1: Try updating by tool_call_id
    const found = get().updateFunctionCall(data.tool_call_id, {
      function_name: data.function_name,
      status: "completed",
      result: data.result,
      cancelled: data.cancelled,
    });

    if (!found) {
      // Tier 2: No match by tool_call_id (e.g. InProgress was skipped).
      // Assign the tool_call_id to the last started entry, then complete it.
      const matched = get().updateLastStartedFunctionCall({
        function_name: data.function_name,
        tool_call_id: data.tool_call_id,
      });
      if (matched) {
        get().updateFunctionCall(data.tool_call_id, {
          status: "completed",
          result: data.result,
          cancelled: data.cancelled,
        });
      }
    }
  },
}));
