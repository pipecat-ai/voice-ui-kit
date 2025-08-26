import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePipecatClientMediaDevices } from "@pipecat-ai/client-react";
import React, { useId } from "react";

interface AudioOutputProps {
  className?: string;
}

export const AudioOutput: React.FC<AudioOutputProps> = ({ className }) => {
  const { availableSpeakers, selectedSpeaker, updateSpeaker } =
    usePipecatClientMediaDevices();

  const handleDeviceChange = (deviceId: string) => {
    updateSpeaker(deviceId);
  };

  const id = useId();

  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor={id}
        className="text-sm font-medium text-muted-foreground whitespace-nowrap flex-1"
      >
        Audio Output
      </label>
      <Select
        value={selectedSpeaker?.deviceId || ""}
        onValueChange={handleDeviceChange}
      >
        <SelectTrigger id={id} className={className} variant="ghost">
          <SelectValue placeholder="Select a speaker" />
        </SelectTrigger>
        <SelectContent align="end">
          {availableSpeakers.map((device) => (
            <SelectItem
              key={device.deviceId || "empty"}
              value={device.deviceId || "empty"}
            >
              {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AudioOutput;
