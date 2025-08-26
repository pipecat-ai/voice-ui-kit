import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import {
  PipecatClientVideo,
  usePipecatClientMediaTrack,
} from "@pipecat-ai/client-react";
import { VideoOffIcon } from "lucide-react";

interface BotVideoPanelProps {
  className?: string;
  collapsed?: boolean;
}

export const BotVideoPanel: React.FC<BotVideoPanelProps> = ({
  className,
  collapsed = false,
}) => {
  const track = usePipecatClientMediaTrack("video", "bot");

  return (
    <Panel
      className={cn(
        "flex-1 mb-auto",
        {
          "flex-0 border-none": collapsed,
        },
        className,
      )}
    >
      {!collapsed && (
        <PanelHeader>
          <PanelTitle>Bot Video</PanelTitle>
        </PanelHeader>
      )}
      <PanelContent
        className={cn("overflow-hidden flex-1", {
          "aspect-video": collapsed,
        })}
      >
        {track ? (
          <div
            className={cn("relative flex h-full bg-muted rounded-sm", {
              "aspect-video": collapsed,
            })}
          >
            <PipecatClientVideo
              participant="bot"
              className="aspect-video max-h-full"
              fit="contain"
            />
          </div>
        ) : (
          <div className="text-subtle flex w-full h-full gap-2 items-center justify-center">
            <VideoOffIcon size={16} />
            {!collapsed && (
              <span className="font-semibold text-sm">No video</span>
            )}
          </div>
        )}
      </PanelContent>
    </Panel>
  );
};

export default BotVideoPanel;
