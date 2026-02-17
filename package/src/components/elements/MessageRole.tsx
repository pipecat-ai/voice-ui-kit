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
   * Custom label for function call messages
   * @default "function call"
   */
  functionCallLabel?: string;
  /**
   * Custom CSS classes for the role label
   */
  className?: string;
  /**
   * The role of the message
   */
  role: "user" | "assistant" | "system" | "function_call";
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
  functionCallLabel = "function call",
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
      function_call: functionCallLabel,
    }),
    [assistantLabel, clientLabel, systemLabel, functionCallLabel],
  );

  return (
    <div
      className={cn(
        "font-semibold font-mono text-xs leading-6 w-max",
        {
          "text-client": role === "user",
          "text-agent": role === "assistant",
          "text-subtle": role === "system" || role === "function_call",
        },
        className,
      )}
    >
      {roleLabelMap[role] || role}
    </div>
  );
};
