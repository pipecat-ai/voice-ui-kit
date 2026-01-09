import { usePipecatConversation } from "@/hooks/usePipecatConversation";
import { cn } from "@/lib/utils";
import { usePipecatClientTransportState } from "@pipecat-ai/client-react";
import { memo, useCallback, useEffect, useRef } from "react";
import { MessageContainer } from "./MessageContainer";
import { TextInput } from "./TextInput";
import { useConversationContext } from "@/components/ConversationProvider";

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
  /**
   * Custom label for system messages
   * @default "system"
   */
  systemLabel?: string;
  /**
   * Disable the text input field at the bottom of the conversation
   * @default false
   */
  noTextInput?: boolean;
  /**
   * Custom renderers for BotOutput content based on aggregation type
   * Key is the aggregation type (e.g., "code", "link"), value is a renderer function
   */
  botOutputRenderers?: React.ComponentProps<
    typeof MessageContainer
  >["botOutputRenderers"];
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
    assistantLabel,
    classNames = {},
    clientLabel,
    noAutoscroll = false,
    noTextInput = false,
    systemLabel,
    botOutputRenderers,
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

    const { messages } = usePipecatConversation();
    const { botOutputSupported } = useConversationContext();

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

    const textInput = noTextInput ? null : (
      <div className="p-3 border-t">
        <TextInput
          classNames={{
            container: "items-center",
          }}
        />
      </div>
    );

    // Show messages first if they exist, regardless of connection state
    if (messages.length > 0) {
      return (
        <div
          className={cn("relative h-full flex flex-col", classNames.container)}
        >
          <div
            ref={scrollRef}
            className={cn(
              "relative flex-1 overflow-y-auto p-4",
              !noTextInput && "pb-2",
            )}
          >
            <div className={cn(classNames.message)}>
              {messages.map((message, index) => (
                <MessageContainer
                  key={index}
                  message={message}
                  assistantLabel={assistantLabel}
                  clientLabel={clientLabel}
                  systemLabel={systemLabel}
                  classNames={{
                    container: classNames.message,
                    messageContent: classNames.messageContent,
                    thinking: classNames.thinking,
                    time: classNames.time,
                    role: classNames.role,
                  }}
                  botOutputRenderers={botOutputRenderers}
                />
              ))}
            </div>
          </div>
          {textInput}
        </div>
      );
    }

    // Only show connection states if there are no messages
    if (isConnecting) {
      return (
        <div
          className={cn("relative h-full flex flex-col", classNames.container)}
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground text-sm">
              Connecting to agent...
            </div>
          </div>
          {textInput}
        </div>
      );
    }

    if (!isConnected) {
      return (
        <div
          className={cn("relative h-full flex flex-col", classNames.container)}
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-4">
              <div className="text-muted-foreground mb-2">
                Not connected to agent
              </div>
              <p className="text-sm text-muted-foreground max-w-md">
                Connect to an agent to see conversation messages in real-time.
              </p>
            </div>
          </div>
          {textInput}
        </div>
      );
    }

    // Show warning if botOutput events are not supported
    if (botOutputSupported === false) {
      return (
        <div
          className={cn("relative h-full flex flex-col", classNames.container)}
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-4 max-w-md">
              <div className="text-destructive font-medium mb-2">
                BotOutput events not supported
              </div>
              <p className="text-sm text-muted-foreground">
                This server does not support BotOutput events (requires RTVI
                1.1.0+). Conversation messages cannot be displayed without
                BotOutput event support.
              </p>
            </div>
          </div>
          {textInput}
        </div>
      );
    }

    return (
      <div
        className={cn("relative h-full flex flex-col", classNames.container)}
      >
        <div className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground text-sm">
            Waiting for messages...
          </div>
        </div>
        {textInput}
      </div>
    );
  },
);

/**
 * Default export of the Conversation component
 */
export default Conversation;
