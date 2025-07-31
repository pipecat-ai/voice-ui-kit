import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { MicOffIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { VoiceVisualizer } from "@/visualizers/VoiceVisualizer";
import { usePipecatClientMediaTrack } from "@pipecat-ai/client-react";
import { useEffect, useRef, useState } from "react";

interface BotAudioPanelProps {
  audioTracks?: MediaStreamTrack[];
  className?: string;
  collapsed?: boolean;
  visualization?: "bar" | "circle";
  isMuted?: boolean;
  onMuteToggle?: () => void;
}

const barCount = 10;

export const BotAudioPanel: React.FC<BotAudioPanelProps> = ({
  className,
  collapsed = false,
}) => {
  const track = usePipecatClientMediaTrack("audio", "bot");

  const [maxHeight, setMaxHeight] = useState(48);
  const [width, setWidth] = useState(4);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        const maxWidth = 240;
        const maxBarWidth = maxWidth / (2 * barCount - 1);
        const maxMaxHeight = 240 / (16 / 9);

        const barWidth = Math.max(
          Math.min(width / (barCount * 2), maxBarWidth),
          2,
        );
        const maxHeight = Math.max(Math.min(height, maxMaxHeight), 20);

        setMaxHeight(maxHeight);
        setWidth(barWidth);
      }
    });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Panel
      className={cn(
        "vkui:flex-1 vkui:mt-auto",
        {
          "vkui:flex-0 vkui:border-none": collapsed,
        },
        className,
      )}
    >
      {!collapsed && (
        <PanelHeader>
          <PanelTitle>Bot Audio</PanelTitle>
        </PanelHeader>
      )}
      <PanelContent
        className={cn("vkui:overflow-hidden vkui:flex-1", {
          "vkui:aspect-video": collapsed,
        })}
      >
        <div
          ref={containerRef}
          className="vkui:relative vkui:flex vkui:h-full vkui:overflow-hidden"
        >
          {track ? (
            <div className="vkui:m-auto">
              <VoiceVisualizer
                participantType="bot"
                backgroundColor="transparent"
                barColor="--vkui-color-agent"
                barCount={barCount}
                barGap={width}
                barLineCap="square"
                barMaxHeight={maxHeight}
                barOrigin="bottom"
                barWidth={width}
              />
            </div>
          ) : (
            <div className="vkui:text-subtle vkui:flex vkui:w-full vkui:gap-2 vkui:items-center vkui:justify-center">
              <MicOffIcon size={16} />
              {!collapsed && (
                <span className="vkui:font-semibold vkui:text-sm">
                  No audio
                </span>
              )}
            </div>
          )}
        </div>
      </PanelContent>
    </Panel>
  );
};

export default BotAudioPanel;
