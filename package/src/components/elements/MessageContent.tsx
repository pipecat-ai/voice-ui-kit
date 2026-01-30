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

function isBotOutputText(
  part: ConversationMessagePart,
): part is ConversationMessagePart & { text: BotOutputText } {
  const text = part.text;
  return (
    text !== null &&
    typeof text === "object" &&
    "spoken" in text &&
    "unspoken" in text
  );
}

const renderPartContent = (
  part: ConversationMessagePart,
  botOutputRenderers?: Record<string, CustomBotOutputRenderer>,
  aggregationMetadata?: Record<string, AggregationMetadata>,
): React.ReactNode => {
  if (!part.text) return null;
  if (isBotOutputText(part)) {
    const text = part.text as BotOutputText;
    const customRenderer = part.aggregatedBy
      ? botOutputRenderers?.[part.aggregatedBy]
      : undefined;
    const metadata = part.aggregatedBy
      ? aggregationMetadata?.[part.aggregatedBy]
      : undefined;
    return renderBotOutput(
      text.spoken,
      text.unspoken,
      part.aggregatedBy,
      customRenderer,
      metadata,
    );
  }
  return part.text as React.ReactNode;
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
                const content = renderPartContent(
                  part,
                  botOutputRenderers,
                  aggregationMetadata,
                );
                const shouldAddSpace = partIdx > 0 && !isBotOutputText(part);

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
              {group.parts.map((part, partIdx) => (
                <Fragment key={partIdx}>
                  {renderPartContent(
                    part,
                    botOutputRenderers,
                    aggregationMetadata,
                  )}
                </Fragment>
              ))}
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
