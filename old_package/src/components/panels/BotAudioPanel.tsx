import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import { VoiceVisualizer } from "@/visualizers/VoiceVisualizer";
import { usePipecatClientMediaTrack } from "@pipecat-ai/client-react";
import { MicOffIcon } from "lucide-react";
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
        "flex-1 mt-auto",
        {
          "flex-0 border-none": collapsed,
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
        className={cn("overflow-hidden flex-1", {
          "aspect-video": collapsed,
        })}
      >
        <div
          ref={containerRef}
          className="relative flex h-full overflow-hidden"
        >
          {track ? (
            <div className="m-auto">
              <VoiceVisualizer
                participantType="bot"
                backgroundColor="transparent"
                barColor="--color-agent"
                barCount={barCount}
                barGap={width}
                barLineCap="square"
                barMaxHeight={maxHeight}
                barOrigin="bottom"
                barWidth={width}
              />
            </div>
          ) : (
            <div className="text-subtle flex w-full gap-2 items-center justify-center">
              <MicOffIcon size={16} />
              {!collapsed && (
                <span className="font-semibold text-sm">No audio</span>
              )}
            </div>
          )}
        </div>
      </PanelContent>
    </Panel>
  );
};

export default BotAudioPanel;
