"use client";

import { Button } from "@/components/ui/button";
import {
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/buttonVariants";
import { Input } from "@/components/ui/input";
import { usePipecatConnectionState } from "@/hooks";
import { cn } from "@/lib/utils";
import { type DTMFButton } from "@pipecat-ai/client-js";
import { useDTMF } from "@pipecat-ai/client-react";
import { DeleteIcon, PhoneIcon } from "lucide-react";
import { useCallback, useState } from "react";

/**
 * Ordered list of the twelve DTMF keys as they appear on a standard telephone
 * keypad, along with the letters/symbols traditionally printed beneath each
 * digit. Rendered row by row into a 3-column grid.
 */
const DTMF_KEYS: { value: DTMFButton; sub?: string }[] = [
  { value: "1" },
  { value: "2", sub: "ABC" },
  { value: "3", sub: "DEF" },
  { value: "4", sub: "GHI" },
  { value: "5", sub: "JKL" },
  { value: "6", sub: "MNO" },
  { value: "7", sub: "PQRS" },
  { value: "8", sub: "TUV" },
  { value: "9", sub: "WXYZ" },
  { value: "*" },
  { value: "0", sub: "+" },
  { value: "#" },
];

/** Keep only characters that are valid in a DTMF sequence. */
const sanitizeDTMF = (value: string): string => value.replace(/[^0-9*#]/g, "");

/**
 * Behavior of the keypad:
 * - `"immediate"`: each key press sends that tone right away (natural for
 *   navigating live IVR menus).
 * - `"buffered"`: key presses accumulate in an editable field and are sent as
 *   a single sequence when the user submits (natural for entering a full
 *   number/extension before dialing).
 */
export type DTMFKeypadMode = "immediate" | "buffered";

/**
 * Base props shared by the headless and connected keypad components.
 */
export interface DTMFKeypadBaseProps {
  /** How presses are dispatched. Default: "immediate" */
  mode?: DTMFKeypadMode;
  /** Visual style variant for the keypad buttons. Default: "secondary" */
  variant?: ButtonVariant;
  /** Size of the keypad buttons. Default: "lg" */
  size?: ButtonSize;
  /** Disables the entire keypad. */
  disabled?: boolean;
  /** Hides the letters/symbols printed beneath each digit. Default: false */
  noSubLabels?: boolean;
  /** Additional props to pass to every keypad button. */
  buttonProps?: Partial<React.ComponentProps<typeof Button>>;
  /** Placeholder for the input field (buffered mode). */
  placeholder?: string;
  /** Label for the send button (buffered mode). Default: "Send" */
  sendLabel?: string;
  /** Custom CSS classes for different parts of the component. */
  classNames?: {
    /** CSS classes for the outer wrapper. */
    root?: string;
    /** CSS classes for the grid container. */
    container?: string;
    /** CSS classes for each keypad button. */
    button?: string;
    /** CSS classes for the digit label. */
    label?: string;
    /** CSS classes for the sub-label (letters/symbols). */
    subLabel?: string;
    /** CSS classes for the input row (buffered mode). */
    inputRow?: string;
    /** CSS classes for the input field (buffered mode). */
    input?: string;
    /** CSS classes for the backspace button (buffered mode). */
    backspace?: string;
    /** CSS classes for the send button (buffered mode). */
    sendButton?: string;
  };
}

/**
 * Props for the headless {@link DTMFKeypadComponent}.
 */
export interface DTMFKeypadComponentProps extends DTMFKeypadBaseProps {
  /** Called with each key as it is pressed (fires in both modes). */
  onPress?: (button: DTMFButton) => void;
  /** Called with the full sequence when submitted (buffered mode). */
  onSend?: (sequence: string) => void;
  /** Controlled buffer value (buffered mode). */
  value?: string;
  /** Default buffer value when uncontrolled (buffered mode). Default: "" */
  defaultValue?: string;
  /** Called whenever the buffer changes (buffered mode). */
  onValueChange?: (value: string) => void;
}

/**
 * Headless DTMF keypad. Renders a standard 12-key telephone keypad. In
 * `"immediate"` mode each press invokes `onPress`; in `"buffered"` mode presses
 * accumulate in an editable field and `onSend` fires with the full sequence on
 * submit. Holds no client state and can be used with any framework or state
 * management solution.
 *
 * @example
 * ```tsx
 * // immediate
 * <DTMFKeypadComponent onPress={(key) => console.log(key)} />
 * // buffered
 * <DTMFKeypadComponent mode="buffered" onSend={(seq) => console.log(seq)} />
 * ```
 */
export const DTMFKeypadComponent: React.FC<DTMFKeypadComponentProps> = ({
  mode = "immediate",
  variant = "secondary",
  size = "lg",
  disabled = false,
  noSubLabels = false,
  buttonProps = {},
  placeholder = "Enter digits",
  sendLabel = "Send",
  classNames = {},
  onPress,
  onSend,
  value,
  defaultValue,
  onValueChange,
}) => {
  const buffered = mode === "buffered";

  // Controlled/uncontrolled buffer for buffered mode.
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const buffer = isControlled ? (value ?? "") : internalValue;

  const setBuffer = useCallback(
    (next: string) => {
      if (!isControlled) setInternalValue(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  const handlePress = useCallback(
    (key: DTMFButton) => {
      onPress?.(key);
      if (buffered) setBuffer(buffer + key);
    },
    [buffered, buffer, onPress, setBuffer],
  );

  const handleSend = useCallback(() => {
    if (!buffer) return;
    onSend?.(buffer);
    setBuffer("");
  }, [buffer, onSend, setBuffer]);

  const grid = (
    <div className={cn("grid grid-cols-3 gap-2", classNames.container)}>
      {DTMF_KEYS.map(({ value: key, sub }) => (
        <Button
          key={key}
          type="button"
          variant={variant}
          size={size}
          disabled={disabled}
          aria-label={`DTMF ${key}`}
          onClick={() => handlePress(key)}
          {...buttonProps}
          className={cn(
            "flex flex-col items-center justify-center gap-0 tabular-nums",
            classNames.button,
            buttonProps.className,
          )}
        >
          <span className={cn("text-base font-semibold", classNames.label)}>
            {key}
          </span>
          {!noSubLabels && (
            <span
              className={cn(
                "h-2.5 text-[0.6rem] leading-none tracking-widest opacity-60",
                classNames.subLabel,
              )}
            >
              {sub ?? ""}
            </span>
          )}
        </Button>
      ))}
    </div>
  );

  if (!buffered) return grid;

  return (
    <div className={cn("flex flex-col gap-2", classNames.root)}>
      <div className={cn("flex items-center gap-2", classNames.inputRow)}>
        <Input
          value={buffer}
          onChange={(e) => setBuffer(sanitizeDTMF(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder={placeholder}
          disabled={disabled}
          // Suppress the native virtual keyboard on touch devices: the
          // on-screen keypad is the intended input method. Typing/paste on
          // desktop still works.
          inputMode="none"
          aria-label="DTMF sequence"
          className={cn(
            "flex-1 tracking-widest tabular-nums",
            classNames.input,
          )}
        />
        <Button
          type="button"
          variant="secondary"
          size={size}
          isIcon
          disabled={disabled || !buffer}
          aria-label="Delete last digit"
          onClick={() => setBuffer(buffer.slice(0, -1))}
          className={cn(classNames.backspace)}
        >
          <DeleteIcon />
        </Button>
      </div>
      {grid}
      <Button
        type="button"
        variant={variant}
        size={size}
        isFullWidth
        disabled={disabled || !buffer}
        onClick={handleSend}
        className={cn(classNames.sendButton)}
      >
        <PhoneIcon />
        {sendLabel}
      </Button>
    </div>
  );
};

/**
 * Props for the connected {@link DTMFKeypad}.
 */
export interface DTMFKeypadProps extends DTMFKeypadBaseProps {
  /** Called with each key as it is pressed (fires in both modes). */
  onPress?: (button: DTMFButton) => void;
  /** Controlled buffer value (buffered mode). */
  value?: string;
  /** Default buffer value when uncontrolled (buffered mode). */
  defaultValue?: string;
  /** Called whenever the buffer changes (buffered mode). */
  onValueChange?: (value: string) => void;
  /** Called after tone(s) are successfully sent. */
  onToneSent?: (sequence: string) => void;
  /**
   * Called if sending fails. `sendDTMF` throws when the transport isn't ready
   * or the connected bot doesn't support DTMF (RTVI protocol < 2.0.0); the
   * error is caught and forwarded here instead of surfacing uncaught.
   */
  onError?: (error: unknown) => void;
}

/**
 * Connected DTMFKeypad that integrates with the Pipecat Client SDK.
 *
 * In `"immediate"` mode (default) each key press sends that tone right away; in
 * `"buffered"` mode the entered sequence is sent as one `sendDTMF` call on
 * submit. The keypad is disabled until the client is connected, since tones can
 * only be sent once the transport is ready. Send failures are caught and
 * reported via `onError` rather than thrown.
 *
 * Must be used within a `PipecatClientProvider` context.
 *
 * @example
 * ```tsx
 * <DTMFKeypad mode="buffered" onToneSent={(seq) => console.log("sent", seq)} />
 * ```
 */
export const DTMFKeypad: React.FC<DTMFKeypadProps> = ({
  mode = "immediate",
  disabled,
  onPress,
  onToneSent,
  onError,
  ...props
}) => {
  const { sendTone } = useDTMF();
  const { isConnected } = usePipecatConnectionState();

  const send = useCallback(
    (sequence: string) => {
      try {
        sendTone(sequence);
        onToneSent?.(sequence);
      } catch (error) {
        onError?.(error);
      }
    },
    [sendTone, onToneSent, onError],
  );

  return (
    <DTMFKeypadComponent
      mode={mode}
      disabled={disabled || !isConnected}
      onPress={(button) => {
        onPress?.(button);
        if (mode === "immediate") send(button);
      }}
      onSend={mode === "buffered" ? (sequence) => send(sequence) : undefined}
      {...props}
    />
  );
};

export default DTMFKeypad;
