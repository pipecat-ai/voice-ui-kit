import { type ConversationMessage } from "@/types/conversation";
import { useConversationContext } from "@/components/ConversationProvider";
import { useEffect, useId } from "react";
import { useConversationStore } from "@/stores/conversationStore";

/**
 * Options for `useConversation`.
 */
interface Props {
  /** Optional callback invoked whenever a new message is added or finalized. */
  onMessageAdded?: (message: ConversationMessage) => void;
}

/**
 * React hook that derives a clean, ordered conversation stream from RTVI events.
 *
 * Behavior:
 * - Listens to Pipecat client events for user and assistant messages
 * - Creates in-progress placeholder messages for streaming text, finalizes on stop
 * - Filters empty placeholder messages when later replaced by real content
 * - Merges consecutive messages of the same role when close in time
 * - Exposes `injectMessage` to programmatically add messages
 */
export const usePipecatConversation = ({ onMessageAdded }: Props = {}) => {
  const { messages, injectMessage } = useConversationContext();
  const { registerMessageCallback, unregisterMessageCallback } =
    useConversationStore();

  // Generate a unique ID for this hook instance
  const callbackId = useId();

  // Register and unregister the callback
  useEffect(() => {
    // Register the callback
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

  return {
    messages,
    injectMessage,
  };
};

/**
 * @deprecated Use `usePipecatConversation` instead. This alias will be removed in a future major release.
 */
export const useConversation = usePipecatConversation;
export default usePipecatConversation;
