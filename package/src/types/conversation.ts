import { type ReactNode } from "react";

export interface ConversationMessagePart {
  text: string | ReactNode;
  final: boolean;
  createdAt: string;
}

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  final?: boolean;
  parts: ConversationMessagePart[];
  createdAt: string;
  updatedAt?: string;
}
