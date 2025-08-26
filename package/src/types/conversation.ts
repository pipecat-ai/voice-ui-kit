import { type ReactNode } from "react";

export interface ConversationMessage {
  role: "user" | "assistant" | "system";
  content: string | ReactNode;
  final?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationContextType {
  messages: ConversationMessage[];
  injectMessage: (message: {
    role: "user" | "assistant" | "system";
    content: string | ReactNode;
  }) => void;
}
