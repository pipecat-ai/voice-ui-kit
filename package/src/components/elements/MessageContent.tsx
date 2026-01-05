import { cn } from "@/lib/utils";
import {
  BotOutputText,
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

/**
 * Renders BotOutput mode: shows unspoken text muted, spoken text replaces it
 */
const renderBotOutput = (spoken: string, unspoken: string): React.ReactNode => {
  const spokenLength = spoken?.length || 0;
  const remainingUnspoken = unspoken ? unspoken.slice(spokenLength) : "";

  return (
    <span>
      {spoken}
      {remainingUnspoken && (
        <span className="text-muted-foreground">{remainingUnspoken}</span>
      )}
    </span>
  );
};

export const MessageContent = ({ classNames = {}, message }: Props) => {
  const parts = Array.isArray(message.parts) ? message.parts : [];

  return (
    <div className={cn("flex flex-col gap-2", classNames.messageContent)}>
      {parts.map((part: ConversationMessagePart, idx: number) => {
        const isBotOutputTextValue = Boolean(
          part.text &&
            typeof part.text === "object" &&
            "spoken" in part.text &&
            "unspoken" in part.text,
        );

        let content: React.ReactNode;
        if (isBotOutputTextValue) {
          const botText = part.text as BotOutputText;
          content = renderBotOutput(botText.spoken, botText.unspoken);
        } else {
          content = part.text as React.ReactNode;
        }

        return (
          <Fragment key={idx}>
            {idx > 0 && " "}
            {content}
          </Fragment>
        );
      })}
      {parts.length === 0 ||
      parts.every((part) => {
        if (typeof part.text === "string") {
          return part.text.trim() === "";
        }
        if (
          part.text &&
          typeof part.text === "object" &&
          "spoken" in part.text &&
          "unspoken" in part.text
        ) {
          const botText = part.text as unknown as BotOutputText;
          return botText.spoken.trim() === "" && botText.unspoken.trim() === "";
        }
        return false;
      }) ? (
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
