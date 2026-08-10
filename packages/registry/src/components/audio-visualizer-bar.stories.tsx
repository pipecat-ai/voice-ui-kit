import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

import { AudioVisualizerBarView } from "@/components/pipecat/audio-visualizer-bar";

function useMicrophoneTrack(enabled: boolean) {
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let stream: MediaStream | undefined;
    let cancelled = false;
    void navigator.mediaDevices.getUserMedia({ audio: true }).then((s) => {
      if (cancelled) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream = s;
      setTrack(s.getAudioTracks()[0] ?? null);
    });
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
      setTrack(null);
    };
  }, [enabled]);

  return track;
}

const meta = {
  title: "Components/AudioVisualizerBar",
  component: AudioVisualizerBarView,
  args: {
    barCount: 5,
    barGap: 12,
    barWidth: 30,
    barMaxHeight: 120,
    barOrigin: "center",
    barLineCap: "round",
    noPeaks: true,
  },
  argTypes: {
    barOrigin: { control: "select", options: ["top", "bottom", "center"] },
    barLineCap: { control: "select", options: ["round", "square"] },
  },
} satisfies Meta<typeof AudioVisualizerBarView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { track: null },
};

export const Connecting: Story = {
  args: {
    track: null,
    isConnecting: true,
    barCount: 8,
    barWidth: 12,
    barGap: 8,
    barMaxHeight: 96,
  },
};

export const Thinking: Story = {
  args: {
    track: null,
    isThinking: true,
    barCount: 8,
    barWidth: 12,
    barGap: 8,
    barMaxHeight: 96,
  },
};

export const Microphone: Story = {
  render: (args) => {
    const MicStory = () => {
      const [enabled, setEnabled] = useState(false);
      const track = useMicrophoneTrack(enabled);
      return (
        <div className="flex flex-col items-center gap-4">
          <AudioVisualizerBarView {...args} track={track} />
          <button
            className="text-muted-foreground font-mono text-xs underline"
            onClick={() => setEnabled((v) => !v)}
          >
            {enabled ? "stop microphone" : "use microphone"}
          </button>
        </div>
      );
    };
    return <MicStory />;
  },
};

export const AccentColored: Story = {
  args: { track: null, barCount: 10, barWidth: 6, barGap: 4, barMaxHeight: 40 },
  render: (args) => (
    <div className="text-active">
      <AudioVisualizerBarView {...args} />
    </div>
  ),
};
