import {
  Button,
  ButtonProps,
  Input,
  InputProps,
  Textarea,
} from "@/components/ui";
import { usePipecatConnectionState } from "@/hooks/usePipecatConnectionState";
import { cn } from "@/lib/utils";
import { usePipecatClient } from "@pipecat-ai/client-react";
import { SendIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConversationContext } from "../ConversationProvider";

export interface TextInputComponentProps {
  debounceTime?: number;
  onSend?: (message: string) => Promise<void> | void;
  disabled?: boolean;
  multiline?: boolean;
  buttonLabel?: React.ReactNode;
  buttonIcon?: React.ReactNode;
  buttonProps?: ButtonProps;
  inputProps?: InputProps;
  classNames?: {
    container?: string;
    input?: string;
    button?: string;
  };
  placeholder?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export const TextInputComponent = ({
  debounceTime = 300,
  onSend,
  disabled,
  classNames,
  multiline = false,
  buttonLabel,
  buttonIcon = <SendIcon />,
  buttonProps,
  placeholder = "Type message...",
  size = "md",
}: TextInputComponentProps) => {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSend?.(message);
      // Only clear message on successful send
      setMessage("");
    } catch (error) {
      // Keep message in input if send fails
      // Error handling can be added here if needed (e.g., show toast)
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  }, [message, onSend, isSending]);

  // Refocus input after message is cleared (successful send)
  useEffect(() => {
    if (message === "" && !isSending && containerRef.current) {
      const input = containerRef.current.querySelector<HTMLInputElement>(
        'input[data-slot="input"], textarea[data-slot="textarea"]',
      );
      input?.focus();
    }
  }, [message, isSending]);

  useEffect(() => {
    if (!message.trim()) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null;
    }, debounceTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [message, debounceTime]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      handleSend();
    }
  };

  const canSend = !disabled && !isSending && !!message.trim();

  const InputComponent = multiline ? Textarea : Input;

  return (
    <div
      ref={containerRef}
      className={cn("flex flex-row gap-2 items-center", classNames?.container)}
    >
      <InputComponent
        placeholder={placeholder}
        value={message}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSending}
        size={size}
        className={cn("flex-1", classNames?.input)}
        {...(multiline && { multiline: true })}
      />
      <Button
        onClick={handleSend}
        disabled={!canSend}
        isLoading={isSending}
        size={size}
        className={cn("shrink-0", classNames?.button)}
        isIcon={!buttonLabel}
        {...buttonProps}
      >
        {!isSending && !buttonLabel && buttonIcon}
        {buttonLabel}
      </Button>
    </div>
  );
};

export interface SendTextOptions {
  run_immediately?: boolean;
  audio_response?: boolean;
}

export const TextInput = ({
  debounceTime = 300,
  disabled,
  sendTextOptions,
  noConnectedPlaceholder = "Connect to send",
  noInject = false,
  onSend,
  ...props
}: TextInputComponentProps & {
  sendTextOptions?: SendTextOptions;
  noConnectedPlaceholder?: string;
  noInject?: boolean;
}) => {
  const { isConnected } = usePipecatConnectionState();
  const client = usePipecatClient();

  const { injectMessage } = useConversationContext();

  const handleSend = useCallback(
    async (message: string) => {
      // Validate connection before attempting to send
      if (!isConnected || !client) {
        return;
      }

      // Inject message to store first (if enabled)
      if (!noInject) {
        injectMessage({
          role: "user",
          parts: [
            {
              text: message,
              final: true,
              createdAt: new Date().toISOString(),
            },
          ],
        });
      }

      // Send the message through the client
      await client.sendText(message, sendTextOptions);

      // Call the optional callback after successful send
      onSend?.(message);
    },
    [isConnected, client, injectMessage, noInject, onSend, sendTextOptions],
  );

  return (
    <TextInputComponent
      debounceTime={debounceTime}
      disabled={disabled || !isConnected}
      onSend={handleSend}
      placeholder={!isConnected ? noConnectedPlaceholder : props.placeholder}
      {...props}
    />
  );
};
