import { cn } from "@/lib/utils";
import * as React from "react";

/**
 * LED indicator primitive.
 *
 * - Visual states: on, off, and optional blinking (binary toggle, no fades)
 * - Defaults to size-4 and rounded-full; merge additional classes via `className`
 * - Colors/styles for on/off are customizable via `classNames.on` / `classNames.off`
 * - Supports a transient flash when `watch` changes
 */
export type LEDProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * Whether the LED is on. Ignored while a flash is active. When `blinking` is false,
   * this directly controls the on/off state.
   */
  on?: boolean;
  /**
   * When true, toggles state on a fixed interval to produce a binary blink (no fades).
   */
  blinking?: boolean;
  /**
   * Interval (ms) used to toggle between on/off while blinking. Minimum 50ms. Default: 100ms.
   */
  blinkIntervalMs?: number;
  classNames?: {
    /** Classes applied when LED is on. */
    on?: string;
    /** Classes applied when LED is off. */
    off?: string;
  };
  /**
   * A value to watch. Whenever this value changes, the LED will blink for `watchBlinkDurationMs`,
   * then settle into the off state.
   */
  watch?: unknown;
  /** Duration (ms) to blink when `watch` changes, then settle to off. Default: 500ms. */
  watchBlinkDurationMs?: number;
};

/**
 * A simple LED-like indicator that supports on/off, blinking, and change-driven flashes.
 *
 * - Uses a hard state toggle (no opacity fades) when blinking
 * - Defaults to `size-4` circle and merges classes with `cn`
 * - Provide `classNames.on` / `classNames.off` to control the visual styling for states
 */
export function LED({
  on = false,
  blinking = false,
  blinkIntervalMs = 100,
  className,
  classNames,
  watch,
  watchBlinkDurationMs = 500,
  ...rest
}: LEDProps) {
  const [watchBlinking, setWatchBlinking] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blinkOn, setBlinkOn] = React.useState<boolean>(true);

  // When `watch` changes, start blinking for a duration, then stop
  React.useEffect(() => {
    if (watch === undefined) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Start blinking
    setWatchBlinking(true);

    // Stop blinking after the duration
    timeoutRef.current = setTimeout(
      () => {
        setWatchBlinking(false);
        timeoutRef.current = null;
      },
      Math.max(1, watchBlinkDurationMs),
    );

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [watch, watchBlinkDurationMs]);

  // Toggle on/off state when blinking is enabled. No fades; a hard toggle.
  React.useEffect(() => {
    const shouldBlink = blinking || watchBlinking;

    if (!shouldBlink) {
      setBlinkOn(on);
      return;
    }

    const interval = setInterval(
      () => {
        setBlinkOn((v) => !v);
      },
      Math.max(50, blinkIntervalMs),
    );
    return () => clearInterval(interval);
  }, [blinking, watchBlinking, blinkIntervalMs, on]);

  const effectiveOn = blinking || watchBlinking ? blinkOn : on;

  // Precompute static layer classes; we will only toggle styles for performance
  const onLayerClass = cn(
    "absolute inset-0",
    "bg-active",
    className,
    classNames?.on,
  );
  const offLayerClass = cn(
    "absolute inset-0",
    "bg-primary",
    className,
    classNames?.off,
  );

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full size-4",
        className,
      )}
      aria-live="polite"
      aria-label={
        effectiveOn
          ? blinking || watchBlinking
            ? "on, blinking"
            : "on"
          : blinking || watchBlinking
            ? "off, blinking"
            : "off"
      }
      {...rest}
    >
      {/* On layer */}
      <div className={onLayerClass} style={{ opacity: effectiveOn ? 1 : 0 }} />
      {/* Off layer */}
      <div className={offLayerClass} style={{ opacity: effectiveOn ? 0 : 1 }} />
    </div>
  );
}
