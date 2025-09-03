import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import {
  type OptionalMediaDeviceInfo,
  usePipecatClient,
  usePipecatClientMediaDevices,
} from "@pipecat-ai/client-react";
import { useEffect } from "react";

/**
 * Props for the headless DeviceDropDown component that accepts device data and callbacks as props.
 * This variant allows you to use the component with any framework or state management solution.
 */
export interface DeviceDropDownComponentProps {
  /** The trigger element that opens the dropdown menu. Can be any React element. */
  children: React.ReactNode;
  /** Whether to hide the menu label at the top of the dropdown. */
  noMenuLabel?: boolean;
  /** Whether to hide the separator below the menu label. */
  noMenuSeparator?: boolean;
  /** Text label displayed at the top of the dropdown menu. */
  menuLabel?: string;
  /** Array of available microphone devices from the MediaDevices API. */
  availableDevices?: MediaDeviceInfo[];
  /** Currently selected microphone device. */
  selectedDevice?: OptionalMediaDeviceInfo;
  /** Callback function called when a device is selected. */
  updateDevice?: (deviceId: string) => void;
  /** Custom CSS classes for different parts of the component. */
  classNames?: {
    /** CSS classes for the dropdown menu content container. */
    dropdownMenuContent?: string;
    /** CSS classes for individual dropdown menu checkbox items. */
    dropdownMenuCheckboxItem?: string;
    /** CSS classes for the dropdown menu label. */
    dropdownMenuLabel?: string;
  };
}

/**
 * Props for the connected DeviceDropDown component that automatically integrates with Pipecat Client.
 * This variant must be used within a PipecatClientProvider context.
 */
export type DeviceDropDownProps = Omit<
  DeviceDropDownComponentProps,
  "availableDevices" | "selectedDevice" | "updateDevice"
>;

/**
 * Headless dropdown menu component for selecting microphone input devices.
 *
 * This component provides a flexible dropdown interface that accepts device data and callbacks as props,
 * making it suitable for use with any framework or state management solution.
 *
 * @example
 * ```tsx
 * import { DeviceDropDownComponent, Button } from "@pipecat-ai/voice-ui-kit";
 *
 * <DeviceDropDownComponent
 *   availableDevices={microphones}
 *   selectedDevice={selectedMic}
 *   updateDevice={setMicrophone}
 *   menuLabel="Select Microphone"
 * >
 *   <Button variant="outline">Choose Device</Button>
 * </DeviceDropDownComponent>
 * ```
 */
export const DeviceDropDownComponent = ({
  children,
  noMenuLabel = false,
  noMenuSeparator = false,
  menuLabel = "Device select",
  availableDevices,
  selectedDevice,
  updateDevice,
  classNames,
}: DeviceDropDownComponentProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className={cn(classNames?.dropdownMenuContent)}
      >
        {!noMenuLabel && (
          <DropdownMenuLabel className={cn(classNames?.dropdownMenuLabel)}>
            {menuLabel}
          </DropdownMenuLabel>
        )}
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

/**
 * Connected dropdown menu component for selecting microphone input devices.
 *
 * This component automatically integrates with the Pipecat Client SDK to fetch available microphones
 * and handle device selection. It must be used within a PipecatClientProvider context.
 *
 * The component will automatically:
 * - Fetch available microphone devices
 * - Display the currently selected microphone
 * - Handle device selection changes
 * - Update the Pipecat Client's microphone configuration
 *
 * @example
 * ```tsx
 * import { DeviceDropDown, Button } from "@pipecat-ai/voice-ui-kit";
 *
 * <DeviceDropDown menuLabel="Select Microphone">
 *   <Button variant="outline">Choose Device</Button>
 * </DeviceDropDown>
 * ```
 */
export const DeviceDropDown: React.FC<DeviceDropDownProps> = (props) => {
  const client = usePipecatClient();
  const { availableMics, selectedMic, updateMic } =
    usePipecatClientMediaDevices();

  useEffect(() => {
    if (!client) return;

    if (["idle", "disconnected"].includes(client.state)) {
      client.initDevices();
    }
  }, [client]);

  return (
    <DeviceDropDownComponent
      availableDevices={availableMics}
      selectedDevice={selectedMic}
      updateDevice={updateMic}
      {...props}
    />
  );
};

export default DeviceDropDown;
