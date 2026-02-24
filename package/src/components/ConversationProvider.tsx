import { hasUnspokenContent } from "@/stores/botOutput";
import { useConversationStore } from "@/stores/conversationStore";
import {
  type ConversationMessage,
  type ConversationMessagePart,
} from "@/types/conversation";
import {
  BotOutputData,
  BotReadyData,
  type LLMFunctionCallInProgressData,
  type LLMFunctionCallStartedData,
  type LLMFunctionCallStoppedData,
  RTVIEvent,
} from "@pipecat-ai/client-js";
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
    updateLastMessage,
    finalizeLastMessage,
    removeEmptyLastMessage,
    injectMessage,
    upsertUserTranscript,
    updateAssistantBotOutput,
    handleFunctionCallStarted,
    handleFunctionCallInProgress,
    handleFunctionCallStopped,
  } = useConversationStore();

  // null = unknown (before BotReady), true = supported, false = not supported
  const [botOutputSupported, setBotOutputSupported] = useState<boolean | null>(
    null,
  );
  const userStoppedTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
  const botStoppedSpeakingTimeoutRef =
    useRef<ReturnType<typeof setTimeout>>(undefined);
  const assistantStreamResetRef = useRef<number>(0);
  const botOutputLastChunkRef = useRef<{ spoken: string; unspoken: string }>({
    spoken: "",
    unspoken: "",
  });

  /** Delay (ms) before finalizing the assistant message after bot stops speaking. */
  const BOT_STOPPED_FINALIZE_DELAY_MS = 2500;

  const finalizeLastAssistantMessageIfPending = () => {
    clearTimeout(botStoppedSpeakingTimeoutRef.current);
    botStoppedSpeakingTimeoutRef.current = undefined;
    const store = useConversationStore.getState();
    const lastAssistant = store.messages.findLast(
      (m: ConversationMessage) => m.role === "assistant",
    );
    if (lastAssistant && !lastAssistant.final) {
      finalizeLastMessage("assistant");
    }
  };

  useRTVIClientEvent(RTVIEvent.Connected, () => {
    clearMessages();
    setBotOutputSupported(null);
    clearTimeout(botStoppedSpeakingTimeoutRef.current);
    botStoppedSpeakingTimeoutRef.current = undefined;
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
      // If the message was finalized but still has unspoken content, it was
      // finalized prematurely (e.g. BotStoppedSpeaking timer fired during a
      // TTS pause mid-response). Un-finalize it instead of creating a new
      // message bubble — but only when no user message followed (which would
      // indicate an interruption and a genuinely new bot turn).
      if (
        lastAssistant?.final &&
        lastAssistantIndex === store.messages.length - 1
      ) {
        const messageId = lastAssistant.createdAt;
        const cursor = store.botOutputMessageState.get(messageId);
        if (cursor && hasUnspokenContent(cursor, lastAssistant.parts || [])) {
          updateLastMessage("assistant", { final: false });
          return false;
        }
      }

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

  useRTVIClientEvent(RTVIEvent.BotOutput, (data: BotOutputData) => {
    // A BotOutput event means the response is still active; cancel any
    // pending finalize timer from BotStoppedSpeaking to avoid premature
    // finalization mid-response.
    clearTimeout(botStoppedSpeakingTimeoutRef.current);
    botStoppedSpeakingTimeoutRef.current = undefined;

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

  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, () => {
    // Don't finalize immediately; start a timer. Bot may start speaking again (pause).
    clearTimeout(botStoppedSpeakingTimeoutRef.current);
    const store = useConversationStore.getState();
    const lastAssistant = store.messages.findLast(
      (m: ConversationMessage) => m.role === "assistant",
    );
    if (!lastAssistant || lastAssistant.final) return;
    botStoppedSpeakingTimeoutRef.current = setTimeout(() => {
      botStoppedSpeakingTimeoutRef.current = undefined;
      finalizeLastMessage("assistant");
    }, BOT_STOPPED_FINALIZE_DELAY_MS);
  });

  useRTVIClientEvent(RTVIEvent.BotStartedSpeaking, () => {
    // Bot is speaking again; reset the finalize timer (bot was just pausing).
    clearTimeout(botStoppedSpeakingTimeoutRef.current);
    botStoppedSpeakingTimeoutRef.current = undefined;
  });

  useRTVIClientEvent(RTVIEvent.UserStartedSpeaking, () => {
    // User started a new turn; bot's turn is done. Fast-forward: finalize immediately.
    finalizeLastAssistantMessageIfPending();
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

  // LLM Function Call lifecycle events
  useRTVIClientEvent(
    RTVIEvent.LLMFunctionCallStarted,
    (data: LLMFunctionCallStartedData) => {
      handleFunctionCallStarted({ function_name: data.function_name });
    },
  );

  useRTVIClientEvent(
    RTVIEvent.LLMFunctionCallInProgress,
    (data: LLMFunctionCallInProgressData) => {
      handleFunctionCallInProgress({
        function_name: data.function_name,
        tool_call_id: data.tool_call_id,
        args: data.arguments,
      });
    },
  );

  useRTVIClientEvent(
    RTVIEvent.LLMFunctionCallStopped,
    (data: LLMFunctionCallStoppedData) => {
      handleFunctionCallStopped({
        function_name: data.function_name,
        tool_call_id: data.tool_call_id,
        result: data.result,
        cancelled: data.cancelled,
      });
    },
  );

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
