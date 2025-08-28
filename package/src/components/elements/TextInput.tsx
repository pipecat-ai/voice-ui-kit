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

  const handleSend = useCallback(async () => {
    if (!message.trim() || isSending) return;

    setIsSending(true);
    await onSend?.(message);
    setMessage("");
    setIsSending(false);
  }, [message, onSend, isSending]);

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
    <div className={cn("flex flex-row gap-2", classNames?.container)}>
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
        className={cn(classNames?.button)}
        isIcon={!buttonLabel}
        {...buttonProps}
      >
        {!isSending && !buttonLabel && buttonIcon}
        {buttonLabel}
      </Button>
    </div>
  );
};

export const TextInput = ({
  debounceTime = 300,
  disabled,
  role = "user",
  runImmediately = true,
  noConnectedPlaceholder = "Connect to send",
  ...props
}: TextInputComponentProps & {
  role?: "user" | "assistant";
  runImmediately?: boolean;
  noConnectedPlaceholder?: string;
}) => {
  const { isConnected } = usePipecatConnectionState();
  const client = usePipecatClient();

  const handleSend = useCallback(
    async (message: string) => {
      if (!isConnected || !client) return;

      await client.appendToContext({
        role,
        content: message,
        run_immediately: runImmediately,
      });
    },
    [isConnected, client, role, runImmediately],
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
