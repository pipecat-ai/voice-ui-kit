import { RTVIEvent } from "@pipecat-ai/client-js";
import { useRTVIClientEvent } from "@pipecat-ai/client-react";

/**
 * Callbacks for handling legacy TTS/LLM bot message events.
 * This hook only handles legacy events - BotOutput events should be handled separately.
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
   */
  onBotMessageChunk?: (type: "llm" | "tts", text: string) => void;
  /**
   * Called when a bot message stream ends for a given type.
   * @param type - The message type: "llm" for unspoken content, "tts" for spoken content
   */
  onBotMessageEnded?: (type: "llm" | "tts") => void;
}

/**
 * Hook for handling legacy TTS/LLM bot message events.
 *
 * This hook only handles legacy BotLlm* and BotTts* events. BotOutput events should be
 * handled separately by the consuming component. The caller should check botOutputSupported
 * before using this hook.
 *
 * @param callbacks - Callback functions for handling bot message events
 * @param botOutputSupported - Whether BotOutput is supported (if true, these handlers won't be called)
 */
export function useBotMessages(
  callbacks: UseBotMessagesCallbacks,
  botOutputSupported: boolean = false,
) {
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
}
