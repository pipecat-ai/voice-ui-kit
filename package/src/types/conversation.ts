import { type ReactNode } from "react";

/**
 * BotOutput text structure for messages in BotOutput mode
 */
export interface BotOutputText {
  spoken: string;
  unspoken: string;
}

export interface ConversationMessagePart {
  /**
   * Text content for the message part.
   * - BotOutputText: For assistant messages with spoken/unspoken text
   * - ReactNode: For user messages (strings) or custom injected content
   */
  text: ReactNode | BotOutputText;
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
}
