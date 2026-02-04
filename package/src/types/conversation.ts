import { type ReactNode } from "react";

/**
 * BotOutput text structure for messages in BotOutput mode
 */
export interface BotOutputText {
  spoken: string;
  unspoken: string;
}

/**
 * Metadata for aggregation types to control rendering and speech progress behavior
 */
export interface AggregationMetadata {
  /**
   * Whether the content of this aggregation type is expected to be spoken.
   * If false, it will be skipped from karaoke-style highlighting and position-based splitting.
   * @default true
   */
  isSpoken?: boolean;
  /**
   * How the aggregation should be rendered.
   * - 'inline': Rendered inline with surrounding text
   * - 'block': Rendered as a block element (e.g., code blocks)
   * @default 'inline'
   */
  displayMode?: "inline" | "block";
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
  /**
   * Display mode for BotOutput content.
   * - "inline": Rendered inline with surrounding text (default for sentence-level)
   * - "block": Rendered as a block element (e.g., code blocks)
   * @default "inline"
   */
  displayMode?: "inline" | "block";
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  final?: boolean;
  parts: ConversationMessagePart[];
  createdAt: string;
  updatedAt?: string;
}
