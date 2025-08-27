import {
  Select,
  SelectContent,
  type SelectContentProps,
  SelectGuide,
  SelectItem,
  type SelectProps,
  SelectTrigger,
  type SelectTriggerProps,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type OptionalMediaDeviceInfo,
  usePipecatClient,
  usePipecatClientMediaDevices,
} from "@pipecat-ai/client-react";
import React, { useEffect, useId } from "react";

/**
 * Base props interface for UserAudioOutputControl components.
 * Extends SelectTriggerProps to provide consistent styling and behavior.
 */
export interface UserAudioOutputControlBaseProps
  extends Omit<SelectTriggerProps, "children"> {
  /** Label text displayed next to the select input */
  label?: string;
  /** Placeholder text displayed in the select input when no device is selected */
  placeholder?: string;
  /** Optional guide content (icon, label, etc.) to display in the select trigger */
  guide?: React.ReactNode;
  /** Custom CSS classes for different parts of the component */
  classNames?: {
    /** CSS classes for the select trigger element */
    selectTrigger?: string;
    /** CSS classes for the select content dropdown */
    selectContent?: string;
    /** CSS classes for individual select items */
    selectItem?: string;
  };
  /** Props to pass to the underlying Select component */
  selectProps?: SelectProps;
  /** Props to pass to the SelectContent component */
  contentProps?: SelectContentProps;
}

/**
 * Props interface for the headless UserAudioOutputControlComponent.
 * Includes device data and callbacks for external state management.
 */
export interface UserAudioOutputControlComponentProps
  extends UserAudioOutputControlBaseProps {
  /** Array of available audio output devices */
  availableDevices?: MediaDeviceInfo[];
  /** Currently selected audio output device */
  selectedDevice?: OptionalMediaDeviceInfo;
  /** Callback function called when a device is selected */
  updateDevice?: (deviceId: string) => void;
}

/**
 * Headless UserAudioOutputControl component that accepts all device data and callbacks as props.
 * This component can be used with any framework or state management solution.
 *
 * @example
 * ```tsx
 * <UserAudioOutputControlComponent
 *   availableDevices={speakers}
 *   selectedDevice={currentSpeaker}
 *   updateDevice={handleSpeakerChange}
 *   placeholder="Choose speaker"
 * />
 * ```
 */
export const UserAudioOutputControlComponent = ({
  label = "Audio Output",
  placeholder = "Select a speaker",
  guide,
  availableDevices,
  selectedDevice,
  updateDevice,
  className,
  classNames,
  selectProps,
  contentProps,
  ...triggerProps
}: UserAudioOutputControlComponentProps) => {
  const selectedValue = selectedDevice?.deviceId ?? "";
  const id = useId();

  return (
    <div className="flex items-center gap-4">
      <label
        htmlFor={id}
        className="text-sm font-medium text-muted-foreground whitespace-nowrap flex-1"
      >
        {label}
      </label>
      <Select
        value={selectedValue}
        onValueChange={(v) => updateDevice?.(v)}
        {...selectProps}
      >
        <SelectTrigger
          id={id}
          className={cn(classNames?.selectTrigger, className)}
          variant="ghost"
          {...triggerProps}
        >
          {guide ? <SelectGuide>{guide}</SelectGuide> : null}
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className={cn(classNames?.selectContent)}
          align="end"
          {...contentProps}
        >
          {availableDevices?.map((device) => (
            <SelectItem
              key={device.deviceId || "empty"}
              value={device.deviceId || "empty"}
              className={cn(classNames?.selectItem)}
            >
              {device.label || `Speaker ${device.deviceId.slice(0, 5)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

/**
 * Connected UserAudioOutputControl component that integrates with the Pipecat Client SDK.
 * This component automatically manages device detection, selection, and updates.
 * Must be used within a PipecatClientProvider context.
 *
 * @example
 * ```tsx
 * <UserAudioOutputControl
 *   placeholder="Choose audio output"
 *   guide={<SpeakerIcon />}
 * />
 * ```
 */
export const UserAudioOutputControl: React.FC<
  UserAudioOutputControlBaseProps
> = (props) => {
  const client = usePipecatClient();
  const { availableSpeakers, selectedSpeaker, updateSpeaker } =
    usePipecatClientMediaDevices();

  useEffect(() => {
    if (!client) return;

    if (["idle", "disconnected"].includes(client.state)) {
      client.initDevices();
    }
  }, [client]);

  return (
    <UserAudioOutputControlComponent
      availableDevices={availableSpeakers}
      selectedDevice={selectedSpeaker}
      updateDevice={updateSpeaker}
      {...props}
    />
  );
};

export default UserAudioOutputControl;
