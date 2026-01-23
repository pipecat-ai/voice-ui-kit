import { cn } from "@/lib/utils";
import { isMessageEmpty } from "@/stores/conversationStore";
import {
  AggregationMetadata,
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
  /**
   * Metadata for aggregation types to control rendering and speech progress behavior
   * Key is the aggregation type (e.g., "code", "link"), value is metadata configuration
   */
  aggregationMetadata?: Record<string, AggregationMetadata>;
}

/**
 * Renders BotOutput content based on the aggregation type. Uses a custom renderer if provided, otherwise renders the spoken and unspoken text.
 * @param spoken - The spoken text (already split from unspoken text to preserve punctuation)
 * @param unspoken - The unspoken text (remaining portion after spoken position)
 * @param aggregatedBy - The aggregation type
 * @param customRenderer - A custom renderer function
 * @param metadata - Metadata for the aggregation type
 * @returns The rendered content
 */
const renderBotOutput = (
  spoken: string,
  unspoken: string,
  aggregatedBy?: string,
  customRenderer?: CustomBotOutputRenderer,
  metadata?: AggregationMetadata,
): React.ReactNode => {
  // Use custom renderer if provided and aggregation type matches
  if (aggregatedBy && customRenderer) {
    const content = spoken + unspoken;
    return customRenderer(content, { spoken, unspoken });
  }

  // Default rendering - unspoken is already split at the correct position
  const displayMode = metadata?.displayMode || "inline";
  const Wrapper = displayMode === "block" ? "div" : "span";

  return (
    <Wrapper>
      {spoken}
      {unspoken && <span className="text-muted-foreground">{unspoken}</span>}
    </Wrapper>
  );
};

export const MessageContent = ({
  botOutputRenderers,
  aggregationMetadata,
  classNames = {},
  message,
}: Props) => {
  const parts = Array.isArray(message.parts) ? message.parts : [];

  // Group parts by display mode: inline parts together, block parts separate
  const groupedParts: Array<{
    type: "inline" | "block";
    parts: ConversationMessagePart[];
  }> = [];

  let currentInlineGroup: ConversationMessagePart[] = [];

  for (const part of parts) {
    const metadata = part.aggregatedBy
      ? aggregationMetadata?.[part.aggregatedBy]
      : undefined;
    const displayMode = part.displayMode ?? metadata?.displayMode ?? "inline";

    if (displayMode === "block") {
      // Flush any accumulated inline parts
      if (currentInlineGroup.length > 0) {
        groupedParts.push({ type: "inline", parts: currentInlineGroup });
        currentInlineGroup = [];
      }
      // Add block part separately
      groupedParts.push({ type: "block", parts: [part] });
    } else {
      // Accumulate inline parts
      currentInlineGroup.push(part);
    }
  }

  // Flush remaining inline parts
  if (currentInlineGroup.length > 0) {
    groupedParts.push({ type: "inline", parts: currentInlineGroup });
  }

  return (
    <div className={cn("flex flex-col gap-2", classNames.messageContent)}>
      {groupedParts.map((group, groupIdx) => {
        if (group.type === "inline") {
          // Render inline parts together in a single line
          return (
            <div key={groupIdx} className="inline-block">
              {group.parts.map((part, partIdx) => {
                const isBotOutputTextValue = Boolean(
                  part.text &&
                    typeof part.text === "object" &&
                    "spoken" in part.text &&
                    "unspoken" in part.text,
                );

                const metadata = part.aggregatedBy
                  ? aggregationMetadata?.[part.aggregatedBy]
                  : undefined;

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
                    metadata,
                  );
                } else {
                  content = part.text as React.ReactNode;
                }

                const shouldAddSpace = partIdx > 0 && !isBotOutputTextValue;

                return (
                  <Fragment key={partIdx}>
                    {shouldAddSpace && " "}
                    {content}
                  </Fragment>
                );
              })}
            </div>
          );
        } else {
          // Render block parts separately (each on its own line)
          return (
            <Fragment key={groupIdx}>
              {group.parts.map((part, partIdx) => {
                const isBotOutputTextValue = Boolean(
                  part.text &&
                    typeof part.text === "object" &&
                    "spoken" in part.text &&
                    "unspoken" in part.text,
                );

                const metadata = part.aggregatedBy
                  ? aggregationMetadata?.[part.aggregatedBy]
                  : undefined;

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
                    metadata,
                  );
                } else {
                  content = part.text as React.ReactNode;
                }

                return <Fragment key={partIdx}>{content}</Fragment>;
              })}
            </Fragment>
          );
        }
      })}
      {isMessageEmpty(message) ? (
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
