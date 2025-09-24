"use client";

import {
  DeviceDropDownComponent,
  type DeviceDropDownComponentProps,
} from "@/components/elements/DeviceDropDown";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttongroup";
import {
  buttonAccentColorMapCls,
  type ButtonSize,
  type ButtonState,
  type ButtonVariant,
} from "@/components/ui/buttonVariants";
import { cn } from "@/lib/utils";
import { VoiceVisualizer } from "@/visualizers";
import {
  type OptionalMediaDeviceInfo,
  PipecatClientMicToggle,
  usePipecatClientMediaDevices,
  usePipecatClientTransportState,
} from "@pipecat-ai/client-react";
import { ChevronDownIcon, MicIcon, MicOffIcon } from "lucide-react";

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
  /** Additional props to pass to the device dropdown component */
  deviceDropDownProps?: Partial<DeviceDropDownComponentProps>;
  /** Whether to hide the device picker dropdown */
  noDevicePicker?: boolean;
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
  deviceDropDownProps = {},
  noDevicePicker = false,
  noVisualizer = false,
  visualizerProps = {},
  isMicEnabled = false,
  state,
  availableMics,
  selectedMic,
  updateMic,
  noAudio,
  noAudioText = "Audio disabled",
  noIcon = false,
  activeText,
  inactiveText,
  children,
  onClick,
}) => {
  let buttonComp;

  /** NO AUDIO */
  if (noAudio || buttonProps?.isLoading) {
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
            {noAudioText && <span className="flex-1">{noAudioText}</span>}
            {children}
          </>
        )}
      </Button>
    );
  } else {
    /** AUDIO ENABLED */
    const buttonState = state || (isMicEnabled ? "default" : "inactive");

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
            !noDevicePicker && "rounded-e-none",
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
        {!noDevicePicker && (
          <DeviceDropDownComponent
            menuLabel="Microphone device"
            availableDevices={availableMics}
            selectedDevice={selectedMic}
            updateDevice={updateMic}
            classNames={{
              dropdownMenuContent: classNames.dropdownMenuContent,
              dropdownMenuCheckboxItem: classNames.dropdownMenuCheckboxItem,
            }}
            {...deviceDropDownProps}
          >
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
          </DeviceDropDownComponent>
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
export const UserAudioControl: React.FC<Props> = (props) => {
  const { availableMics, selectedMic, updateMic } =
    usePipecatClientMediaDevices();

  const transportState = usePipecatClientTransportState();
  const loading =
    transportState === "disconnected" || transportState === "initializing";

  return (
    <PipecatClientMicToggle>
      {({ isMicEnabled, onClick }) => (
        <UserAudioComponent
          onClick={onClick}
          isMicEnabled={isMicEnabled}
          availableMics={availableMics}
          selectedMic={selectedMic}
          updateMic={updateMic}
          state={isMicEnabled ? "default" : "inactive"}
          buttonProps={{
            isLoading: loading,
          }}
          {...props}
        />
      )}
    </PipecatClientMicToggle>
  );
};

export default UserAudioControl;
