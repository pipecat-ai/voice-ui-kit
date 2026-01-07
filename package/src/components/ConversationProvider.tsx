import { useConversationStore } from "@/stores/conversationStore";
import {
  type ConversationMessage,
  type ConversationMessagePart,
} from "@/types/conversation";
import { useBotMessages } from "@/hooks/useBotMessages";
import { BotOutputData, BotReadyData, RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import { createContext, useContext, useRef, useState } from "react";
import { isMinVersion } from "@/utils/version";

interface ConversationContextValue {
  messages: ConversationMessage[];
  injectMessage: (message: {
    role: "user" | "assistant" | "system";
    parts: ConversationMessagePart[];
  }) => void;
  /**
   * Whether BotOutput events are supported (RTVI 1.1.0+)
   * null = unknown (before BotReady), true = supported, false = not supported
   */
  botOutputSupported: boolean | null;
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
    updateAssistantBotOutput,
  } = useConversationStore();

  // null = unknown (before BotReady), true = supported, false = not supported
  const [botOutputSupported, setBotOutputSupported] = useState<boolean | null>(
    null,
  );
  const userStoppedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const assistantStreamResetRef = useRef<number>(0);

  useRTVIClientEvent(RTVIEvent.Connected, () => {
    clearMessages();
    setBotOutputSupported(null);
    botOutputLastChunkRef.current = { spoken: "", unspoken: "" };
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

  // Detect BotOutput support from BotReady event
  useRTVIClientEvent(RTVIEvent.BotReady, (botData: BotReadyData) => {
    const rtviVersion = botData.version;
    const supportsBotOutput = isMinVersion(rtviVersion, [1, 1, 0]);
    setBotOutputSupported(supportsBotOutput);
  });

  // Track last chunk text per type for spacing detection in BotOutput mode
  const botOutputLastChunkRef = useRef<{ spoken: string; unspoken: string }>({
    spoken: "",
    unspoken: "",
  });

  useRTVIClientEvent(RTVIEvent.BotOutput, (data: BotOutputData) => {
    ensureAssistantMessage();

    // Handle spacing for BotOutput chunks
    let textToAdd = data.text;
    const lastChunk = data.spoken
      ? botOutputLastChunkRef.current.spoken
      : botOutputLastChunkRef.current.unspoken;

    // Add space separator if needed between BotOutput chunks
    if (lastChunk) {
      textToAdd = " " + textToAdd;
    }

    // Update the appropriate last chunk tracker
    if (data.spoken) {
      botOutputLastChunkRef.current.spoken = textToAdd;
    } else {
      botOutputLastChunkRef.current.unspoken = textToAdd;
    }

    // Update both spoken and unspoken text streams
    const isFinal = data.aggregated_by === "sentence";
    updateAssistantBotOutput(
      textToAdd,
      isFinal,
      data.spoken,
      data.aggregated_by,
    );
  });

  // Handle legacy TTS/LLM events (when BotOutput not supported)
  useBotMessages(
    {
      onBotMessageStarted: () => {
        ensureAssistantMessage();
      },
      onBotMessageChunk: (type, text) => {
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
    },
    botOutputSupported === true,
  );

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
    botOutputSupported,
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
