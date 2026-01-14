import { type ConversationMessage } from "@/types/conversation";
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
export const usePipecatConversation = ({ onMessageAdded }: Props = {}) => {
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

  // Get the raw state from the store using separate selectors
  const messages = useConversationStore((state) => state.messages);
  const botOutputSpokenStreams = useConversationStore(
    (state) => state.botOutputSpokenStreams,
  );
  const botOutputUnspokenStreams = useConversationStore(
    (state) => state.botOutputUnspokenStreams,
  );
  const botOutputAggregationTypes = useConversationStore(
    (state) => state.botOutputAggregationTypes,
  );
  const botOutputUnspokenAggregationTypes = useConversationStore(
    (state) => state.botOutputUnspokenAggregationTypes,
  );
  const botOutputSpokenPositions = useConversationStore(
    (state) => state.botOutputSpokenPositions,
  );

  // Memoize the filtered messages to prevent infinite loops
  const filteredMessages = useMemo(() => {
    // First, create messages with the appropriate text streams
    const messagesWithTextStreams = messages.map((message) => {
      if (message.role === "assistant") {
        const messageId = message.createdAt; // Use createdAt as unique ID

        // All assistant messages use BotOutput streams
        const spokenText = botOutputSpokenStreams.get(messageId) || "";
        const unspokenText = botOutputUnspokenStreams.get(messageId) || "";
        const aggregatedBy = botOutputAggregationTypes.get(messageId);
        const unspokenAggregationType =
          botOutputUnspokenAggregationTypes.get(messageId);
        const spokenPosition = botOutputSpokenPositions.get(messageId) || 0;

        // Only use position-based splitting for sentence-level unspoken + word/sentence-level spoken
        // For other aggregation types, custom renderers should be used
        const isSentenceLevelUnspoken = unspokenAggregationType === "sentence";
        const isWordOrSentenceSpoken =
          aggregatedBy === "word" ||
          aggregatedBy === "sentence" ||
          !aggregatedBy;
        const shouldUsePositionSplitting =
          isSentenceLevelUnspoken && isWordOrSentenceSpoken && unspokenText;

        let finalSpoken = "";
        let finalUnspoken = "";

        if (shouldUsePositionSplitting) {
          // Split unspoken text at the spoken position to preserve punctuation
          // The spoken part comes from the unspoken text (with punctuation), not from word-level events
          const spokenPart = unspokenText.slice(0, spokenPosition);
          const unspokenPart = unspokenText.slice(spokenPosition);
          finalSpoken = spokenPart;
          finalUnspoken = unspokenPart;
        } else {
          // For other cases, use the streams directly (custom renderers handle these)
          finalSpoken = spokenText;
          finalUnspoken = unspokenText;
        }

        return {
          ...message,
          parts: [
            {
              text: {
                spoken: finalSpoken,
                unspoken: finalUnspoken,
              },
              final: message.final || false,
              createdAt: message.createdAt,
              aggregatedBy,
            },
          ],
        };
      }
      return message;
    });

    // Then process the messages normally
    const processedMessages = mergeMessages(
      filterEmptyMessages(messagesWithTextStreams.sort(sortByCreatedAt)),
    );

    return processedMessages;
  }, [
    messages,
    botOutputSpokenStreams,
    botOutputUnspokenStreams,
    botOutputAggregationTypes,
    botOutputUnspokenAggregationTypes,
    botOutputSpokenPositions,
  ]);

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
