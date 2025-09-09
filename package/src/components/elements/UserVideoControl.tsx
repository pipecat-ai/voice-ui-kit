"use client";

import { Button } from "@/components/ui/button";
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
import { ButtonGroup } from "../ui";
import { DeviceDropDownComponent } from "./DeviceDropDown";

interface Props {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  buttonProps?: Partial<React.ComponentProps<typeof Button>>;
  classNames?: {
    container?: string;
    video?: string;
    buttongroup?: string;
    button?: string;
    dropdownMenuTrigger?: string;
    dropdownMenuContent?: string;
    dropdownMenuCheckboxItem?: string;
    videoOffContainer?: string;
    videoOffText?: string;
    activeText?: string;
    inactiveText?: string;
  };
  dropdownButtonProps?: Partial<React.ComponentProps<typeof Button>>;
  noDevicePicker?: boolean;
  noVideo?: boolean;
  videoProps?: Partial<React.ComponentProps<typeof PipecatClientVideo>>;
  noVideoText?: string | null;
  noIcon?: boolean;
  activeText?: string;
  inactiveText?: string;
  children?: React.ReactNode;
}

interface ComponentProps extends Props {
  onClick?: () => void;
  isCamEnabled?: boolean;
  availableCams?: MediaDeviceInfo[];
  selectedCam?: OptionalMediaDeviceInfo;
  updateCam?: (deviceId: string) => void;
}

export const UserVideoComponent: React.FC<ComponentProps> = ({
  variant = "outline",
  size = "md",
  classNames = {},
  buttonProps = {},
  dropdownButtonProps = {},
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

export const UserVideoControl: React.FC<Props> = (props) => {
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
