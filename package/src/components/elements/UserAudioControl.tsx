"use client";

import { Button } from "@/components/ui/button";
import {
  buttonAccentColorMap,
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
import { ButtonGroup } from "../ui";
import { DeviceDropDownComponent } from "./DeviceDropDown";

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  buttonProps?: Partial<React.ComponentProps<typeof Button>>;
  classNames?: {
    button?: string;
    buttongroup?: string;
    dropdownMenuTrigger?: string;
    dropdownMenuContent?: string;
    dropdownMenuCheckboxItem?: string;
    activeText?: string;
    inactiveText?: string;
  };
  dropdownButtonProps?: Partial<React.ComponentProps<typeof Button>>;
  noDevicePicker?: boolean;
  noVisualizer?: boolean;
  visualizerProps?: Partial<React.ComponentProps<typeof VoiceVisualizer>>;
  noAudio?: boolean;
  noAudioText?: string | null;
  noIcon?: boolean;
  activeText?: string;
  inactiveText?: string;
  children?: React.ReactNode;
}

interface ComponentProps extends Props {
  onClick?: () => void;
  isMicEnabled?: boolean;
  availableMics?: MediaDeviceInfo[];
  selectedMic?: OptionalMediaDeviceInfo;
  updateMic?: (deviceId: string) => void;
}

const btnClasses = "flex-1 w-full z-10 justify-start";

export const UserAudioComponent: React.FC<ComponentProps> = ({
  variant = "secondary",
  size = "md",
  classNames = {},
  buttonProps = {},
  dropdownButtonProps = {},
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
    const accentColor =
      buttonAccentColorMap[variant || "primary"]?.[buttonState];

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
            <span className={cn("flex-1", classNames.activeText)}>
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
              barColor={accentColor}
              className="mx-auto"
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
