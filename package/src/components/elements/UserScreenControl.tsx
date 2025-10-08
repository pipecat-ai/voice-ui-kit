"use client";

import { Button } from "@/components/ui/button";
import {
  type ButtonSize,
  type ButtonState,
  type ButtonVariant,
} from "@/components/ui/buttonVariants";
import { usePipecatConnectionState } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  type OptionalMediaDeviceInfo,
  PipecatClientScreenShareToggle,
  PipecatClientVideo,
} from "@pipecat-ai/client-react";
import { LoaderCircle, MonitorIcon, MonitorOffIcon } from "lucide-react";

/**
 * Base props interface for UserScreenControl components.
 * Provides styling, behavior, and customization options for screen sharing controls.
 */
export interface UserScreenControlBaseProps {
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
    /** CSS classes for the screen element */
    screen?: string;
    /** CSS classes for the button group */
    buttongroup?: string;
    /** CSS classes for the main control button */
    button?: string;
    /** CSS classes for the screen off state container */
    screenOffContainer?: string;
    /** CSS classes for the screen off state text */
    screenOffText?: string;
    /** CSS classes for active state text */
    activeText?: string;
    /** CSS classes for inactive state text */
    inactiveText?: string;
  };
  /** Whether to hide the screen element entirely */
  noScreen?: boolean;
  /** Additional props to pass to the PipecatClientVideo component (used for screen sharing) */
  screenProps?: Partial<React.ComponentProps<typeof PipecatClientVideo>>;
  /** Custom text to display when screen sharing is disabled */
  noScreenText?: string | null;
  /** Whether to hide the screen icon in the button */
  noIcon?: boolean;
  /** Text to display when screen sharing is active */
  activeText?: string;
  /** Text to display when screen sharing is inactive */
  inactiveText?: string;
  /** Custom content to render inside the button */
  children?: React.ReactNode;
}

/**
 * Props interface for the headless UserScreenComponent.
 * Includes device data and callbacks for external state management.
 */
export interface UserScreenComponentProps extends UserScreenControlBaseProps {
  /** Callback function called when the screen toggle button is clicked */
  onClick?: () => void;
  /** Whether the screen sharing is currently enabled */
  isScreenEnabled?: boolean;
  /** Array of available screen sources */
  availableScreens?: MediaDeviceInfo[];
  /** Currently selected screen source */
  selectedScreen?: OptionalMediaDeviceInfo;
  /** Callback function called when a screen source is selected */
  updateScreen?: (deviceId: string) => void;
}

/**
 * Headless UserScreenComponent that accepts all device data and callbacks as props.
 * This component can be used with any framework or state management solution.
 *
 * @example
 * ```tsx
 * <UserScreenComponent
 *   isScreenEnabled={isScreenSharingOn}
 *   onClick={handleScreenToggle}
 *   availableScreens={screens}
 *   selectedScreen={currentScreen}
 *   updateScreen={handleScreenChange}
 *   variant="outline"
 *   size="lg"
 * />
 * ```
 */
export const UserScreenComponent: React.FC<UserScreenComponentProps> = ({
  variant = "secondary",
  size = "md",
  classNames = {},
  buttonProps = {},
  noScreen = false,
  screenProps = {},
  isScreenEnabled = false,
  state,
  noScreenText = "Screen sharing disabled",
  noIcon = false,
  activeText,
  inactiveText,
  children,
  onClick,
}) => {
  const buttonState = state || (isScreenEnabled ? "active" : "inactive");

  // Determine button content and styling based on state
  const getButtonContent = () => {
    if (buttonProps?.isLoading) {
      return (
        <>
          {!buttonProps?.isLoading && (
            <>
              {!noIcon && <MonitorOffIcon />}
              {noScreenText && <span className="flex-1">{noScreenText}</span>}
              {children}
            </>
          )}
        </>
      );
    }

    return (
      <>
        {!noIcon && (isScreenEnabled ? <MonitorIcon /> : <MonitorOffIcon />)}
        {!noScreen && buttonState === "inactive" && inactiveText ? (
          <span className={cn("flex-1", classNames.inactiveText)}>
            {inactiveText}
          </span>
        ) : null}
        {!noScreen && buttonState !== "inactive" && activeText ? (
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
          "aspect-video bg-primary rounded-md": !noScreen,
        },
        classNames.container,
      )}
    >
      {!noScreen && (
        <>
          <PipecatClientVideo
            className={cn(
              "rounded-md w-full h-full object-cover aspect-video",
              {
                hidden: !isScreenEnabled,
              },
              classNames.screen,
            )}
            participant="local"
            trackType="screenVideo"
            {...screenProps}
          />

          {buttonProps?.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <LoaderCircle className="animate-spin" size={24} />
            </div>
          )}
        </>
      )}

      <div
        className={cn({
          "absolute bottom-2 left-2": !noScreen,
        })}
      >
        <Button
          className={cn(
            {
              "w-fit! hover:opacity-100! hover:bg-muted hover:text-muted-foreground":
                !noScreen,
              "flex-1 w-full z-10": noScreen,
              "bg-active text-active-foreground": isScreenEnabled,
            },
            classNames.button,
          )}
          variant={variant}
          size={size}
          state={buttonState}
          onClick={buttonProps?.isLoading ? undefined : onClick}
          isIcon={!noScreen}
          disabled={buttonProps?.disabled || buttonProps?.isLoading}
          {...buttonProps}
        >
          {getButtonContent()}
        </Button>
      </div>
    </div>
  );
};

/**
 * Connected UserScreenControl component that integrates with the Pipecat Client SDK.
 * This component automatically manages screen sharing detection, selection, and updates.
 * Must be used within a PipecatClientProvider context.
 *
 * @example
 * ```tsx
 * <UserScreenControl
 *   variant="outline"
 *   size="lg"
 *   noDevicePicker={false}
 *   activeText="Screen sharing is on"
 *   inactiveText="Screen sharing is off"
 * />
 * ```
 */
export const UserScreenControl: React.FC<UserScreenControlBaseProps> = (
  props,
) => {
  const { isConnected } = usePipecatConnectionState();

  return (
    <PipecatClientScreenShareToggle>
      {({ isScreenShareEnabled, onClick }) => (
        <>
          <UserScreenComponent
            isScreenEnabled={isScreenShareEnabled}
            noScreen={!isScreenShareEnabled}
            onClick={onClick}
            {...props}
            buttonProps={{
              disabled: !isConnected,
              ...props.buttonProps,
            }}
          />
        </>
      )}
    </PipecatClientScreenShareToggle>
  );
};
export default UserScreenControl;
