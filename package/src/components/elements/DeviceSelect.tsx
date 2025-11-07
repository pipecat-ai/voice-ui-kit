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
  usePipecatClientMediaDevices,
} from "@pipecat-ai/client-react";

export interface DeviceSelectBaseProps
  extends Omit<SelectTriggerProps, "children"> {
  placeholder?: string;
  guide?: React.ReactNode;
  classNames?: {
    selectTrigger?: string;
    selectContent?: string;
    selectItem?: string;
  };
  selectProps?: SelectProps;
  contentProps?: SelectContentProps;
}

export interface DeviceSelectComponentProps extends DeviceSelectBaseProps {
  availableDevices?: MediaDeviceInfo[];
  selectedDevice?: OptionalMediaDeviceInfo;
  updateDevice?: (deviceId: string) => void;
}

export const DeviceSelectComponent = ({
  placeholder = "Device select",
  guide,
  availableDevices,
  selectedDevice,
  updateDevice,
  className,
  classNames,
  selectProps,
  contentProps,
  ...triggerProps
}: DeviceSelectComponentProps) => {
  const selectedValue = selectedDevice?.deviceId ?? "";

  return (
    <Select
      value={selectedValue}
      onValueChange={(v) => updateDevice?.(v)}
      {...selectProps}
    >
      <SelectTrigger
        className={cn(classNames?.selectTrigger, className)}
        {...triggerProps}
      >
        {guide ? <SelectGuide>{guide}</SelectGuide> : null}
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent
        className={cn(classNames?.selectContent)}
        {...contentProps}
      >
        {availableDevices?.map((device) => (
          <SelectItem
            key={device.deviceId}
            value={device.deviceId}
            className={cn(classNames?.selectItem)}
          >
            {device.label || `Device ${device.deviceId.slice(0, 5)}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export const DeviceSelect: React.FC<DeviceSelectBaseProps> = (props) => {
  const { availableMics, selectedMic, updateMic } =
    usePipecatClientMediaDevices();

  return (
    <DeviceSelectComponent
      availableDevices={availableMics}
      selectedDevice={selectedMic}
      updateDevice={updateMic}
      {...props}
    />
  );
};

export default DeviceSelect;
