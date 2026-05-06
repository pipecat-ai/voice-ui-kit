"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttongroup";
import {
  buttonAccentColorMapCls,
  type ButtonSize,
  type ButtonState,
  type ButtonVariant,
} from "@/components/ui/buttonVariants";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { VoiceVisualizer } from "@/visualizers";
import { type DeviceErrorReason } from "@pipecat-ai/client-js";
import {
  type OptionalMediaDeviceInfo,
  PipecatClientMicToggle,
  useMediaState,
  usePipecatClientMediaDevices,
} from "@pipecat-ai/client-react";
import {
  ChevronDownIcon,
  MicIcon,
  MicOffIcon,
  SpeakerIcon,
} from "lucide-react";

/**
 * Base props interface for UserAudioControl components.
 * Provides styling, behavior, and customization options for audio controls.
 */
interface Props {
  /** Visual style variant for the control button */
  variant?: ButtonVariant;
  /** Size of the control button */
  size?: ButtonSize;
  /** State of the control button (default, inactive, etc.) */
  state?: ButtonState;
  /** Additional props to pass to the main control button */
  buttonProps?: Partial<React.ComponentProps<typeof Button>>;
  /** Custom CSS classes for different parts of the component */
  classNames?: {
    /** CSS classes for the main control button */
    button?: string;
    /** CSS classes for the button group */
    buttongroup?: string;
    /** CSS classes for the dropdown menu trigger button */
    dropdownMenuTrigger?: string;
    /** CSS classes for the dropdown menu content */
    dropdownMenuContent?: string;
    /** CSS classes for dropdown menu checkbox items */
    dropdownMenuCheckboxItem?: string;
    /** CSS classes for active state text */
    activeText?: string;
    /** CSS classes for inactive state text */
    inactiveText?: string;
  };
  /** Additional props to pass to the dropdown button */
  dropdownButtonProps?: Partial<React.ComponentProps<typeof Button>>;
  /** Whether to hide the device picker dropdown */
  noDevicePicker?: boolean;
  /** Custom label for the main dropdown menu (null/empty to hide) */
  dropdownMenuLabel?: string | null;
  /** Whether to hide microphones from the device dropdown */
  noMicrophones?: boolean;
  /** Whether to hide speakers from the device dropdown */
  noSpeakers?: boolean;
  /** Custom label for the microphone section in the dropdown */
  microphoneLabel?: string;
  /** Custom label for the speaker section in the dropdown */
  speakerLabel?: string;
  /** Whether to hide the voice visualizer */
  noVisualizer?: boolean;
  /** Additional props to pass to the VoiceVisualizer component */
  visualizerProps?: Partial<React.ComponentProps<typeof VoiceVisualizer>>;
  /** Whether to disable audio functionality entirely */
  noAudio?: boolean;
  /** Custom text to display when audio is disabled */
  noAudioText?: string | null;
  /** Whether to hide the microphone icon in the button */
  noIcon?: boolean;
  /** Text to display when microphone is active */
  activeText?: string;
  /** Text to display when microphone is inactive */
  inactiveText?: string;
  /** Custom content to render inside the button */
  children?: React.ReactNode;
}

/**
 * Props interface for the headless UserAudioComponent.
 * Includes device data and callbacks for external state management.
 */
interface ComponentProps extends Props {
  /** Callback function called when the microphone toggle button is clicked */
  onClick?: () => void;
  /** Whether the microphone is currently enabled */
  isMicEnabled?: boolean;
  /** Array of available microphone devices */
  availableMics?: MediaDeviceInfo[];
  /** Currently selected microphone device */
  selectedMic?: OptionalMediaDeviceInfo;
  /** Callback function called when a microphone device is selected */
  updateMic?: (deviceId: string) => void;
  /** Array of available speaker devices */
  availableSpeakers?: MediaDeviceInfo[];
  /** Currently selected speaker device */
  selectedSpeaker?: OptionalMediaDeviceInfo;
  /** Callback function called when a speaker device is selected */
  updateSpeaker?: (deviceId: string) => void;
  /**
   * When set, renders a disabled button with this message instead of the
   * toggle and hides the picker. Used by the connected UserAudioControl to
   * surface mic-error states (blocked, in-use, etc.) sourced from
   * useMediaState(). Distinct from `noAudio`, which is a deliberate
   * consumer opt-out.
   */
  unavailableText?: string;
}

const btnClasses = "flex-1 w-full z-10 justify-start";

/**
 * Headless UserAudioComponent that accepts all device data and callbacks as props.
 * This component can be used with any framework or state management solution.
 *
 * @example
 * ```tsx
 * <UserAudioComponent
 *   isMicEnabled={isMicrophoneOn}
 *   onClick={handleMicrophoneToggle}
 *   availableMics={microphones}
 *   selectedMic={currentMicrophone}
 *   updateMic={handleMicrophoneChange}
 *   variant="outline"
 *   size="lg"
 * />
 * ```
 */
export const UserAudioComponent: React.FC<ComponentProps> = ({
  variant = "secondary",
  size = "md",
  classNames = {},
  buttonProps = {},
  dropdownButtonProps = {},
  noDevicePicker = false,
  dropdownMenuLabel = "Audio Devices",
  noMicrophones = false,
  noSpeakers = false,
  microphoneLabel = "Microphones",
  speakerLabel = "Speakers",
  noVisualizer = false,
  visualizerProps = {},
  isMicEnabled = false,
  state,
  availableMics,
  selectedMic,
  updateMic,
  availableSpeakers,
  selectedSpeaker,
  updateSpeaker,
  noAudio,
  noAudioText = "Audio disabled",
  noIcon = false,
  activeText,
  inactiveText,
  children,
  onClick,
  unavailableText,
}) => {
  let buttonComp;

  const noDropdown = noDevicePicker || (noMicrophones && noSpeakers);
  const isUnavailable = !!unavailableText;

  /** NO AUDIO / LOADING / DEVICE UNAVAILABLE */
  if (noAudio || buttonProps?.isLoading || isUnavailable) {
    // unavailableText (mic blocked, in-use, etc.) takes precedence over
    // the consumer's noAudioText so the actual cause is visible.
    const disabledText = unavailableText ?? noAudioText;
    buttonComp = (
      <Button
        variant={variant}
        size={size}
        {...buttonProps}
        disabled
        className={cn(
          btnClasses,
          buttonProps?.isLoading && "justify-center",
          classNames.button,
        )}
      >
        {!buttonProps?.isLoading && (
          <>
            {!noIcon && <MicOffIcon />}
            {disabledText && <span className="flex-1">{disabledText}</span>}
            {children}
          </>
        )}
      </Button>
    );
  } else {
    /** AUDIO ENABLED */
    const buttonState = state || (isMicEnabled ? "default" : "inactive");

    const hasMicrophones =
      !noMicrophones && availableMics && availableMics.length > 0;
    const hasSpeakers =
      !noSpeakers && availableSpeakers && availableSpeakers.length > 0;

    buttonComp = (
      <>
        <Button
          onClick={onClick}
          variant={variant}
          state={buttonState}
          size={size}
          {...buttonProps}
          className={cn(
            btnClasses,
            !noDropdown && "rounded-e-none",
            classNames.button,
          )}
        >
          {!noIcon && (isMicEnabled ? <MicIcon /> : <MicOffIcon />)}
          {buttonState === "inactive" && inactiveText ? (
            <span className={cn("flex-1", classNames.inactiveText)}>
              {inactiveText}
            </span>
          ) : null}
          {buttonState !== "inactive" && activeText ? (
            <span className={cn("flex-1 ", classNames.activeText)}>
              {activeText}
            </span>
          ) : null}
          {children}
          {!noVisualizer && (
            <VoiceVisualizer
              participantType="local"
              backgroundColor="transparent"
              barCount={10}
              barGap={2}
              barMaxHeight={size === "lg" ? 24 : size === "xl" ? 36 : 20}
              barOrigin="center"
              barWidth={3}
              barColor="currentColor"
              className={cn(
                "mx-auto",
                buttonAccentColorMapCls[variant || "primary"]?.[buttonState],
              )}
              {...visualizerProps}
            />
          )}
        </Button>
        {!noDropdown && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className={cn(
                  "flex-none z-0 rounded-s-none border-l-0",
                  classNames.dropdownMenuTrigger,
                )}
                variant={variant}
                size={size}
                isIcon
                {...dropdownButtonProps}
              >
                <ChevronDownIcon size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(classNames.dropdownMenuContent)}
            >
              {dropdownMenuLabel && (
                <>
                  <DropdownMenuLabel>{dropdownMenuLabel}</DropdownMenuLabel>
                  {(hasMicrophones || hasSpeakers) && <DropdownMenuSeparator />}
                </>
              )}

              {/* Microphone devices */}
              {hasMicrophones && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    <MicIcon size={12} className="inline mr-1" />
                    {microphoneLabel}
                  </DropdownMenuLabel>
                  {availableMics.map((device) => (
                    <DropdownMenuCheckboxItem
                      key={`mic-${device.deviceId}`}
                      checked={selectedMic?.deviceId === device.deviceId}
                      onCheckedChange={() => updateMic?.(device.deviceId)}
                      className={cn(classNames.dropdownMenuCheckboxItem)}
                    >
                      {device.label ||
                        `Microphone ${device.deviceId.slice(0, 5)}`}
                    </DropdownMenuCheckboxItem>
                  ))}
                  {hasSpeakers && <DropdownMenuSeparator />}
                </>
              )}

              {/* Speaker devices */}
              {hasSpeakers && (
                <>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    <SpeakerIcon size={12} className="inline mr-1" />
                    {speakerLabel}
                  </DropdownMenuLabel>
                  {availableSpeakers.map((device) => (
                    <DropdownMenuCheckboxItem
                      key={`speaker-${device.deviceId}`}
                      checked={selectedSpeaker?.deviceId === device.deviceId}
                      onCheckedChange={() => updateSpeaker?.(device.deviceId)}
                      className={cn(classNames.dropdownMenuCheckboxItem)}
                    >
                      {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
                    </DropdownMenuCheckboxItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </>
    );
  }

  return (
    <ButtonGroup className={cn(variant !== "outline" && "gap-[1px]")}>
      {buttonComp}
    </ButtonGroup>
  );
};

/**
 * Connected UserAudioControl component that integrates with the Pipecat Client SDK.
 * This component automatically manages microphone detection, selection, and updates.
 * Must be used within a PipecatClientProvider context.
 *
 * @example
 * ```tsx
 * <UserAudioControl
 *   variant="outline"
 *   size="lg"
 *   noDevicePicker={false}
 *   activeText="Microphone is on"
 *   inactiveText="Microphone is off"
 * />
 * ```
 */
/**
 * Map a per-device DeviceErrorReason onto a short, user-facing message for
 * the disabled microphone button. Kept minimal per Plan A's "minimal
 * affordance" decision.
 */
const micErrorText = (reason: DeviceErrorReason): string => {
  switch (reason) {
    case "blocked":
      return "Microphone blocked";
    case "already-in-use":
      return "Microphone in use";
    case "not-found":
      return "No microphone";
    case "not-supported":
      return "Audio not supported";
    case "unknown":
    default:
      return "Microphone unavailable";
  }
};

export const UserAudioControl: React.FC<Props> = ({
  buttonProps,
  ...props
}) => {
  const {
    availableMics,
    selectedMic,
    updateMic,
    availableSpeakers,
    selectedSpeaker,
    updateSpeaker,
  } = usePipecatClientMediaDevices();

  // Drive loading and error UI from the per-device MediaState surface
  // (Plan A step 2). Decouples the button from TransportState, so the
  // picker stays accessible across connect / disconnect cycles once mic
  // permission has been granted.
  //
  // 'uninitialized' is intentionally NOT treated as loading. It maps to
  // both pre-init (initDevices() not called yet) AND post-init when the
  // transport didn't acquire the mic (e.g. enableMic was false, or the
  // transport opted out). In those cases there's no work in flight, so
  // showing a spinner indefinitely would be wrong. The button just renders
  // as inactive — clicking it routes through PipecatClientMicToggle as
  // usual.
  const { mic } = useMediaState();
  const isLoading = mic.state === "initializing";
  const unavailableText =
    mic.state === "error" ? micErrorText(mic.reason) : undefined;

  return (
    <PipecatClientMicToggle>
      {({ isMicEnabled, onClick }) => (
        <UserAudioComponent
          onClick={onClick}
          isMicEnabled={isMicEnabled}
          availableMics={availableMics}
          selectedMic={selectedMic}
          updateMic={updateMic}
          availableSpeakers={availableSpeakers}
          selectedSpeaker={selectedSpeaker}
          updateSpeaker={updateSpeaker}
          state={isMicEnabled ? "default" : "inactive"}
          unavailableText={unavailableText}
          buttonProps={{
            isLoading,
            ...buttonProps,
          }}
          {...props}
        />
      )}
    </PipecatClientMicToggle>
  );
};

export default UserAudioControl;
