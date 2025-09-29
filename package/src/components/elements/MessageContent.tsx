import { cn } from "@/lib/utils";
import {
  ConversationMessage,
  ConversationMessagePart,
} from "@/types/conversation";
import { Fragment } from "react";
import Thinking from "./Thinking";

interface Props {
  /**
   * Custom CSS classes for the component
   */
  classNames?: {
    /**
     * Custom CSS classes for the message content
     */
    messageContent?: string;
    /**
     * Custom CSS classes for the thinking
     */
    thinking?: string;
    /**
     * Custom CSS classes for the time
     */
    time?: string;
  };
  /**
   * The message to display
   */
  message: ConversationMessage;
}

export const MessageContent = ({ classNames = {}, message }: Props) => {
  const parts = Array.isArray(message.parts) ? message.parts : [];
  return (
    <div className={cn("flex flex-col gap-2", classNames.messageContent)}>
      {parts.map((part: ConversationMessagePart, idx: number) => {
        const nextPart = parts?.[idx + 1] ?? null;
        const isText = typeof part.text === "string";
        const nextIsText = nextPart && typeof nextPart.text === "string";
        return (
          <Fragment key={idx}>
            {isText ? part.text : part.text}
            {isText && nextIsText ? " " : null}
          </Fragment>
        );
      })}
      {parts.length === 0 ||
      parts.every(
        (part) => typeof part.text === "string" && part.text.trim() === "",
      ) ? (
        <Thinking className={classNames.thinking} />
      ) : null}
      <div
        className={cn("self-end text-xs text-gray-500 mb-1", classNames.time)}
      >
        {new Date(message.createdAt).toLocaleTimeString()}
      </div>
    </div>
  );
};
