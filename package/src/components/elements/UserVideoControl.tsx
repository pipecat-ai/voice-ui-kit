"use client";

import {
  DeviceDropDownComponent,
  type DeviceDropDownComponentProps,
} from "@/components/elements/DeviceDropDown";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttongroup";
import {
  type ButtonSize,
  type ButtonState,
  type ButtonVariant,
} from "@/components/ui/buttonVariants";
import { cn } from "@/lib/utils";
import {
  type OptionalMediaDeviceInfo,
  PipecatClientCamToggle,
  PipecatClientVideo,
  usePipecatClientMediaDevices,
  usePipecatClientTransportState,
} from "@pipecat-ai/client-react";
import { ChevronDownIcon, VideoIcon, VideoOffIcon } from "lucide-react";

/**
 * Base props interface for UserVideoControl components.
 * Provides styling, behavior, and customization options for video controls.
 */
export interface UserVideoControlBaseProps {
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
    /** CSS classes for the main container */
    container?: string;
    /** CSS classes for the video element */
    video?: string;
    /** CSS classes for the button group */
    buttongroup?: string;
    /** CSS classes for the main control button */
    button?: string;
    /** CSS classes for the dropdown menu trigger button */
    dropdownMenuTrigger?: string;
    /** CSS classes for the dropdown menu content */
    dropdownMenuContent?: string;
    /** CSS classes for dropdown menu checkbox items */
    dropdownMenuCheckboxItem?: string;
    /** CSS classes for the video off state container */
    videoOffContainer?: string;
    /** CSS classes for the video off state text */
    videoOffText?: string;
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
  /** Whether to hide the video element entirely */
  noVideo?: boolean;
  /** Additional props to pass to the PipecatClientVideo component */
  videoProps?: Partial<React.ComponentProps<typeof PipecatClientVideo>>;
  /** Custom text to display when video is disabled */
  noVideoText?: string | null;
  /** Whether to hide the video icon in the button */
  noIcon?: boolean;
  /** Text to display when camera is active */
  activeText?: string;
  /** Text to display when camera is inactive */
  inactiveText?: string;
  /** Custom content to render inside the button */
  children?: React.ReactNode;
}

/**
 * Props interface for the headless UserVideoComponent.
 * Includes device data and callbacks for external state management.
 */
export interface UserVideoComponentProps extends UserVideoControlBaseProps {
  /** Callback function called when the video toggle button is clicked */
  onClick?: () => void;
  /** Whether the camera is currently enabled */
  isCamEnabled?: boolean;
  /** Array of available camera devices */
  availableCams?: MediaDeviceInfo[];
  /** Currently selected camera device */
  selectedCam?: OptionalMediaDeviceInfo;
  /** Callback function called when a camera device is selected */
  updateCam?: (deviceId: string) => void;
}

/**
 * Headless UserVideoComponent that accepts all device data and callbacks as props.
 * This component can be used with any framework or state management solution.
 *
 * @example
 * ```tsx
 * <UserVideoComponent
 *   isCamEnabled={isCameraOn}
 *   onClick={handleCameraToggle}
 *   availableCams={cameras}
 *   selectedCam={currentCamera}
 *   updateCam={handleCameraChange}
 *   variant="outline"
 *   size="lg"
 * />
 * ```
 */
export const UserVideoComponent: React.FC<UserVideoComponentProps> = ({
  variant = "outline",
  size = "md",
  classNames = {},
  buttonProps = {},
  dropdownButtonProps = {},
  deviceDropDownProps = {},
  noDevicePicker = false,
  noVideo = false,
  videoProps = {},
  isCamEnabled = false,
  state,
  availableCams = [],
  selectedCam,
  updateCam,
  noVideoText = "Video disabled",
  noIcon = false,
  activeText,
  inactiveText,
  children,
  onClick,
}) => {
  const buttonState = state || (isCamEnabled ? "default" : "inactive");

  return (
    <div
      className={cn(
        "bg-muted rounded-xl relative",
        {
          "aspect-video": isCamEnabled && !noVideo,
          "h-12": !isCamEnabled || noVideo,
        },
        classNames.container,
      )}
    >
      {!noVideo && (
        <PipecatClientVideo
          className={cn(
            "rounded-xl",
            {
              hidden: !isCamEnabled,
            },
            classNames.video,
          )}
          participant="local"
          {...videoProps}
        />
      )}
      {(!isCamEnabled || noVideo) && (
        <div
          className={cn(
            "absolute h-full left-28 flex items-center justify-start rounded-xl",
            {
              "left-16": noDevicePicker,
            },
            classNames.videoOffContainer,
          )}
        >
          <div
            className={cn(
              "text-muted-foreground font-mono text-sm",
              classNames.videoOffText,
            )}
          >
            {noVideo && noVideoText
              ? noVideoText
              : isCamEnabled
                ? activeText || "Camera is on"
                : inactiveText || "Camera is off"}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2">
        <ButtonGroup className={cn(classNames.buttongroup)}>
          <Button
            className={cn(classNames.button)}
            variant={
              !isCamEnabled && !buttonProps?.isLoading ? "secondary" : variant
            }
            size={size}
            state={buttonState}
            onClick={buttonProps?.isLoading ? undefined : onClick}
            {...buttonProps}
          >
            {!noIcon &&
              !buttonProps?.isLoading &&
              (isCamEnabled ? <VideoIcon /> : <VideoOffIcon />)}
            {children}
          </Button>
          {!noDevicePicker && (
            <DeviceDropDownComponent
              availableDevices={availableCams}
              selectedDevice={selectedCam}
              updateDevice={updateCam}
              classNames={{
                dropdownMenuCheckboxItem: classNames.dropdownMenuCheckboxItem,
                dropdownMenuContent: classNames.dropdownMenuContent,
              }}
              menuLabel="Camera device"
              {...deviceDropDownProps}
            >
              <Button
                className={cn(classNames.dropdownMenuTrigger)}
                variant={variant}
                size={size}
                isIcon
                disabled={buttonProps?.isLoading}
                {...dropdownButtonProps}
              >
                <ChevronDownIcon size={16} />
              </Button>
            </DeviceDropDownComponent>
          )}
        </ButtonGroup>
      </div>
    </div>
  );
};

/**
 * Connected UserVideoControl component that integrates with the Pipecat Client SDK.
 * This component automatically manages camera detection, selection, and updates.
 * Must be used within a PipecatClientProvider context.
 *
 * @example
 * ```tsx
 * <UserVideoControl
 *   variant="outline"
 *   size="lg"
 *   noDevicePicker={false}
 *   activeText="Camera is on"
 *   inactiveText="Camera is off"
 * />
 * ```
 */
export const UserVideoControl: React.FC<UserVideoControlBaseProps> = (
  props,
) => {
  const { availableCams, selectedCam, updateCam } =
    usePipecatClientMediaDevices();

  const transportState = usePipecatClientTransportState();
  const loading =
    transportState === "disconnected" || transportState === "initializing";

  return (
    <PipecatClientCamToggle>
      {({ isCamEnabled, onClick }) => (
        <UserVideoComponent
          isCamEnabled={isCamEnabled}
          onClick={onClick}
          availableCams={availableCams}
          selectedCam={selectedCam}
          updateCam={updateCam}
          state={loading ? "default" : isCamEnabled ? "default" : "inactive"}
          buttonProps={{
            isLoading: loading,
            ...props.buttonProps,
          }}
          {...props}
        />
      )}
    </PipecatClientCamToggle>
  );
};
export default UserVideoControl;
