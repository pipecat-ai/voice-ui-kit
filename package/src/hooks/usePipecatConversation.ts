import {
  type ConversationMessage,
  type ConversationMessagePart,
} from "@/types/conversation";
import type { AggregationMetadata } from "@/types/conversation";
import { useConversationContext } from "@/components/ConversationProvider";
import { useEffect, useId, useMemo } from "react";
import {
  filterEmptyMessages,
  mergeMessages,
  sortByCreatedAt,
  useConversationStore,
} from "@/stores/conversationStore";

/**
 * Options for `usePipecatConversation`.
 */
interface Props {
  /**
   * Optional callback invoked whenever a new message is added or finalized.
   * This callback will be called with the latest message object.
   */
  onMessageAdded?: (message: ConversationMessage) => void;
  /**
   * Metadata for aggregation types to control rendering and speech progress behavior.
   * Used to determine which aggregations should be excluded from position-based splitting.
   */
  aggregationMetadata?: Record<string, AggregationMetadata>;
}

/**
 * React hook for accessing and subscribing to the current conversation stream.
 *
 * This hook provides:
 * - The current list of conversation messages, ordered and merged for display.
 * - An `injectMessage` function to programmatically add a message to the conversation.
 * - The ability to register a callback (`onMessageAdded`) that is called whenever a new message is added or finalized.
 *
 * Internally, this hook:
 * - Subscribes to conversation state updates and merges/filters messages for UI consumption.
 * - Ensures the provided callback is registered and unregistered as the component mounts/unmounts or the callback changes.
 *
 * @param {Props} [options] - Optional configuration for the hook.
 * @returns {{
 *   messages: ConversationMessage[];
 *   injectMessage: (message: { role: "user" | "assistant" | "system"; parts: any[] }) => void;
 * }}
 */
export const usePipecatConversation = ({
  onMessageAdded,
  aggregationMetadata,
}: Props = {}) => {
  const { injectMessage } = useConversationContext();
  const { registerMessageCallback, unregisterMessageCallback } =
    useConversationStore();

  // Generate a unique ID for this hook instance
  const callbackId = useId();

  // Register and unregister the callback
  useEffect(() => {
    // Register the callback for message updates
    registerMessageCallback(callbackId, onMessageAdded);

    // Cleanup: unregister when component unmounts or callback changes
    return () => {
      unregisterMessageCallback(callbackId);
    };
  }, [
    callbackId,
    onMessageAdded,
    registerMessageCallback,
    unregisterMessageCallback,
  ]);

  // Get the raw state from the store
  const messages = useConversationStore((state) => state.messages);
  const botOutputMessageState = useConversationStore(
    (state) => state.botOutputMessageState,
  );

  // Memoize the filtered messages to prevent infinite loops
  const filteredMessages = useMemo(() => {
    // Find the last assistant message index (only this one should have active speech progress)
    const lastAssistantIndex = messages.findLastIndex(
      (msg) => msg.role === "assistant",
    );

    // Process messages: convert string parts to BotOutputText based on position state
    const processedMessages = messages.map((message, messageIndex) => {
      if (message.role === "assistant") {
        const isLastAssistantMessage = messageIndex === lastAssistantIndex;
        const messageId = message.createdAt;
        const messageState = botOutputMessageState.get(messageId);

        if (!messageState) {
          // No state yet, return message as-is
          return message;
        }

        const { currentPartIndex, currentCharIndex } = messageState;
        const parts = message.parts || [];

        // Find the actual current part index, skipping parts that aren't meant to be spoken
        let actualCurrentPartIndex = currentPartIndex;
        for (let i = 0; i <= currentPartIndex && i < parts.length; i++) {
          const part = parts[i];
          if (typeof part.text === "string") {
            const metadata = part.aggregatedBy
              ? aggregationMetadata?.[part.aggregatedBy]
              : undefined;
            const isSpoken = metadata?.isSpoken !== false;
            if (!isSpoken) {
              // This part isn't meant to be spoken, adjust current index
              if (i === actualCurrentPartIndex) {
                actualCurrentPartIndex = Math.min(
                  actualCurrentPartIndex + 1,
                  parts.length - 1,
                );
              }
            }
          }
        }

        // Convert parts to BotOutputText format based on position state
        const processedParts: ConversationMessagePart[] = parts.map(
          (part, partIndex) => {
            // If part text is not a string, it's already processed (e.g., ReactNode)
            if (typeof part.text !== "string") {
              return part;
            }

            const partText = part.text;
            const metadata = part.aggregatedBy
              ? aggregationMetadata?.[part.aggregatedBy]
              : undefined;
            const isSpoken = metadata?.isSpoken !== false;
            // Set displayMode on the part (default to "inline" for sentence-level)
            const displayMode =
              part.displayMode ?? metadata?.displayMode ?? "inline";

            // If part is not meant to be spoken, render as fully unspoken
            if (!isSpoken) {
              return {
                ...part,
                displayMode,
                text: {
                  spoken: "",
                  unspoken: partText,
                },
              };
            }

            // Determine if this is the current part being spoken
            const isCurrentPart =
              isLastAssistantMessage && partIndex === actualCurrentPartIndex;

            if (isCurrentPart) {
              // Current part: split at currentCharIndex
              const spoken = partText.slice(0, currentCharIndex);
              const unspoken = partText.slice(currentCharIndex);
              return {
                ...part,
                displayMode,
                text: {
                  spoken,
                  unspoken,
                },
              };
            } else if (partIndex < actualCurrentPartIndex) {
              // Previous parts: fully spoken
              return {
                ...part,
                displayMode,
                text: {
                  spoken: partText,
                  unspoken: "",
                },
              };
            } else {
              // Subsequent parts: fully unspoken
              return {
                ...part,
                displayMode,
                text: {
                  spoken: "",
                  unspoken: partText,
                },
              };
            }
          },
        );

        return {
          ...message,
          parts: processedParts,
        };
      }
      return message;
    });

    // Then process the messages normally
    return mergeMessages(
      filterEmptyMessages(processedMessages.sort(sortByCreatedAt)),
    );
  }, [messages, botOutputMessageState, aggregationMetadata]);

  return {
    messages: filteredMessages,
    injectMessage,
  };
};

/**
 * @deprecated Use `usePipecatConversation` instead. This alias will be removed in a future major release.
 */
export const useConversation = usePipecatConversation;
export default usePipecatConversation;
