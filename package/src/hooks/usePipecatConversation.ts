import { type ConversationMessage } from "@/types/conversation";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import { useEffect, useRef } from "react";
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
  const {
    messages,
    setOnMessageAdded,
    clearMessages,
    addMessage,
    finalizeLastMessage,
    removeEmptyLastMessage,
    injectMessage,
  } = useConversationStore();

  const userStoppedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const assistantStreamResetRef = useRef<number>(0);

  // Set the callback when component mounts or changes
  useEffect(() => {
    setOnMessageAdded(onMessageAdded);
  }, [onMessageAdded, setOnMessageAdded]);

  useRTVIClientEvent(RTVIEvent.Connected, () => {
    clearMessages();
  });

  useRTVIClientEvent(RTVIEvent.BotLlmStarted, () => {
    // Start a new assistant message only if there isn't one already in progress
    const store = useConversationStore.getState();
    const lastAssistantIndex = store.messages.findLastIndex(
      (msg) => msg.role === "assistant",
    );
    const lastAssistant =
      lastAssistantIndex !== -1
        ? store.messages[lastAssistantIndex]
        : undefined;

    if (!lastAssistant || lastAssistant.final) {
      addMessage({
        role: "assistant",
        content: "",
        final: false,
      });
    }

    // Nudge a reset counter so any consumer logic can infer fresh turn if needed
    assistantStreamResetRef.current += 1;
  });

  useRTVIClientEvent(RTVIEvent.BotLlmText, (data) => {
    // Some backends emit cumulative transcripts. Replace content when the
    // incoming text already contains the existing content as a prefix; otherwise append.
    const store = useConversationStore.getState();
    const lastAssistantIndex = store.messages.findLastIndex(
      (msg) => msg.role === "assistant",
    );
    const lastAssistant =
      lastAssistantIndex !== -1
        ? store.messages[lastAssistantIndex]
        : undefined;

    const currentContent =
      typeof lastAssistant?.content === "string" ? lastAssistant.content : "";
    const incoming = data.text ?? "";

    let nextContent: string;
    if (incoming.startsWith(currentContent)) {
      nextContent = incoming; // cumulative chunk, replace
    } else if (currentContent.endsWith(incoming)) {
      nextContent = currentContent; // duplicate small chunk, ignore
    } else {
      nextContent = currentContent + incoming; // delta chunk, append
    }

    store.updateLastMessage("assistant", {
      content: nextContent,
      final: false,
    });
  });

  useRTVIClientEvent(RTVIEvent.BotLlmStopped, () => {
    finalizeLastMessage("assistant");
  });

  useRTVIClientEvent(RTVIEvent.UserStartedSpeaking, () => {
    // Clear any pending cleanup timers and create a placeholder so the
    // user's message appears in correct chronological order even if
    // transcription lags behind the bot response.
    clearTimeout(userStoppedTimeout.current);

    const store = useConversationStore.getState();
    const lastUserMessageIndex = store.messages.findLastIndex(
      (msg) => msg.role === "user",
    );
    const lastUser =
      lastUserMessageIndex !== -1
        ? store.messages[lastUserMessageIndex]
        : undefined;

    if (!lastUser || lastUser.final) {
      addMessage({
        role: "user",
        content: "",
        final: false,
      });
    }
  });

  useRTVIClientEvent(RTVIEvent.UserTranscript, (data) => {
    // For user transcripts, we update the last message directly
    const store = useConversationStore.getState();
    const lastUserMessageIndex = store.messages.findLastIndex(
      (msg) => msg.role === "user",
    );

    if (lastUserMessageIndex !== -1) {
      store.updateLastMessage("user", {
        content: data.text,
        final: data.final,
      });
    } else {
      addMessage({
        role: "user",
        content: data.text,
        final: data.final,
      });
    }

    // If we got any transcript, cancel pending cleanup
    clearTimeout(userStoppedTimeout.current);
  });

  useRTVIClientEvent(RTVIEvent.UserStoppedSpeaking, () => {
    clearTimeout(userStoppedTimeout.current);
    // If no transcript ends up arriving, ensure any accidental empty placeholder is removed.
    userStoppedTimeout.current = setTimeout(() => {
      removeEmptyLastMessage("user");
    }, 3000);
  });

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
