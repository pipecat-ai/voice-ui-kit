import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/buttongroup";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, VideoIcon, VideoOffIcon } from "@/icons";
import { cn } from "@/lib/utils";
import {
  PipecatClientCamToggle,
  PipecatClientVideo,
  usePipecatClientMediaDevices,
} from "@pipecat-ai/client-react";

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

export const UserVideo: React.FC<Props> = ({
  buttonProps = {},
  classNames = {},
  dropdownButtonProps = {},
  noDevicePicker = false,
  noVideo = false,
  videoProps = {},
}) => {
  const { availableCams, selectedCam, updateCam } =
    usePipecatClientMediaDevices();

  return (
    <PipecatClientCamToggle>
      {({ isCamEnabled, onClick }) => (
        <div
          className={cn(
            "vkui:bg-muted vkui:rounded-xl vkui:relative",
            {
              "vkui:aspect-video": isCamEnabled && !noVideo,
              "vkui:h-12": !isCamEnabled || noVideo,
            },
            classNames.container,
          )}
        >
          {!noVideo && (
            <PipecatClientVideo
              className={cn(
                "vkui:rounded-xl",
                {
                  "vkui:hidden": !isCamEnabled,
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
                "vkui:absolute vkui:h-full vkui:left-28 vkui:flex vkui:items-center vkui:justify-start vkui:rounded-xl",
                {
                  "vkui:left-16": noDevicePicker,
                },
                classNames.videoOffContainer,
              )}
            >
              <div
                className={cn(
                  "vkui:text-muted-foreground vkui:font-mono vkui:text-sm",
                  classNames.videoOffText,
                )}
              >
                {isCamEnabled ? "Camera is on" : "Camera is off"}
              </div>
            </div>
          )}
          <div className="vkui:absolute vkui:bottom-2 vkui:left-2">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className={cn(classNames.dropdownMenuTrigger)}
                      variant="outline"
                      {...dropdownButtonProps}
                    >
                      <ChevronDownIcon />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className={cn(classNames.dropdownMenuContent)}
                  >
                    {availableCams.map((cam) => (
                      <DropdownMenuCheckboxItem
                        key={cam.deviceId}
                        checked={selectedCam?.deviceId === cam.deviceId}
                        onClick={() => updateCam(cam.deviceId)}
                        className={cn(classNames.dropdownMenuCheckboxItem)}
                      >
                        {cam.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </ButtonGroup>
          </div>
        </div>
      )}
    </PipecatClientCamToggle>
  );
};
export default UserVideo;
