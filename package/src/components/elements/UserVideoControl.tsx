import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttongroup";
import { cn } from "@/lib/utils";
import {
  type OptionalMediaDeviceInfo,
  PipecatClientCamToggle,
  PipecatClientVideo,
  usePipecatClientMediaDevices,
} from "@pipecat-ai/client-react";
import { ChevronDownIcon, VideoIcon, VideoOffIcon } from "lucide-react";
import { DeviceDropDownComponent } from "./DeviceDropDown";

interface Props {
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
  };
  dropdownButtonProps?: Partial<React.ComponentProps<typeof Button>>;
  noDevicePicker?: boolean;
  noVideo?: boolean;
  videoProps?: Partial<React.ComponentProps<typeof PipecatClientVideo>>;
}

interface ComponentProps extends Props {
  onClick?: () => void;
  isCamEnabled?: boolean;
  availableCams?: MediaDeviceInfo[];
  selectedCam?: OptionalMediaDeviceInfo;
  updateCam?: (deviceId: string) => void;
}

export const UserVideoComponent: React.FC<ComponentProps> = ({
  buttonProps = {},
  classNames = {},
  dropdownButtonProps = {},
  noDevicePicker = false,
  noVideo = false,
  videoProps = {},
  onClick,
  isCamEnabled,
  availableCams = [],
  selectedCam,
  updateCam,
}) => {
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
            {isCamEnabled ? "Camera is on" : "Camera is off"}
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2">
        <ButtonGroup className={cn(classNames.buttongroup)}>
          <Button
            className={cn(classNames.button)}
            variant="outline"
            onClick={onClick}
            {...buttonProps}
          >
            {isCamEnabled ? <VideoIcon /> : <VideoOffIcon />}
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
                variant="outline"
                {...dropdownButtonProps}
              >
                <ChevronDownIcon />
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

  return (
    <PipecatClientCamToggle>
      {({ isCamEnabled, onClick }) => (
        <UserVideoComponent
          {...props}
          isCamEnabled={isCamEnabled}
          onClick={onClick}
          availableCams={availableCams}
          selectedCam={selectedCam}
          updateCam={updateCam}
        />
      )}
    </PipecatClientCamToggle>
  );
};
export default UserVideoControl;
