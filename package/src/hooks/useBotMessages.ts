import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";

/**
 * Callbacks for handling raw TTS/LLM bot message events.
 * This hook handles raw BotLlm* and BotTts* events.
 */
export interface UseBotMessagesCallbacks {
  /**
   * Called when a bot message stream starts for a given type.
   * @param type - The message type: "llm" for LLM events, "tts" for TTS events
   */
  onBotMessageStarted?: (type: "llm" | "tts") => void;
  /**
   * Called for each text chunk in a bot message stream.
   * @param type - The message type: "llm" for LLM events, "tts" for TTS events
   * @param text - The text chunk
   */
  onBotMessageChunk?: (type: "llm" | "tts", text: string) => void;
  /**
   * Called when a bot message stream ends for a given type.
   * @param type - The message type: "llm" for LLM events, "tts" for TTS events
   */
  onBotMessageEnded?: (type: "llm" | "tts") => void;
}

/**
 * Hook for handling raw TTS/LLM bot message events.
 *
 * This hook handles raw BotLlm* and BotTts* events, which are conceptually different
 * from BotOutput events. BotOutput events should be handled separately by the consuming
 * component. The caller should check botOutputSupported before using this hook.
 *
 * @param callbacks - Callback functions for handling raw TTS/LLM bot message events
 * @param botOutputSupported - Whether BotOutput is supported (if true, these handlers won't be called)
 */
export function useBotMessages(
  callbacks: UseBotMessagesCallbacks,
  botOutputSupported: boolean = false,
) {
  // Handle raw BotLlmStarted events
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
}
