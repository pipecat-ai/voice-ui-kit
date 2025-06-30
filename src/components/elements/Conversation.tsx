import { useRTVIClientTransportState } from "@pipecat-ai/client-react";
import { Fragment, useCallback, useEffect, useRef } from "react";
import useConversation from "@/hooks/useConversation";
import { cn } from "@/lib/utils";
import Thinking from "@/components/elements/Thinking";

export const Conversation: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = useRef(true);

  const transportState = useRTVIClientTransportState();

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
    if (!scrollRef.current) return;
    isScrolledToBottom.current =
      Math.ceil(scrollRef.current.scrollHeight - scrollRef.current.scrollTop) <=
      Math.ceil(scrollRef.current.clientHeight);
  }, []);

  const { messages } = useConversation({
    onMessageAdded: () => {
      maybeScrollToBottom();
    },
  });

  useEffect(() => {
    // Scroll to bottom when messages change
    maybeScrollToBottom();
  }, [messages, maybeScrollToBottom]);

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
        className="vkui:h-full vkui:overflow-y-auto vkui:p-4"
      >
        <div className="vkui:grid vkui:grid-cols-[min-content_1fr] vkui:gap-x-4 vkui:gap-y-2">
          {messages.map((message, index) => (
            <Fragment key={index}>
              <div
                className={cn(
                  "vkui:font-semibold vkui:font-mono vkui:text-xs vkui:leading-6",
                  {
                    "vkui:text-blue-500": message.role === "user",
                    "vkui:text-purple-500": message.role === "assistant",
                  },
                )}
              >
                {message.role}
              </div>
              <div className="vkui:flex vkui:flex-col vkui:gap-2">
                {message.content || <Thinking />}
                <div className="vkui:self-end vkui:text-xs vkui:text-gray-500 vkui:mb-1">
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
      <div className="vkui:flex vkui:items-center vkui:justify-center vkui:h-full">
        <div className="vkui:text-muted-foreground vkui:text-sm">
          Connecting to agent...
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="vkui:flex vkui:items-center vkui:justify-center vkui:h-full">
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
    <div className="vkui:flex vkui:items-center vkui:justify-center vkui:h-full">
      <div className="vkui:text-muted-foreground vkui:text-sm">
        Waiting for messages...
      </div>
    </div>
  );
};
export default Conversation;
