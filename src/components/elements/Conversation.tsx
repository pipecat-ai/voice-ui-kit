import { usePipecatClientTransportState } from "@pipecat-ai/client-react";
import { Fragment, useCallback, useEffect, useRef } from "react";
import useConversation from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import Thinking from "@/components/elements/Thinking";

interface Props {
  classNames?: {
    container?: string;
    message?: string;
    messageContent?: string;
    role?: string;
    time?: string;
    thinking?: string;
  };
  noAutoscroll?: boolean;
}

export const Conversation: React.FC<Props> = ({
  classNames = {},
  noAutoscroll = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = useRef(true);

  const transportState = usePipecatClientTransportState();

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
      Math.ceil(scrollRef.current.scrollHeight - scrollRef.current.scrollTop) <=
      Math.ceil(scrollRef.current.clientHeight);
  }, [noAutoscroll]);

  const { messages } = useConversation({
    onMessageAdded: () => {
      if (noAutoscroll) return;
      maybeScrollToBottom();
    },
  });

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

  const isConnecting =
    transportState === "authenticating" || transportState === "connecting";
  const isConnected =
    transportState === "connected" || transportState === "ready";

  if (messages.length > 0) {
    return (
      <div
        ref={scrollRef}
        className={cn(
          "vkui:h-full vkui:overflow-y-auto vkui:p-4",
          classNames.container,
        )}
      >
        <div
          className={cn(
            "vkui:grid vkui:grid-cols-[min-content_1fr] vkui:gap-x-4 vkui:gap-y-2",
            classNames.message,
          )}
        >
          {messages.map((message, index) => (
            <Fragment key={index}>
              <div
                className={cn(
                  "vkui:font-semibold vkui:font-mono vkui:text-xs vkui:leading-6",
                  {
                    "vkui:text-blue-500": message.role === "user",
                    "vkui:text-purple-500": message.role === "assistant",
                  },
                  classNames.role,
                )}
              >
                {message.role}
              </div>
              <div
                className={cn(
                  "vkui:flex vkui:flex-col vkui:gap-2",
                  classNames.messageContent,
                )}
              >
                {message.content || (
                  <Thinking className={classNames.thinking} />
                )}
                <div
                  className={cn(
                    "vkui:self-end vkui:text-xs vkui:text-gray-500 vkui:mb-1",
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

  if (isConnecting) {
    return (
      <div
        className={cn(
          "vkui:flex vkui:items-center vkui:justify-center vkui:h-full",
          classNames.container,
        )}
      >
        <div className="vkui:text-muted-foreground vkui:text-sm">
          Connecting to agent...
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div
        className={cn(
          "vkui:flex vkui:items-center vkui:justify-center vkui:h-full",
          classNames.container,
        )}
      >
        <div className="vkui:text-center vkui:p-4">
          <div className="vkui:text-muted-foreground vkui:mb-2">
            Not connected to agent
          </div>
          <p className="vkui:text-sm vkui:text-muted-foreground vkui:max-w-md">
            Connect to an agent to see conversation messages in real-time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "vkui:flex vkui:items-center vkui:justify-center vkui:h-full",
        classNames.container,
      )}
    >
      <div className="vkui:text-muted-foreground vkui:text-sm">
        Waiting for messages...
      </div>
    </div>
  );
};
export default Conversation;
