"use client";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttongroup";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, MicIcon, MicOffIcon } from "@/icons";
import {
  PipecatClientMicToggle,
  usePipecatClient,
  usePipecatClientMediaDevices,
  VoiceVisualizer,
} from "@pipecat-ai/client-react";
import { useEffect } from "react";
import { cn } from "../../lib/utils";

interface Props {
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
}

const UserAudio: React.FC<Props> = ({
  buttonProps = {},
  classNames = {},
  dropdownButtonProps = {},
  noDevicePicker = false,
  noVisualizer = false,
  visualizerProps = {},
}) => {
  const client = usePipecatClient();
  const { availableMics, selectedMic, updateMic } =
    usePipecatClientMediaDevices();

  // @ts-expect-error _options is protected, but can be totally accessed in JS
  const hasAudio = client?._options?.enableMic;

  useEffect(() => {
    if (!client) return;

    if (["idle", "disconnected"].includes(client.state)) {
      client.initDevices();
    }
  }, [client]);

  if (!hasAudio) {
    return (
      <div
        className={cn(
          "vkui:flex vkui:items-center vkui:gap-2 vkui:bg-muted vkui:rounded-md vkui:p-2 vkui:text-muted-foreground vkui:font-mono vkui:text-sm",
          classNames.container,
        )}
      >
        <MicOffIcon size={16} />
        Audio disabled
      </div>
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
              variant="secondary"
              {...buttonProps}
            >
              {isMicEnabled ? <MicIcon size={16} /> : <MicOffIcon size={16} />}
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
                variant="secondary"
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

export default UserAudio;
