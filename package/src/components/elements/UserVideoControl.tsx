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
import {
  ChevronDownIcon,
  LoaderCircle,
  VideoIcon,
  VideoOffIcon,
} from "lucide-react";

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
    /** CSS classes for the button group wrapper */
    buttongroupWrapper?: string;
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
  variant = "secondary",
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
  const buttonState = state || (isCamEnabled ? "active" : "inactive");

  // Determine button content and styling based on state
  const getButtonContent = () => {
    if (buttonProps?.isLoading) {
      return (
        <>
          {!buttonProps?.isLoading && (
            <>
              {!noIcon && <VideoOffIcon />}
              {noVideoText && <span className="flex-1">{noVideoText}</span>}
              {children}
            </>
          )}
        </>
      );
    }

    return (
      <>
        {!noIcon && (isCamEnabled ? <VideoIcon /> : <VideoOffIcon />)}
        {!noVideo && buttonState === "inactive" && inactiveText ? (
          <span className={cn("flex-1", classNames.inactiveText)}>
            {inactiveText}
          </span>
        ) : null}
        {!noVideo && buttonState !== "inactive" && activeText ? (
          <span className={cn("flex-1", classNames.activeText)}>
            {activeText}
          </span>
        ) : null}
        {children}
      </>
    );
  };

  return (
    <div
      className={cn(
        "relative",
        {
          "aspect-video bg-primary rounded-md": !noVideo,
        },
        classNames.container,
      )}
    >
      {!noVideo && (
        <>
          <PipecatClientVideo
            className={cn(
              "rounded-md w-full h-full object-cover aspect-video",
              {
                hidden: !isCamEnabled,
              },
              classNames.video,
            )}
            participant="local"
            {...videoProps}
          />

          {buttonProps?.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="animate-spin" size={24} />
            </div>
          )}
        </>
      )}

      <div
        className={cn(
          {
            "absolute bottom-2 left-2": !noVideo,
          },
          classNames.buttongroupWrapper,
        )}
      >
        <ButtonGroup
          className={cn(
            variant !== "outline" && "gap-[1px]",
            classNames.buttongroup,
          )}
        >
          <Button
            className={cn(
              {
                "w-fit! hover:opacity-100! hover:bg-muted hover:text-muted-foreground":
                  !noVideo,
                "flex-1 w-full z-10": noVideo,
                "rounded-e-none": noVideo && !noDevicePicker,
                "bg-active text-active-foreground": isCamEnabled,
              },
              classNames.button,
            )}
            variant={variant}
            size={size}
            state={buttonState}
            onClick={buttonProps?.isLoading ? undefined : onClick}
            isIcon={!noVideo}
            disabled={buttonProps?.isLoading}
            {...buttonProps}
          >
            {getButtonContent()}
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
                className={cn(
                  {
                    "hover:opacity-100! hover:bg-primary hover:text-primary-foreground":
                      !noVideo,
                    "flex-none z-0 rounded-s-none border-l-0": noVideo,
                  },
                  classNames.dropdownMenuTrigger,
                )}
                variant={variant}
                size={size}
                isIcon
                disabled={buttonProps?.isLoading}
                {...dropdownButtonProps}
              >
                <ChevronDownIcon size={noVideo ? 16 : 12} />
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
