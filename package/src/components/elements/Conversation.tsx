import Thinking from "@/components/elements/Thinking";
import { useConversationContext } from "@/hooks/useConversationContext";
import { cn } from "@/lib/utils";
import { usePipecatClientTransportState } from "@pipecat-ai/client-react";
import { Fragment, memo, useCallback, useEffect, useRef } from "react";

/**
 * Props for the Conversation component
 */
export interface ConversationProps {
  /**
   * Custom CSS classes for different parts of the component
   */
  classNames?: {
    /** CSS classes for the main container */
    container?: string;
    /** CSS classes for individual message containers */
    message?: string;
    /** CSS classes for message content area */
    messageContent?: string;
    /** CSS classes for role labels */
    role?: string;
    /** CSS classes for timestamp elements */
    time?: string;
    /** CSS classes for thinking indicator */
    thinking?: string;
  };
  /**
   * Disable automatic scrolling to bottom when new messages arrive
   * @default false
   */
  noAutoscroll?: boolean;
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
  systemLabel?: string;
}

/**
 * Conversation component that displays real-time conversation history between users and AI assistants.
 *
 * This component automatically integrates with the Pipecat Client SDK to show messages,
 * connection states, and provides smooth scrolling behavior. It must be used within
 * a PipecatClientProvider and ConversationProvider context.
 *
 * @example
 * ```tsx
 * import { Conversation } from "@pipecat-ai/voice-ui-kit";
 *
 * <div className="h-96 border rounded-lg">
 *   <Conversation
 *     assistantLabel="AI Assistant"
 *     clientLabel="You"
 *     noAutoscroll={false}
 *   />
 * </div>
 * ```
 *
 * @param props - The component props
 * @param props.classNames - Custom CSS classes for styling different parts
 * @param props.noAutoscroll - Whether to disable automatic scrolling
 * @param props.assistantLabel - Custom label for assistant messages
 * @param props.clientLabel - Custom label for user messages
 *
 * @returns A React component that renders the conversation interface
 */
export const Conversation: React.FC<ConversationProps> = memo(
  ({
    classNames = {},
    noAutoscroll = false,
    assistantLabel = "assistant",
    clientLabel = "user",
    systemLabel = "system",
  }) => {
    const transportState = usePipecatClientTransportState();

    const scrollRef = useRef<HTMLDivElement>(null);
    const isScrolledToBottom = useRef(true);

    /**
     * Scrolls to the bottom of the conversation if the user is already at the bottom
     * This prevents interrupting users who are reading previous messages
     */
    const maybeScrollToBottom = useCallback(() => {
      if (!scrollRef.current) return;
      if (isScrolledToBottom.current) {
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }, []);

    /**
     * Updates the scroll state to track whether the user is at the bottom
     * This is used to determine whether to auto-scroll when new messages arrive
     */
    const updateScrollState = useCallback(() => {
      if (!scrollRef.current || noAutoscroll) return;
      isScrolledToBottom.current =
        Math.ceil(
          scrollRef.current.scrollHeight - scrollRef.current.scrollTop,
        ) <= Math.ceil(scrollRef.current.clientHeight);
    }, [noAutoscroll]);

    const { messages } = useConversationContext();

    // Determine connection states based on transport state
    const isConnecting =
      transportState === "authenticating" || transportState === "connecting";
    const isConnected =
      transportState === "connected" || transportState === "ready";

    // Auto-scroll when messages change (if enabled)
    useEffect(() => {
      if (noAutoscroll) return;
      // Scroll to bottom when messages change
      maybeScrollToBottom();
    }, [messages, maybeScrollToBottom, noAutoscroll]);

    // Set up scroll event listener to track user scroll position
    useEffect(() => {
      const scrollElement = scrollRef.current;
      if (!scrollElement) return;

      const handleScroll = () => updateScrollState();
      scrollElement.addEventListener("scroll", handleScroll);

      // Initial check
      updateScrollState();

      return () => scrollElement.removeEventListener("scroll", handleScroll);
    }, [updateScrollState]);

    /**
     * Maps message roles to their display labels
     * @returns Object mapping role keys to display labels
     */
    const roleLabelMap = useCallback(
      () => ({
        user: clientLabel,
        assistant: assistantLabel,
        system: systemLabel,
      }),
      [assistantLabel, clientLabel, systemLabel],
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

/**
 * Default export of the Conversation component
 */
export default Conversation;
