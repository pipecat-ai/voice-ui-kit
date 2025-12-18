import { BotOutputData, BotReadyData, RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";
import { useCallback, useRef, useState } from "react";
import { isMinVersion } from "@/utils/version";

/**
 * Cached data from old BotTts/BotLlm events during probe period
 */
interface CachedBotEvents {
  llmText: string;
  ttsText: string;
  llmStarted: boolean;
  ttsStarted: boolean;
  llmStopped: boolean;
  ttsStopped: boolean;
}

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
 * the BotReady event's library version information. BotOutput is supported in pipecat 0.0.98+.
 * During the period before BotReady is received, it caches old event data. Once support is
 * determined, it applies cached data and routes events accordingly.
 *
 * @param callbacks - Callback functions for handling bot message events
 * @returns Object containing botOutputSupported status
 */
export function useBotMessages(callbacks: UseBotMessagesCallbacks) {
  const [botOutputSupported, setBotOutputSupported] = useState<boolean | null>(
    null,
  ); // null = unknown, true = supported, false = not supported

  const cachedEventsRef = useRef<CachedBotEvents>({
    llmText: "",
    ttsText: "",
    llmStarted: false,
    ttsStarted: false,
    llmStopped: false,
    ttsStopped: false,
  });

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
    setBotOutputSupported(null);
    cachedEventsRef.current = {
      llmText: "",
      ttsText: "",
      llmStarted: false,
      ttsStarted: false,
      llmStopped: false,
      ttsStopped: false,
    };
    botOutputStreamStateRef.current = {
      llmStarted: false,
      ttsStarted: false,
      lastChunkText: { llm: "", tts: "" },
    };
  });

  // Check BotOutput support from BotReady event
  useRTVIClientEvent(RTVIEvent.BotReady, (botData: BotReadyData) => {
    // Type guard to check if about has the expected structure
    const about =
      botData.about &&
      typeof botData.about === "object" &&
      "library" in botData.about &&
      "library_version" in botData.about
        ? (botData.about as { library: string; library_version: string })
        : undefined;

    // Check if library information is available
    if (about?.library && about?.library_version) {
      // BotOutput is supported in pipecat 0.0.98+
      const supportsBotOutput = isMinVersion(about.library_version, [0, 0, 98]);
      setBotOutputSupported(supportsBotOutput);

      // If we determined support and have cached data, apply it
      if (supportsBotOutput) {
        applyCachedData();
        // Reset stream state after applying cached data
        botOutputStreamStateRef.current = {
          llmStarted: false,
          ttsStarted: false,
          lastChunkText: { llm: "", tts: "" },
        };
      } else if (!supportsBotOutput) {
        // If BotOutput is not supported, apply cached data as legacy events
        applyCachedData();
      }
    } else {
      // No library information available - assume BotOutput is not supported
      setBotOutputSupported(false);
      // Apply any cached data as legacy events
      applyCachedData();
    }
  });

  // Apply cached data helper
  const applyCachedData = useCallback(() => {
    const cached = cachedEventsRef.current;

    // Apply cached started events
    if (cached.llmStarted) {
      callbacks.onBotMessageStarted?.("llm");
    }
    if (cached.ttsStarted) {
      callbacks.onBotMessageStarted?.("tts");
    }

    // Apply cached text chunks
    if (cached.llmText) {
      callbacks.onBotMessageChunk?.("llm", cached.llmText);
    }
    if (cached.ttsText) {
      callbacks.onBotMessageChunk?.("tts", cached.ttsText);
    }

    // Apply cached ended events
    if (cached.llmStopped) {
      callbacks.onBotMessageEnded?.("llm");
    }
    if (cached.ttsStopped) {
      callbacks.onBotMessageEnded?.("tts");
    }

    // Clear cache after applying
    cachedEventsRef.current = {
      llmText: "",
      ttsText: "",
      llmStarted: false,
      ttsStarted: false,
      llmStopped: false,
      ttsStopped: false,
    };
  }, [callbacks]);

  // BotOutput handler - maps to unified callbacks
  useRTVIClientEvent(RTVIEvent.BotOutput, (data: BotOutputData) => {
    // Only process BotOutput if it's supported
    if (botOutputSupported === true) {
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
        if (
          lastChunk &&
          !lastChunk.endsWith(" ") &&
          !textToSend.startsWith(" ")
        ) {
          textToSend = " " + textToSend;
        }

        // Include metadata for BotOutput events
        const metadata: BotMessageChunkMetadata = {
          aggregated_by: data.aggregated_by,
        };

        callbacks.onBotMessageChunk?.(type, textToSend, metadata);
        botOutputStreamStateRef.current.lastChunkText[type] = textToSend;
      }

      // If this is a sentence-level output, it might indicate completion
      // However, we'll rely on BotStoppedSpeaking for definitive end detection
    }
  });

  // Handle BotStoppedSpeaking to signal end of message streams
  useRTVIClientEvent(RTVIEvent.BotStoppedSpeaking, () => {
    if (botOutputSupported === true) {
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
    // Handle the event based on support status
    if (botOutputSupported === false) {
      callbacks.onBotMessageStarted?.("llm");
    } else if (botOutputSupported === null) {
      // Cache during period before BotReady is received
      cachedEventsRef.current.llmStarted = true;
    }
  });

  useRTVIClientEvent(RTVIEvent.BotLlmText, (data) => {
    if (botOutputSupported === false) {
      callbacks.onBotMessageChunk?.("llm", data.text);
    } else if (botOutputSupported === null) {
      // Cache during period before BotReady is received with proper spacing
      const cached = cachedEventsRef.current.llmText;
      cachedEventsRef.current.llmText +=
        (cached && !cached.endsWith(" ") && !data.text.startsWith(" ")
          ? " "
          : "") + data.text;
    }
  });

  useRTVIClientEvent(RTVIEvent.BotLlmStopped, () => {
    if (botOutputSupported === false) {
      callbacks.onBotMessageEnded?.("llm");
    } else if (botOutputSupported === null) {
      // Cache during period before BotReady is received
      cachedEventsRef.current.llmStopped = true;
    }
  });

  useRTVIClientEvent(RTVIEvent.BotTtsStarted, () => {
    if (botOutputSupported === false) {
      callbacks.onBotMessageStarted?.("tts");
    } else if (botOutputSupported === null) {
      // Cache during period before BotReady is received
      cachedEventsRef.current.ttsStarted = true;
    }
  });

  useRTVIClientEvent(RTVIEvent.BotTtsText, (data) => {
    if (botOutputSupported === false) {
      callbacks.onBotMessageChunk?.("tts", data.text);
    } else if (botOutputSupported === null) {
      // Cache during period before BotReady is received with proper spacing
      const cached = cachedEventsRef.current.ttsText;
      cachedEventsRef.current.ttsText +=
        (cached && !cached.endsWith(" ") && !data.text.startsWith(" ")
          ? " "
          : "") + data.text;
    }
  });

  useRTVIClientEvent(RTVIEvent.BotTtsStopped, () => {
    if (botOutputSupported === false) {
      callbacks.onBotMessageEnded?.("tts");
    } else if (botOutputSupported === null) {
      // Cache during period before BotReady is received
      cachedEventsRef.current.ttsStopped = true;
    }
  });

  return {
    botOutputSupported,
  };
}
