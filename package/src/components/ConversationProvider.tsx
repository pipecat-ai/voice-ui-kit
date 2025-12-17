import { useConversationStore } from "@/stores/conversationStore";
import {
  type ConversationMessage,
  type ConversationMessagePart,
} from "@/types/conversation";
import { useBotMessages } from "@/hooks/useBotMessages";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import { createContext, useContext, useRef } from "react";

interface ConversationContextValue {
  messages: ConversationMessage[];
  injectMessage: (message: {
    role: "user" | "assistant" | "system";
    parts: ConversationMessagePart[];
  }) => void;
}

const ConversationContext = createContext<ConversationContextValue | null>(
  null,
);

export const ConversationProvider = ({ children }: React.PropsWithChildren) => {
  const {
    messages,
    clearMessages,
    addMessage,
    finalizeLastMessage,
    removeEmptyLastMessage,
    injectMessage,
    upsertUserTranscript,
    updateAssistantText,
  } = useConversationStore();

  const userStoppedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const assistantStreamResetRef = useRef<number>(0);

  useRTVIClientEvent(RTVIEvent.Connected, () => {
    clearMessages();
  });

  // Helper to ensure assistant message exists
  const ensureAssistantMessage = () => {
    const store = useConversationStore.getState();
    const lastAssistantIndex = store.messages.findLastIndex(
      (msg: ConversationMessage) => msg.role === "assistant",
    );
    const lastAssistant =
      lastAssistantIndex !== -1
        ? store.messages[lastAssistantIndex]
        : undefined;

    if (!lastAssistant || lastAssistant.final) {
      addMessage({
        role: "assistant",
        final: false,
        parts: [],
      });
      assistantStreamResetRef.current += 1;
      return true;
    }
    return false;
  };

  // Use the bot messages hook to handle BotOutput detection and fallback
  useBotMessages({
    onBotMessageStarted: () => {
      ensureAssistantMessage();
    },
    onBotMessageChunk: (type, text) => {
      // The hook handles spacing for BotOutput chunks internally
      // For legacy events, spacing is handled by the store for TTS
      updateAssistantText(text, false, type);
    },
    onBotMessageEnded: () => {
      const store = useConversationStore.getState();
      const lastAssistant = store.messages.findLast(
        (m: ConversationMessage) => m.role === "assistant",
      );

      if (lastAssistant && !lastAssistant.final) {
        finalizeLastMessage("assistant");
      }
    },
  });

  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, () => {
    // Finalize the assistant message when bot stops speaking
    // This works for both BotOutput and fallback scenarios
    const store = useConversationStore.getState();
    const lastAssistant = store.messages.findLast(
      (m: ConversationMessage) => m.role === "assistant",
    );

    if (lastAssistant && !lastAssistant.final) {
      finalizeLastMessage("assistant");
    }
  });

  useRTVIClientEvent(RTVIEvent.UserStartedSpeaking, () => {
    // Clear any pending cleanup timers
    clearTimeout(userStoppedTimeout.current);
  });

  useRTVIClientEvent(RTVIEvent.UserTranscript, (data) => {
    const text = data.text ?? "";
    const final = Boolean(data.final);
    upsertUserTranscript(text, final);

    // If we got any transcript, cancel pending cleanup
    clearTimeout(userStoppedTimeout.current);
  });

  useRTVIClientEvent(RTVIEvent.UserStoppedSpeaking, () => {
    clearTimeout(userStoppedTimeout.current);
    // If no transcript ends up arriving, ensure any accidental empty placeholder is removed.
    userStoppedTimeout.current = setTimeout(() => {
      const lastUser = useConversationStore
        .getState()
        .messages.findLast((m: ConversationMessage) => m.role === "user");
      const hasParts =
        Array.isArray(lastUser?.parts) && lastUser!.parts.length > 0;
      if (!lastUser || !hasParts) {
        removeEmptyLastMessage("user");
      } else if (!lastUser.final) {
        finalizeLastMessage("user");
      }
    }, 3000);
  });

  const contextValue: ConversationContextValue = {
    messages,
    injectMessage,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversationContext = (): ConversationContextValue => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error(
      "useConversation must be used within a ConversationProvider",
    );
  }
  return context;
};
