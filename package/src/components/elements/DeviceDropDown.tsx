import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { type OptionalMediaDeviceInfo } from "@pipecat-ai/client-react";

export interface DeviceDropDownProps {
  children: React.ReactNode;
  noMenuLabel?: boolean;
  noMenuSeparator?: boolean;
  menuLabel?: string;
  availableDevices?: MediaDeviceInfo[];
  selectedDevice?: OptionalMediaDeviceInfo;
  updateDevice?: (deviceId: string) => void;
  classNames?: {
    dropdownMenuTrigger?: string;
    dropdownMenuContent?: string;
    dropdownMenuCheckboxItem?: string;
  };
}

export const DeviceDropDown = ({
  children,
  noMenuLabel = false,
  noMenuSeparator = false,
  menuLabel = "Device select",
  availableDevices,
  selectedDevice,
  updateDevice,
  classNames,
}: DeviceDropDownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(classNames?.dropdownMenuContent)}
      >
        {!noMenuLabel && <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>}
        {!noMenuSeparator && <DropdownMenuSeparator />}
        {availableDevices?.map((device) => (
          <DropdownMenuCheckboxItem
            key={device.deviceId}
            checked={selectedDevice?.deviceId === device.deviceId}
            onCheckedChange={() => updateDevice?.(device.deviceId)}
            className={cn(classNames?.dropdownMenuCheckboxItem)}
          >
            {device.label || `Device ${device.deviceId.slice(0, 5)}`}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
