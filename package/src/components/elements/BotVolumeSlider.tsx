"use client";

import { Slider } from "@/components/ui/slider";
import { useBotAudioOutput } from "@/hooks/useBotAudioOutput";
import { cn } from "@/lib/utils";

/**
 * Base props shared by the connected and headless variants.
 */
interface Props {
  /** Hide the label + percent readout row. Default: false */
  noLabel?: boolean;
  /** Hide just the percent readout (keeps the label). Default: false */
  noPercent?: boolean;
  /** Override the label text. Default: `"Bot volume"` */
  label?: string;
  /** Slider orientation. Default: `"horizontal"` */
  orientation?: "horizontal" | "vertical";
  /** Classes for the outer wrapper */
  className?: string;
  /** Classes for individual parts */
  classNames?: {
    /** Classes for the label row */
    labelRow?: string;
    /** Classes for the label text */
    label?: string;
    /** Classes for the percent readout */
    percent?: string;
    /** Classes for the slider itself */
    slider?: string;
  };
  /** Props forwarded to the underlying Slider primitive */
  sliderProps?: Partial<React.ComponentProps<typeof Slider>>;
}

/**
 * Props for the headless {@link BotVolumeSliderComponent}.
 */
interface ComponentProps extends Props {
  /** Current volume, 0.0 – 1.0 */
  volume?: number;
  /** Callback fired when the volume changes. Receives 0.0 – 1.0 */
  onVolumeChange?: (volume: number) => void;
}

/**
 * Headless bot volume slider. Accepts `volume` + `onVolumeChange` directly,
 * so you can drive it from any state source (tests, custom stores, etc.).
 */
export const BotVolumeSliderComponent: React.FC<ComponentProps> = ({
  volume = 1,
  onVolumeChange,
  noLabel = false,
  noPercent = false,
  label = "Bot volume",
  orientation = "horizontal",
  className,
  classNames = {},
  sliderProps,
}) => {
  const pct = Math.round(volume * 100);
  // Guard the accessible name: an empty or whitespace-only `label` would
  // leave the slider unannounced for assistive tech.
  const accessibleLabel = label.trim() || "Bot volume";

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {!noLabel && (
        <div
          className={cn(
            "flex items-center justify-between text-sm",
            classNames.labelRow,
          )}
        >
          <span className={cn("text-muted-foreground", classNames.label)}>
            {label}
          </span>
          {!noPercent && (
            <span
              className={cn("font-medium tabular-nums", classNames.percent)}
            >
              {pct}%
            </span>
          )}
        </div>
      )}
      <Slider
        min={0}
        max={1}
        step={0.01}
        value={[volume]}
        onValueChange={(v: number[]) => onVolumeChange?.(v[0] ?? 0)}
        orientation={orientation}
        aria-label={accessibleLabel}
        {...sliderProps}
        className={cn(classNames.slider, sliderProps?.className)}
      />
    </div>
  );
};

BotVolumeSliderComponent.displayName = "BotVolumeSliderComponent";

/**
 * Connected bot volume slider wired to the kit's bot audio store
 * ({@link useBotAudioOutput}). Drop it anywhere inside `PipecatAppBase` for
 * an inline volume control; `BotAudioControl` composes it inside a popover.
 *
 * @example
 * ```tsx
 * <BotVolumeSlider />
 * <BotVolumeSlider noLabel />
 * <BotVolumeSlider orientation="vertical" className="h-40" />
 * ```
 */
export const BotVolumeSlider: React.FC<Props> = (props) => {
  const { volume, setVolume } = useBotAudioOutput();
  return (
    <BotVolumeSliderComponent
      volume={volume}
      onVolumeChange={setVolume}
      {...props}
    />
  );
};

BotVolumeSlider.displayName = "BotVolumeSlider";

export default BotVolumeSlider;
