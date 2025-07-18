"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttongroup";
import type { ButtonSize, ButtonVariant } from "@/components/ui/buttonVariants";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, MicIcon, MicOffIcon } from "@/icons";
import { cn } from "@/lib/utils";
import {
  type OptionalMediaDeviceInfo,
  PipecatClientMicToggle,
  usePipecatClient,
  usePipecatClientMediaDevices,
  VoiceVisualizer,
} from "@pipecat-ai/client-react";
import { useEffect } from "react";

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  buttonProps?: Partial<React.ComponentProps<typeof Button>>;
  classNames?: {
    container?: string;
    button?: string;
    buttongroup?: string;
    dropdownMenuTrigger?: string;
    dropdownMenuContent?: string;
    dropdownMenuCheckboxItem?: string;
  };
  dropdownButtonProps?: Partial<React.ComponentProps<typeof Button>>;
  noDevicePicker?: boolean;
  noVisualizer?: boolean;
  visualizerProps?: Partial<React.ComponentProps<typeof VoiceVisualizer>>;
  noAudioText?: string | null;
}

interface ComponentProps extends Props {
  isMicEnabled?: boolean;
  availableMics: MediaDeviceInfo[];
  selectedMic: OptionalMediaDeviceInfo;
  updateMic: (deviceId: string) => void;
}

export const UserAudioComponent: React.FC<ComponentProps> = ({
  variant = "secondary",
  size = "default",
  classNames = {},
  buttonProps = {},
  dropdownButtonProps = {},
  noDevicePicker = false,
  noVisualizer = false,
  visualizerProps = {},
  isMicEnabled = false,
  availableMics,
  selectedMic,
  updateMic,
  noAudioText = "Audio disabled",
}) => {
  if (!isMicEnabled) {
    return (
      <Button
        variant={variant}
        size={size}
        {...buttonProps}
        disabled
        className={cn(classNames.container)}
      >
        <MicOffIcon />
        {noAudioText}
      </Button>
    );
  }

  return (
    <div
      className={cn("vkui:flex vkui:flex-col vkui:gap-2", classNames.container)}
    >
      <ButtonGroup className={cn("vkui:w-full", classNames.buttongroup)}>
        <PipecatClientMicToggle>
          {({ isMicEnabled, onClick }) => (
            <Button
              onClick={onClick}
              className={cn(
                "vkui:flex-1 vkui:justify-start",
                classNames.button,
              )}
              variant={isMicEnabled ? variant : "inactive"}
              size={size}
              {...buttonProps}
            >
              {isMicEnabled ? <MicIcon /> : <MicOffIcon />}
              {!noVisualizer && (
                <VoiceVisualizer
                  participantType="local"
                  backgroundColor="transparent"
                  barColor={isMicEnabled ? "#00bc7d" : "#999999"}
                  barCount={10}
                  barGap={2}
                  barMaxHeight={20}
                  barOrigin="center"
                  barWidth={3}
                  {...visualizerProps}
                />
              )}
            </Button>
          )}
        </PipecatClientMicToggle>
        {!noDevicePicker && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className={cn(
                  "vkui:border-s vkui:border-border vkui:p-2! vkui:flex-none",
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
              {availableMics.map((mic) => (
                <DropdownMenuCheckboxItem
                  key={mic.deviceId}
                  checked={selectedMic?.deviceId === mic.deviceId}
                  onCheckedChange={() => updateMic(mic.deviceId)}
                  className={cn(classNames.dropdownMenuCheckboxItem)}
                >
                  {mic.label || `Mic ${mic.deviceId.slice(0, 5)}`}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </ButtonGroup>
    </div>
  );
};

export const UserAudioControl: React.FC<Props> = ({ ...props }) => {
  const client = usePipecatClient();
  const { availableMics, selectedMic, updateMic } =
    usePipecatClientMediaDevices();

  const hasAudio = client?.isMicEnabled;

  useEffect(() => {
    if (!client) return;

    if (["idle", "disconnected"].includes(client.state)) {
      client.initDevices();
    }
  }, [client]);

  return (
    <UserAudioComponent
      isMicEnabled={hasAudio}
      availableMics={availableMics}
      selectedMic={selectedMic}
      updateMic={updateMic}
      {...props}
    />
  );
};

export default UserAudioControl;
