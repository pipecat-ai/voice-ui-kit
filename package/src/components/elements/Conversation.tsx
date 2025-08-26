import Thinking from "@/components/elements/Thinking";
import { useConversationContext } from "@/hooks/useConversationContext";
import { cn } from "@/lib/utils";
import { usePipecatClientTransportState } from "@pipecat-ai/client-react";
import { Fragment, memo, useCallback, useEffect, useRef } from "react";

export interface ConversationProps {
  classNames?: {
    container?: string;
    message?: string;
    messageContent?: string;
    role?: string;
    time?: string;
    thinking?: string;
  };
  noAutoscroll?: boolean;
  assistantLabel?: string;
  clientLabel?: string;
}

export const Conversation: React.FC<ConversationProps> = memo(
  ({
    classNames = {},
    noAutoscroll = false,
    assistantLabel = "assistant",
    clientLabel = "user",
  }) => {
    const transportState = usePipecatClientTransportState();

    const scrollRef = useRef<HTMLDivElement>(null);
    const isScrolledToBottom = useRef(true);

    const maybeScrollToBottom = useCallback(() => {
      if (!scrollRef.current) return;
      if (isScrolledToBottom.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, []);

    // Check scroll position before messages update
    const updateScrollState = useCallback(() => {
      if (!scrollRef.current || noAutoscroll) return;
      isScrolledToBottom.current =
        Math.ceil(
          scrollRef.current.scrollHeight - scrollRef.current.scrollTop,
        ) <= Math.ceil(scrollRef.current.clientHeight);
    }, [noAutoscroll]);

    const { messages } = useConversationContext();

    const isConnecting =
      transportState === "authenticating" || transportState === "connecting";
    const isConnected =
      transportState === "connected" || transportState === "ready";

    useEffect(() => {
      if (noAutoscroll) return;
      // Scroll to bottom when messages change
      maybeScrollToBottom();
    }, [messages, maybeScrollToBottom, noAutoscroll]);

    // Update scroll state when user scrolls
    useEffect(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) return;

      const handleScroll = () => updateScrollState();
      scrollElement.addEventListener("scroll", handleScroll);

      // Initial check
      updateScrollState();

      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }, [updateScrollState]);

    const roleLabelMap = useCallback(
      () => ({
        user: clientLabel,
        assistant: assistantLabel,
        system: "system",
      }),
      [clientLabel, assistantLabel],
    );

    // Show messages first if they exist, regardless of connection state
    if (messages.length > 0) {
      return (
        <div
          ref={scrollRef}
          className={cn("h-full overflow-y-auto p-4", classNames.container)}
        >
          <div
            className={cn(
              "grid grid-cols-[min-content_1fr] gap-x-4 gap-y-2",
              classNames.message,
            )}
          >
            {messages.map((message, index) => (
              <Fragment key={index}>
                <div
                  className={cn(
                    "font-semibold font-mono text-xs leading-6 w-max",
                    {
                      "text-client": message.role === "user",
                      "text-agent": message.role === "assistant",
                      "text-subtle": message.role === "system",
                    },
                    classNames.role,
                  )}
                >
                  {roleLabelMap()[message.role] || message.role}
                </div>
                <div
                  className={cn(
                    "flex flex-col gap-2",
                    classNames.messageContent,
                  )}
                >
                  {typeof message.content === "string"
                    ? message.content || (
                        <Thinking className={classNames.thinking} />
                      )
                    : message.content}
                  <div
                    className={cn(
                      "self-end text-xs text-gray-500 mb-1",
                      classNames.time,
                    )}
                  >
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      );
    }

    // Only show connection states if there are no messages
    if (isConnecting) {
      return (
        <div
          className={cn(
            "flex items-center justify-center h-full",
            classNames.container,
          )}
        >
          <div className="text-muted-foreground text-sm">
            Connecting to agent...
          </div>
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div
          className={cn(
            "flex items-center justify-center h-full",
            classNames.container,
          )}
        >
          <div className="text-center p-4">
            <div className="text-muted-foreground mb-2">
              Not connected to agent
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Connect to an agent to see conversation messages in real-time.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex items-center justify-center h-full",
          classNames.container,
        )}
      >
        <div className="text-muted-foreground text-sm">
          Waiting for messages...
        </div>
      </div>
    );
  },
);
export default Conversation;
