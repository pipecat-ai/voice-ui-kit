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

    const getMetadata = (part: ConversationMessagePart) => {
      return part.aggregatedBy
        ? aggregationMetadata?.[part.aggregatedBy]
        : undefined;
    };

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

        const parts = message.parts || [];

        // Find the actual current part index (skip parts that aren't meant to be spoken)
        let actualCurrentPartIndex = messageState.currentPartIndex;
        while (actualCurrentPartIndex < parts.length) {
          const part = parts[actualCurrentPartIndex];
          if (typeof part?.text !== "string") break;
          const isSpoken = getMetadata(part)?.isSpoken !== false;
          if (isSpoken) break;
          actualCurrentPartIndex++;
        }
        if (parts.length > 0 && actualCurrentPartIndex >= parts.length) {
          actualCurrentPartIndex = parts.length - 1;
        }

        // Convert parts to BotOutputText format based on position state
        const processedParts: ConversationMessagePart[] = parts.map(
          (part, partIndex) => {
            // If part text is not a string, it's already processed (e.g., ReactNode)
            if (typeof part.text !== "string") return part;

            const metadata = getMetadata(part);
            const displayMode =
              part.displayMode ?? metadata?.displayMode ?? "inline";
            const isSpoken = metadata?.isSpoken !== false;

            const partText =
              displayMode === "block" && !isSpoken
                ? part.text.trim()
                : part.text;
            if (!isSpoken) {
              return {
                ...part,
                displayMode,
                text: { spoken: "", unspoken: partText },
              };
            }

            const isCurrentPart =
              isLastAssistantMessage && partIndex === actualCurrentPartIndex;

            const currentCharIndex = messageState.currentCharIndex;
            const spokenText = isCurrentPart
              ? partText.slice(0, currentCharIndex)
              : partIndex < actualCurrentPartIndex
                ? partText
                : "";
            const unspokenText = isCurrentPart
              ? partText.slice(currentCharIndex)
              : partIndex < actualCurrentPartIndex
                ? ""
                : partText;

            return {
              ...part,
              displayMode,
              text: { spoken: spokenText, unspoken: unspokenText },
            };
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
