import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { VideoOffIcon } from "@/icons";
import { cn } from "@/lib/utils";
import {
  RTVIClientVideo,
  useRTVIClientMediaTrack,
} from "@pipecat-ai/client-react";

interface BotVideoPanelProps {
  className?: string;
  collapsed?: boolean;
}

export const BotVideoPanel: React.FC<BotVideoPanelProps> = ({
  className,
  collapsed = false,
}) => {
  const track = useRTVIClientMediaTrack("video", "bot");
  return (
    <Panel
      className={cn(className, {
        "vkui:border-none": collapsed,
      })}
    >
      {!collapsed && (
        <PanelHeader>
          <PanelTitle>Bot Video</PanelTitle>
        </PanelHeader>
      )}
      <PanelContent
        className={cn("vkui:relative vkui:overflow-hidden", {
          "vkui:p-0!": collapsed,
        })}
      >
        <RTVIClientVideo
          participant="bot"
          className="vkui:aspect-video vkui:bg-muted vkui:rounded-sm vkui:max-h-full"
          fit="contain"
        />
        {!track && (
          <div className="vkui:absolute vkui:inset-0 vkui:flex vkui:gap-1 vkui:items-center vkui:justify-center">
            <VideoOffIcon size={16} />
            {!collapsed && (
              <span className="vkui:font-mono vkui:text-xs">No video</span>
            )}
          </div>
        )}
      </PanelContent>
    </Panel>
  );
};
