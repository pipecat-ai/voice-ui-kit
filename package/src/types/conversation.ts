export type {
  AggregationMetadata,
  BotOutputEvent,
  BotOutputText,
  ConversationMessage,
  ConversationMessagePart,
  FunctionCallData,
  FunctionCallRenderer,
} from "@pipecat-ai/client-react";

/** Controls how bot message text is rendered in the UI */
export type TextRenderMode = "karaoke" | "captions" | "instant";
