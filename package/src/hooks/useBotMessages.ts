import { BotOutputData, BotReadyData, RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import { useRef, useState } from "react";
import { isMinVersion } from "@/utils/version";

/**
 * Metadata for bot message chunks (only available for BotOutput events)
 */
export interface BotMessageChunkMetadata {
  /**
   * The aggregation type used for this output (e.g., "sentence", "word")
   */
  aggregated_by?: "sentence" | "word" | string;
}

/**
 * Unified callbacks for handling bot message events.
 * The distinction between BotOutput and legacy events is handled internally.
 */
export interface UseBotMessagesCallbacks {
  /**
   * Called when a bot message stream starts for a given type.
   * @param type - The message type: "llm" for unspoken content, "tts" for spoken content
   */
  onBotMessageStarted?: (type: "llm" | "tts") => void;
  /**
   * Called for each text chunk in a bot message stream.
   * @param type - The message type: "llm" for unspoken content, "tts" for spoken content
   * @param text - The text chunk
   * @param metadata - Optional metadata (only available for BotOutput events)
   */
  onBotMessageChunk?: (
    type: "llm" | "tts",
    text: string,
    metadata?: BotMessageChunkMetadata,
  ) => void;
  /**
   * Called when a bot message stream ends for a given type.
   * @param type - The message type: "llm" for unspoken content, "tts" for spoken content
   */
  onBotMessageEnded?: (type: "llm" | "tts") => void;
}

/**
 * Hook for handling bot messages with automatic BotOutput support detection and fallback.
 *
 * This hook automatically detects whether the server supports BotOutput events by checking
 * the BotReady event's RTVI protocol version. BotOutput is supported in RTVI 1.1.0+.
 * Once support is determined, it routes events accordingly.
 *
 * @param callbacks - Callback functions for handling bot message events
 * @returns Object containing botOutputSupported status
 */
export function useBotMessages(callbacks: UseBotMessagesCallbacks) {
  const [botOutputSupported, setBotOutputSupported] = useState<boolean>(false);

  // Track message stream state for BotOutput events
  const botOutputStreamStateRef = useRef<{
    llmStarted: boolean;
    ttsStarted: boolean;
    lastChunkText: { llm: string; tts: string };
  }>({
    llmStarted: false,
    ttsStarted: false,
    lastChunkText: { llm: "", tts: "" },
  });

  // Reset state on connection
  useRTVIClientEvent(RTVIEvent.Connected, () => {
    setBotOutputSupported(false);
    botOutputStreamStateRef.current = {
      llmStarted: false,
      ttsStarted: false,
      lastChunkText: { llm: "", tts: "" },
    };
  });

  // Check BotOutput support from BotReady event
  useRTVIClientEvent(RTVIEvent.BotReady, (botData: BotReadyData) => {
    const rtviVersion = botData.version;
    const supportsBotOutput = isMinVersion(rtviVersion, [1, 1, 0]);
    setBotOutputSupported(supportsBotOutput);

    // Reset stream state when BotReady is received
    botOutputStreamStateRef.current = {
      llmStarted: false,
      ttsStarted: false,
      lastChunkText: { llm: "", tts: "" },
    };
  });

  // BotOutput handler - maps to unified callbacks
  useRTVIClientEvent(RTVIEvent.BotOutput, (data: BotOutputData) => {
    // Derive message type from BotOutput data
    const type: "llm" | "tts" = data.spoken ? "tts" : "llm";

    // Check if this is the first BotOutput for this type in the current turn
    const streamState = botOutputStreamStateRef.current;
    const isFirstForType =
      (type === "llm" && !streamState.llmStarted) ||
      (type === "tts" && !streamState.ttsStarted);

    if (isFirstForType) {
      callbacks.onBotMessageStarted?.(type);
      if (type === "llm") {
        streamState.llmStarted = true;
      } else {
        streamState.ttsStarted = true;
      }
    }

    // Process the text chunk with proper spacing for BotOutput
    if (data.text) {
      const lastChunk = botOutputStreamStateRef.current.lastChunkText[type];
      let textToSend = data.text;

      // Add space separator if needed between BotOutput chunks
      if (lastChunk) {
        textToSend = " " + textToSend;
      }

      // Include metadata for BotOutput events
      const metadata: BotMessageChunkMetadata = {
        aggregated_by: data.aggregated_by,
      };

      callbacks.onBotMessageChunk?.(type, textToSend, metadata);
      botOutputStreamStateRef.current.lastChunkText[type] = textToSend;
    }
  });

  // Handle BotStoppedSpeaking to signal end of message streams
  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, () => {
    if (botOutputSupported) {
      // For BotOutput, signal end for any active streams
      const streamState = botOutputStreamStateRef.current;
      if (streamState.llmStarted) {
        callbacks.onBotMessageEnded?.("llm");
      }
      if (streamState.ttsStarted) {
        callbacks.onBotMessageEnded?.("tts");
      }
      // Reset stream state
      botOutputStreamStateRef.current = {
        llmStarted: false,
        ttsStarted: false,
        lastChunkText: { llm: "", tts: "" },
      };
    }
  });

  // Handle legacy BotLlmStarted events
  useRTVIClientEvent(RTVIEvent.BotLlmStarted, () => {
    if (botOutputSupported) return;
    callbacks.onBotMessageStarted?.("llm");
  });

  useRTVIClientEvent(RTVIEvent.BotLlmText, (data) => {
    if (botOutputSupported) return;
    callbacks.onBotMessageChunk?.("llm", data.text);
  });

  useRTVIClientEvent(RTVIEvent.BotLlmStopped, () => {
    if (botOutputSupported) return;
    callbacks.onBotMessageEnded?.("llm");
  });

  useRTVIClientEvent(RTVIEvent.BotTtsStarted, () => {
    if (botOutputSupported) return;
    callbacks.onBotMessageStarted?.("tts");
  });

  useRTVIClientEvent(RTVIEvent.BotTtsText, (data) => {
    if (botOutputSupported) return;
    callbacks.onBotMessageChunk?.("tts", data.text);
  });

  useRTVIClientEvent(RTVIEvent.BotTtsStopped, () => {
    if (botOutputSupported) return;
    callbacks.onBotMessageEnded?.("tts");
  });

  return {
    botOutputSupported,
  };
}
