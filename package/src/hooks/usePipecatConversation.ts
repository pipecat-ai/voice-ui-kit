import { type ConversationMessage } from "@/types/conversation";
import { useConversationContext } from "@/components/ConversationProvider";
import { useEffect, useId } from "react";
import { useConversationStore } from "@/stores/conversationStore";

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
  const { messages, injectMessage } = useConversationContext();
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
