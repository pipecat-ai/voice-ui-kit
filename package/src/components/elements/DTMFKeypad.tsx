"use client";

import { Button } from "@/components/ui/button";
import {
  type ButtonSize,
  type ButtonVariant,
} from "@/components/ui/buttonVariants";
import { usePipecatConnectionState } from "@/hooks";
import { cn } from "@/lib/utils";
import { type DTMFButton } from "@pipecat-ai/client-js";
import { useDTMF } from "@pipecat-ai/client-react";

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

/**
 * Base props shared by the headless and connected keypad components.
 */
export interface DTMFKeypadBaseProps {
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
  /** Custom CSS classes for different parts of the component. */
  classNames?: {
    /** CSS classes for the grid container. */
    container?: string;
    /** CSS classes for each keypad button. */
    button?: string;
    /** CSS classes for the digit label. */
    label?: string;
    /** CSS classes for the sub-label (letters/symbols). */
    subLabel?: string;
  };
}

/**
 * Props for the headless {@link DTMFKeypadComponent}.
 */
export interface DTMFKeypadComponentProps extends DTMFKeypadBaseProps {
  /** Called with the pressed DTMF key. */
  onPress?: (button: DTMFButton) => void;
}

/**
 * Headless DTMF keypad. Renders a standard 12-key telephone keypad and invokes
 * `onPress` with the pressed key. This component holds no client state and can
 * be used with any framework or state management solution.
 *
 * @example
 * ```tsx
 * <DTMFKeypadComponent onPress={(key) => console.log(key)} />
 * ```
 */
export const DTMFKeypadComponent: React.FC<DTMFKeypadComponentProps> = ({
  variant = "secondary",
  size = "lg",
  disabled = false,
  noSubLabels = false,
  buttonProps = {},
  classNames = {},
  onPress,
}) => {
  return (
    <div className={cn("grid grid-cols-3 gap-2", classNames.container)}>
      {DTMF_KEYS.map(({ value, sub }) => (
        <Button
          key={value}
          type="button"
          variant={variant}
          size={size}
          disabled={disabled}
          aria-label={`Send DTMF ${value}`}
          onClick={() => onPress?.(value)}
          {...buttonProps}
          className={cn(
            "flex flex-col items-center justify-center gap-0 tabular-nums",
            classNames.button,
            buttonProps.className,
          )}
        >
          <span className={cn("text-base font-semibold", classNames.label)}>
            {value}
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
};

/**
 * Connected DTMFKeypad that integrates with the Pipecat Client SDK. Pressing a
 * key sends the corresponding DTMF tone to the server via `sendDTMF`. The
 * keypad is automatically disabled until the client is connected, since tones
 * can only be sent once the transport is ready.
 *
 * Must be used within a `PipecatClientProvider` context.
 *
 * @example
 * ```tsx
 * <DTMFKeypad variant="outline" size="lg" />
 * ```
 */
export const DTMFKeypad: React.FC<DTMFKeypadBaseProps> = ({
  disabled,
  ...props
}) => {
  const { sendTone } = useDTMF();
  const { isConnected } = usePipecatConnectionState();

  return (
    <DTMFKeypadComponent
      disabled={disabled || !isConnected}
      onPress={(button) => sendTone(button)}
      {...props}
    />
  );
};

export default DTMFKeypad;
