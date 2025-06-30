import React, { useId } from "react";
import { useRTVIClientMediaDevices } from "@pipecat-ai/client-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AudioOutputProps {
  className?: string;
}

export const AudioOutput: React.FC<AudioOutputProps> = ({ className }) => {
  const { availableSpeakers, selectedSpeaker, updateSpeaker } =
    useRTVIClientMediaDevices();

  const handleDeviceChange = (deviceId: string) => {
    updateSpeaker(deviceId);
  };

  const id = useId();

  return (
    <div className="vkui:flex vkui:items-center vkui:gap-4">
      <label
        htmlFor={id}
        className="vkui:text-sm vkui:font-medium vkui:text-muted-foreground vkui:whitespace-nowrap"
      >
        Audio Output
      </label>
      <Select
        value={selectedSpeaker?.deviceId || ""}
        onValueChange={handleDeviceChange}
      >
        <SelectTrigger
          id={id}
          className={cn("vkui:border-none vkui:w-full", className)}
        >
          <SelectValue placeholder="Select a speaker" />
        </SelectTrigger>
        <SelectContent align="end">
          {availableSpeakers.map((device) => (
            <SelectItem key={device.deviceId} value={device.deviceId}>
              {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AudioOutput;
