import { cn } from "@/lib/utils";
import type {
  AggregationMetadata,
  ConversationMessage,
  FunctionCallRenderer,
} from "@/types/conversation";
import { MessageRole } from "./MessageRole";
import { MessageContent } from "./MessageContent";
import { FunctionCallContent } from "./FunctionCallContent";

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
   * Custom label for function call entries
   * @default "function call"
   */
  functionCallLabel?: string;
  /**
   * Custom renderer for function call messages.
   * When provided, replaces the default function call rendering.
   */
  functionCallRenderer?: FunctionCallRenderer;
  /**
   * Custom CSS classes for the component
   */
  classNames?: {
    /**
     * Custom CSS classes for the container
     */
    container?: string;
    /**
     * Custom CSS classes for the message content
     */
    messageContent?: string;
    /**
     * Custom CSS classes for the role
     */
    role?: string;
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
   */
  botOutputRenderers?: React.ComponentProps<
    typeof MessageContent
  >["botOutputRenderers"];
  /**
   * Metadata for aggregation types to control rendering and speech progress behavior
   */
  aggregationMetadata?: Record<string, AggregationMetadata>;
}

export const MessageContainer = ({
  assistantLabel,
  clientLabel,
  systemLabel,
  functionCallLabel,
  functionCallRenderer,
  classNames = {},
  message,
  botOutputRenderers,
  aggregationMetadata,
}: Props) => {
  if (message.role === "function_call" && message.functionCall) {
    return (
      <div className={cn("flex flex-col gap-2", classNames.container)}>
        <FunctionCallContent
          functionCall={message.functionCall}
          functionCallLabel={functionCallLabel}
          functionCallRenderer={functionCallRenderer}
        />
        <div
          className={cn("self-end text-xs text-gray-500 mb-1", classNames.time)}
        >
          {new Date(message.createdAt).toLocaleTimeString()}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-2", classNames.container)}>
      <MessageRole
        assistantLabel={assistantLabel}
        clientLabel={clientLabel}
        systemLabel={systemLabel}
        functionCallLabel={functionCallLabel}
        className={classNames.role}
        role={message.role}
      />
      <MessageContent
        classNames={{
          messageContent: classNames.messageContent,
          thinking: classNames.thinking,
          time: classNames.time,
        }}
        message={message}
        botOutputRenderers={botOutputRenderers}
        aggregationMetadata={aggregationMetadata}
      />
    </div>
  );
};
