"use client";

import { BotVolumeSliderComponent } from "@/components/elements/BotVolumeSlider";
import { Button } from "@/components/ui/button";
import {
  type ButtonSize,
  type ButtonState,
  type ButtonVariant,
} from "@/components/ui/buttonVariants";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBotAudioOutput } from "@/hooks/useBotAudioOutput";
import { cn } from "@/lib/utils";
import { usePipecatClientTransportState } from "@pipecat-ai/client-react";
import {
  Volume1Icon,
  Volume2Icon,
  VolumeIcon,
  VolumeXIcon,
} from "lucide-react";

/**
 * Base props interface for BotAudioControl components.
 */
interface Props {
  /** Visual style variant for the control button */
  variant?: ButtonVariant;
  /** Size of the control button */
  size?: ButtonSize;
  /** State of the control button (default, inactive, etc.) */
  state?: ButtonState;
  /** Additional props to pass to the control button */
  buttonProps?: Partial<React.ComponentProps<typeof Button>>;
  /**
   * Props forwarded to the Radix `Popover` root (e.g. `open`, `defaultOpen`,
   * `onOpenChange`, `modal`).
   */
  popoverProps?: Partial<React.ComponentProps<typeof Popover>>;
  /**
   * Props forwarded to `PopoverContent`. Use this to adjust placement —
   * `align`, `side`, `sideOffset`, `alignOffset`, `collisionPadding`, etc.
   * Defaults: `align="center"`.
   */
  popoverContentProps?: Partial<React.ComponentProps<typeof PopoverContent>>;
  /**
   * Props forwarded to the inner {@link BotVolumeSliderComponent} (e.g.
   * `noLabel`, `noPercent`, `orientation`, `sliderProps`).
   */
  volumeSliderProps?: Partial<
    Omit<
      React.ComponentProps<typeof BotVolumeSliderComponent>,
      "volume" | "onVolumeChange"
    >
  >;
  /** Custom CSS classes for different parts of the component */
  classNames?: {
    /** CSS classes for the trigger button */
    button?: string;
    /** CSS classes for the popover content */
    popoverContent?: string;
    /** CSS classes for the volume slider */
    slider?: string;
  };
  /** Whether to hide the volume icon in the button */
  noIcon?: boolean;
  /** Optional visible label rendered next to the icon */
  label?: string;
  /** Custom content to render inside the button (after the icon/label) */
  children?: React.ReactNode;
}

/**
 * Props interface for the headless BotAudioComponent.
 */
interface ComponentProps extends Props {
  /** Current volume, 0.0 – 1.0 */
  volume?: number;
  /** Callback invoked when the volume changes (value is in 0.0 – 1.0) */
  onVolumeChange?: (volume: number) => void;
}

/**
 * Pick an icon that reflects the current volume level.
 * Purely cosmetic — this does not represent a mute state.
 */
const iconForVolume = (
  volume: number,
): typeof VolumeIcon | typeof Volume1Icon | typeof Volume2Icon => {
  if (volume <= 0) return VolumeXIcon;
  if (volume < 0.34) return VolumeIcon;
  if (volume < 0.67) return Volume1Icon;
  return Volume2Icon;
};

/**
 * Headless `BotAudioComponent` that accepts volume state and a change callback.
 *
 * Useful when you need full control over state (tests, custom stores, etc.)
 * and don't want the connected `BotAudioControl` to read/write the kit's
 * bot audio store.
 */
export const BotAudioComponent: React.FC<ComponentProps> = ({
  variant = "secondary",
  size = "md",
  state,
  buttonProps = {},
  popoverProps,
  popoverContentProps,
  volumeSliderProps,
  classNames = {},
  noIcon = false,
  label,
  children,
  volume = 1,
  onVolumeChange,
}) => {
  const Icon = iconForVolume(volume);

  return (
    <Popover {...popoverProps}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          state={state}
          aria-label={label ?? "Bot volume"}
          {...buttonProps}
          className={cn(classNames.button, buttonProps?.className)}
        >
          {!noIcon && <Icon />}
          {label ? <span className="flex-1">{label}</span> : null}
          {children}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        {...popoverContentProps}
        className={cn(
          "w-56",
          classNames.popoverContent,
          popoverContentProps?.className,
        )}
      >
        <BotVolumeSliderComponent
          volume={volume}
          onVolumeChange={onVolumeChange}
          {...volumeSliderProps}
          classNames={{
            slider: classNames.slider,
            ...volumeSliderProps?.classNames,
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

BotAudioComponent.displayName = "BotAudioComponent";

/**
 * Connected `BotAudioControl` wired to the kit's bot audio store and the
 * Pipecat client transport state.
 *
 * Must be used within a `PipecatClientProvider` (typically via
 * `PipecatAppBase`). The control becomes disabled while the transport is
 * disconnected or initializing.
 *
 * @example
 * ```tsx
 * <BotAudioControl size="sm" />
 * ```
 */
export const BotAudioControl: React.FC<Props> = ({ buttonProps, ...props }) => {
  const { volume, setVolume } = useBotAudioOutput();
  const transportState = usePipecatClientTransportState();
  const loading =
    transportState === "disconnected" || transportState === "initializing";

  return (
    <BotAudioComponent
      volume={volume}
      onVolumeChange={setVolume}
      buttonProps={{
        isLoading: loading,
        ...buttonProps,
      }}
      {...props}
    />
  );
};

BotAudioControl.displayName = "BotAudioControl";

export default BotAudioControl;
