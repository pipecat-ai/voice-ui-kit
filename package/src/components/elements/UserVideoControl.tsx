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
import { type DeviceErrorReason } from "@pipecat-ai/client-js";
import {
  type OptionalMediaDeviceInfo,
  PipecatClientCamToggle,
  PipecatClientVideo,
  useMediaState,
  usePipecatClientMediaDevices,
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
  /**
   * When set, renders a disabled button with this message instead of the
   * toggle and hides the picker. Used by the connected UserVideoControl to
   * surface cam-error states (blocked, in-use, etc.) sourced from
   * useMediaState(). Distinct from `noVideo`, which is a deliberate
   * consumer opt-out.
   */
  unavailableText?: string;
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
  // noVideoText is currently not rendered by this component (loading uses
  // the spinner overlay; unavailable states use unavailableText). Kept on
  // the public prop type for API stability — future revisions could pipe
  // it into a "video disabled" state if needed.
  noIcon = false,
  activeText,
  inactiveText,
  children,
  onClick,
  unavailableText,
}) => {
  const buttonState = state || (isCamEnabled ? "active" : "inactive");
  const isUnavailable = !!unavailableText;
  // The button is non-interactive whenever the cam isn't usable, whether
  // we're still figuring out (isLoading) or it's known to be in error
  // (isUnavailable). Keep this logic in one place.
  const buttonDisabled = buttonProps?.isLoading || isUnavailable;

  // Determine button content and styling based on state
  const getButtonContent = () => {
    if (buttonProps?.isLoading) {
      // Loading: render nothing — the spinner overlay or Button's own
      // loading indicator carries the message.
      return null;
    }

    if (isUnavailable) {
      return (
        <>
          {!noIcon && <VideoOffIcon />}
          <span className="flex-1">{unavailableText}</span>
          {children}
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
                "rounded-e-none": noVideo && !noDevicePicker && !isUnavailable,
                "bg-active text-active-foreground": isCamEnabled,
              },
              classNames.button,
            )}
            variant={variant}
            size={size}
            state={buttonState}
            onClick={buttonDisabled ? undefined : onClick}
            isIcon={!noVideo && !isUnavailable}
            disabled={buttonDisabled}
            {...buttonProps}
          >
            {getButtonContent()}
          </Button>
          {!noDevicePicker && !isUnavailable && (
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
/**
 * Map a per-device DeviceErrorReason onto a short, user-facing message for
 * the disabled camera button. Kept minimal per Plan A's "minimal
 * affordance" decision.
 */
const camErrorText = (reason: DeviceErrorReason): string => {
  switch (reason) {
    case "blocked":
      return "Camera blocked";
    case "already-in-use":
      return "Camera in use";
    case "not-found":
      return "No camera";
    case "not-supported":
      return "Video not supported";
    case "unknown":
    default:
      return "Camera unavailable";
  }
};

export const UserVideoControl: React.FC<UserVideoControlBaseProps> = ({
  buttonProps,
  ...props
}) => {
  const { availableCams, selectedCam, updateCam } =
    usePipecatClientMediaDevices();

  // Drive loading and error UI from the per-device MediaState surface
  // (Plan A step 2). Decouples the button from TransportState, so the
  // picker stays accessible across connect / disconnect cycles once cam
  // permission has been granted.
  //
  // 'uninitialized' is intentionally NOT treated as loading. It maps to
  // both pre-init (initDevices() not called yet) AND post-init when the
  // transport didn't acquire the cam (e.g. enableCam was false, or
  // daily-js skipping cam under startVideoOff: true). In those cases
  // there's no work in flight, so showing a spinner indefinitely would
  // be wrong. The button just renders as inactive — clicking it routes
  // through PipecatClientCamToggle as usual.
  const { cam } = useMediaState();
  const isLoading = cam.state === "initializing";
  const unavailableText =
    cam.state === "error" ? camErrorText(cam.reason) : undefined;

  return (
    <PipecatClientCamToggle>
      {({ isCamEnabled, onClick }) => (
        <UserVideoComponent
          isCamEnabled={isCamEnabled}
          onClick={onClick}
          availableCams={availableCams}
          selectedCam={selectedCam}
          updateCam={updateCam}
          state={isLoading ? "default" : isCamEnabled ? "default" : "inactive"}
          unavailableText={unavailableText}
          buttonProps={{
            isLoading,
            ...buttonProps,
          }}
          {...props}
        />
      )}
    </PipecatClientCamToggle>
  );
};
export default UserVideoControl;
