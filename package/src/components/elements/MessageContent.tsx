import { cn } from "@/lib/utils";
import {
  BotOutputText,
  ConversationMessage,
  ConversationMessagePart,
} from "@/types/conversation";
import { Fragment } from "react";
import Thinking from "./Thinking";

type CustomBotOutputRenderer = (
  content: string,
  metadata: { spoken: string; unspoken: string },
) => React.ReactNode;

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
  /**
   * Custom renderers for BotOutput content based on aggregation type
   * Key is the aggregation type (e.g., "code", "link"), value is a renderer function
   */
  botOutputRenderers?: Record<string, CustomBotOutputRenderer>;
}

/**
 * Renders BotOutput content based on the aggregation type. Uses a custom renderer if provided, otherwise renders the spoken and unspoken text.
 * @param spoken - The spoken text
 * @param unspoken - The unspoken text
 * @param aggregatedBy - The aggregation type
 * @param customRenderer - A custom renderer function
 * @returns The rendered content
 */
const renderBotOutput = (
  spoken: string,
  unspoken: string,
  aggregatedBy?: string,
  customRenderer?: CustomBotOutputRenderer,
): React.ReactNode => {
  // Use custom renderer if provided and aggregation type matches
  if (aggregatedBy && customRenderer) {
    const content = spoken + unspoken;
    return customRenderer(content, { spoken, unspoken });
  }

  // Default rendering
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

/**
 * Checks if a message is empty (has no parts or all parts are empty).
 * A part is considered empty if:
 * - It's a string and contains only whitespace, or
 * - It's a BotOutputText object with both spoken and unspoken text being empty/whitespace
 * @param message - The conversation message to check
 * @returns true if the message has no parts or all parts are empty, false otherwise
 */
const isEmptyMessage = (message: ConversationMessage): boolean => {
  const parts = Array.isArray(message.parts) ? message.parts : [];
  if (parts.length === 0) {
    return true;
  }
  return parts.every((part) => {
    if (typeof part.text === "string") {
      return part.text.trim() === "";
    }
    if (
      part.text &&
      typeof part.text === "object" &&
      "spoken" in part.text &&
      "unspoken" in part.text
    ) {
      return part.text.spoken.trim() === "" && part.text.unspoken.trim() === "";
    }
    return false;
  });
};

export const MessageContent = ({
  botOutputRenderers,
  classNames = {},
  message,
}: Props) => {
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
          const customRenderer = part.aggregatedBy
            ? botOutputRenderers?.[part.aggregatedBy]
            : undefined;
          content = renderBotOutput(
            botText.spoken,
            botText.unspoken,
            part.aggregatedBy,
            customRenderer,
          );
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
      {isEmptyMessage(message) ? (
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
