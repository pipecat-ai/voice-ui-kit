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
import { useCallback, useEffect, useRef, useState } from "react";

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
 * The (row, column) frequency pair that defines each key's dual tone, per the
 * standard DTMF layout. Synthesizing from these keeps the kit free of bundled
 * audio assets.
 */
const DTMF_FREQUENCIES: Record<DTMFButton, [number, number]> = {
  "1": [697, 1209],
  "2": [697, 1336],
  "3": [697, 1477],
  "4": [770, 1209],
  "5": [770, 1336],
  "6": [770, 1477],
  "7": [852, 1209],
  "8": [852, 1336],
  "9": [852, 1477],
  "*": [941, 1209],
  "0": [941, 1336],
  "#": [941, 1477],
};

/** Length of the press feedback tone, in seconds. */
const TONE_DURATION = 0.12;
/**
 * Default peak gain of the feedback tone. Deliberately quiet: it plays over a
 * live call. Override with the `toneVolume` prop.
 */
const DEFAULT_TONE_VOLUME = 0.15;
/** Attack/release ramp length, in seconds. Without it the tone clicks. */
const TONE_RAMP = 0.01;

/**
 * Returns a function that plays a key's DTMF tone locally as press feedback.
 *
 * This is a cosmetic sidetone only: the actual signalling happens over the
 * transport via `sendTone`. The tone is synthesized from the two frequencies
 * that define the key rather than played from a bundled audio file.
 */
const useDTMFTone = (enabled: boolean, volume: number) => {
  const contextRef = useRef<AudioContext | null>(null);
  // Clamped so a stray prop value can't invert the waveform or blast the tone
  // out at many times the intended level.
  const peakGain = Math.min(Math.max(volume, 0), 1);

  useEffect(
    () => () => {
      void contextRef.current?.close();
      contextRef.current = null;
    },
    [],
  );

  return useCallback(
    (key: DTMFButton) => {
      if (
        !enabled ||
        peakGain <= 0 ||
        typeof window === "undefined" ||
        !window.AudioContext
      ) {
        return;
      }
      // Created lazily on first press so it's tied to a user gesture (autoplay
      // policy) and never constructed during SSR, then reused across presses.
      const context = (contextRef.current ??= new window.AudioContext());
      if (context.state === "suspended") void context.resume();

      const now = context.currentTime;
      const gain = context.createGain();
      gain.connect(context.destination);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(peakGain, now + TONE_RAMP);
      gain.gain.setValueAtTime(peakGain, now + TONE_DURATION - TONE_RAMP);
      gain.gain.linearRampToValueAtTime(0, now + TONE_DURATION);

      const oscillators = DTMF_FREQUENCIES[key].map((frequency) => {
        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, now);
        oscillator.connect(gain);
        oscillator.start(now);
        oscillator.stop(now + TONE_DURATION);
        return oscillator;
      });

      oscillators[oscillators.length - 1].onended = () => {
        oscillators.forEach((oscillator) => oscillator.disconnect());
        gain.disconnect();
      };
    },
    [enabled, peakGain],
  );
};

/**
 * Behavior of the keypad:
 * - `"buffered"` (default): key presses accumulate in an editable field and are
 *   sent as a single sequence when the user submits, so a mistyped digit can be
 *   corrected before anything is transmitted (natural for entering a full
 *   number/extension before dialing).
 * - `"immediate"`: each key press sends that tone right away (natural for
 *   navigating live IVR menus, where each key is answered on its own).
 */
export type DTMFKeypadMode = "immediate" | "buffered";

/**
 * Base props shared by the headless and connected keypad components.
 */
export interface DTMFKeypadBaseProps {
  /** How presses are dispatched. Default: "buffered" */
  mode?: DTMFKeypadMode;
  /** Visual style variant for the keypad buttons. Default: "secondary" */
  variant?: ButtonVariant;
  /** Size of the keypad buttons. Default: "lg" */
  size?: ButtonSize;
  /** Disables the entire keypad. */
  disabled?: boolean;
  /** Hides the letters/symbols printed beneath each digit. Default: false */
  noSubLabels?: boolean;
  /**
   * Disables the audible tone played on each key press. The tone is local
   * press feedback only and is not what signals the digit to the server.
   * Default: false
   */
  noToneFeedback?: boolean;
  /**
   * Peak volume of the key press tone, from 0 (silent) to 1 (full scale).
   * Values outside that range are clamped. Defaults to 0.15, kept low because
   * the tone plays over a live call.
   */
  toneVolume?: number;
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
 * `"buffered"` mode (default) presses accumulate in an editable field and
 * `onSend` fires with the full sequence on submit; in `"immediate"` mode each
 * press invokes `onPress` only. Holds no client state and can be used with any
 * framework or state management solution.
 *
 * @example
 * ```tsx
 * // buffered (default)
 * <DTMFKeypadComponent onSend={(seq) => console.log(seq)} />
 * // immediate
 * <DTMFKeypadComponent mode="immediate" onPress={(key) => console.log(key)} />
 * ```
 */
export const DTMFKeypadComponent: React.FC<DTMFKeypadComponentProps> = ({
  mode = "buffered",
  variant = "secondary",
  size = "lg",
  disabled = false,
  noSubLabels = false,
  noToneFeedback = false,
  toneVolume = DEFAULT_TONE_VOLUME,
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

  const playTone = useDTMFTone(!noToneFeedback, toneVolume);

  const handlePress = useCallback(
    (key: DTMFButton) => {
      playTone(key);
      onPress?.(key);
      if (buffered) setBuffer(buffer + key);
    },
    [buffered, buffer, onPress, setBuffer, playTone],
  );

  const handleSend = useCallback(() => {
    // Sanitize at send time too: a controlled `value`/`defaultValue` bypasses
    // the input's onChange sanitization, so this guarantees the emitted
    // sequence only ever contains valid DTMF characters.
    const sequence = sanitizeDTMF(buffer);
    if (!sequence) return;
    onSend?.(sequence);
    setBuffer("");
  }, [buffer, onSend, setBuffer]);

  const grid = (
    <div className={cn("grid grid-cols-3 gap-2", classNames.container)}>
      {DTMF_KEYS.map(({ value: key, sub }) => (
        <Button
          key={key}
          variant={variant}
          size={size}
          aria-label={`DTMF ${key}`}
          {...buttonProps}
          // Force internal behavior after the spread so consumer buttonProps
          // can't silently clobber it: keypad keys must stay non-submitting
          // (type="button"), the press handler must run, and buttonProps must
          // not re-enable the keypad while it's gated (e.g. disconnected).
          // Consumers can still add an onClick or further disable.
          type="button"
          disabled={disabled || buttonProps.disabled}
          onClick={(e) => {
            buttonProps.onClick?.(e);
            handlePress(key);
          }}
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
            if (e.key === "Enter") {
              // Prevent the native implicit form submit if the keypad is
              // embedded in a <form>; Enter should only dispatch the sequence.
              e.preventDefault();
              handleSend();
            }
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
   * Called if sending fails. `sendTone` throws when the transport isn't ready
   * or the connected bot doesn't support DTMF (RTVI protocol < 2.0.0); the
   * error is caught and forwarded here instead of surfacing uncaught.
   */
  onError?: (error: unknown) => void;
}

/**
 * Connected DTMFKeypad that integrates with the Pipecat Client SDK.
 *
 * In `"buffered"` mode (default) the entered sequence is sent as one `sendTone`
 * call on submit, so a mistyped digit can be corrected before anything is
 * transmitted; in `"immediate"` mode each key press sends that tone right away,
 * which suits navigating a live IVR menu. The keypad is disabled until the
 * client is connected, since tones can only be sent once the transport is
 * ready. Send failures are caught and reported via `onError` rather than
 * thrown.
 *
 * Must be used within a `PipecatClientProvider` context.
 *
 * @example
 * ```tsx
 * <DTMFKeypad onToneSent={(seq) => console.log("sent", seq)} />
 * ```
 */
export const DTMFKeypad: React.FC<DTMFKeypadProps> = ({
  mode = "buffered",
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
