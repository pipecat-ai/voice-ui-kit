import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface Props {
  /**
   * Custom label for assistant messages
   * @default "assistant"
   */
  assistantLabel?: string;
  /**
   * Custom label for user/client messages
   * @default "user"
   */
  clientLabel?: string;
  /**
   * Custom label for system messages
   * @default "system"
   */
  systemLabel?: string;
  /**
   * Custom CSS classes for the role label
   */
  className?: string;
  /**
   * The role of the message
   */
  role: "user" | "assistant" | "system";
}

/**
 * MessageRole component that displays the role of a message
 *
 * @example
 * ```tsx
 * import { MessageRole } from "@pipecat-ai/voice-ui-kit";
 *
 * <MessageRole role="assistant" />
 * ```
 */
export const MessageRole = ({
  assistantLabel = "assistant",
  clientLabel = "user",
  systemLabel = "system",
  className,
  role,
}: Props) => {
  /**
   * Maps message roles to their display labels
   * @returns Object mapping role keys to display labels
   */
  const roleLabelMap = useMemo(
    () => ({
      user: clientLabel,
      assistant: assistantLabel,
      system: systemLabel,
    }),
    [assistantLabel, clientLabel, systemLabel],
  );

  return (
    <div
      className={cn(
        "font-semibold font-mono text-xs leading-6 w-max",
        {
          "text-client": role === "user",
          "text-agent": role === "assistant",
          "text-subtle": role === "system",
        },
        className,
      )}
    >
      {roleLabelMap[role] || role}
    </div>
  );
};
