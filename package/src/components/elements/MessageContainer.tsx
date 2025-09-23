import { cn } from "@/lib/utils";
import { ConversationMessage } from "@/types/conversation";
import { MessageRole } from "./MessageRole";
import { MessageContent } from "./MessageContent";

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
}

export const MessageContainer = ({
  assistantLabel,
  clientLabel,
  systemLabel,
  classNames = {},
  message,
}: Props) => {
  return (
    <div className={cn("flex flex-col gap-2", classNames.container)}>
      <MessageRole
        assistantLabel={assistantLabel}
        clientLabel={clientLabel}
        systemLabel={systemLabel}
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
      />
    </div>
  );
};
