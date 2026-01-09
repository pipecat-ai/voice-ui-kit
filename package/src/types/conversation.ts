import { type ReactNode } from "react";

/**
 * BotOutput text structure for messages in BotOutput mode
 */
export interface BotOutputText {
  spoken: string;
  unspoken: string;
}

export interface ConversationMessagePart {
  text: string | ReactNode | BotOutputText;
  final: boolean;
  createdAt: string;
  /**
   * Aggregation type for BotOutput content (e.g., "code", "link", "sentence", "word")
   * Used to determine which custom renderer to use, if any
   */
  aggregatedBy?: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  final?: boolean;
  parts: ConversationMessagePart[];
  createdAt: string;
  updatedAt?: string;
  /**
   * Message mode: "tts/llm" for legacy TTS/LLM events, "botOutput" for BotOutput events
   */
  mode?: "tts/llm" | "botOutput";
}
