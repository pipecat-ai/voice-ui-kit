import { type ReactNode } from "react";

/**
 * Custom renderer for function call messages in the conversation.
 * Receives the full FunctionCallData so developers can render differently
 * based on function name, status, args, and result.
 */
export type FunctionCallRenderer = (
  functionCall: FunctionCallData,
) => ReactNode;

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

/**
 * Data associated with an LLM function call message.
 * Present only when role === "function_call".
 */
export interface FunctionCallData {
  /** The name of the function being called */
  function_name?: string;
  /** Unique identifier for this tool call */
  tool_call_id?: string;
  /** Arguments passed to the function */
  args?: Record<string, unknown>;
  /** Result of the function call (populated when complete) */
  result?: unknown;
  /** Whether the function call was cancelled */
  cancelled?: boolean;
  /** Current status of the function call */
  status: "started" | "in_progress" | "completed";
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
   * Aggregation type for BotOutput content (e.g., "code", "link", "sentence", "word", "token")
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
  role: "user" | "assistant" | "system" | "function_call";
  final?: boolean;
  parts: ConversationMessagePart[];
  createdAt: string;
  updatedAt?: string;
  /** Function call data, present only when role is "function_call" */
  functionCall?: FunctionCallData;
}
