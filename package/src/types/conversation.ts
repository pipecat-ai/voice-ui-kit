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

/**
 * Text mode for conversation display (only used in TTS/LLM mode)
 */
export type TextMode = "llm" | "tts";
