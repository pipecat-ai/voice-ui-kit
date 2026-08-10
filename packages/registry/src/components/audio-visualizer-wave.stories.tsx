import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

import { AudioVisualizerWaveView } from "@/components/pipecat/audio-visualizer-wave";

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
  title: "Components/AudioVisualizerWave",
  component: AudioVisualizerWaveView,
  args: {
    size: 224,
  },
} satisfies Meta<typeof AudioVisualizerWaveView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
  args: { track: null },
};

export const Connecting: Story = {
  args: { track: null, isConnecting: true },
};

export const Thinking: Story = {
  args: { track: null, isThinking: true },
};

export const Microphone: Story = {
  render: (args) => {
    const MicStory = () => {
      const [enabled, setEnabled] = useState(false);
      const track = useMicrophoneTrack(enabled);
      return (
        <div className="flex flex-col items-center gap-4">
          <AudioVisualizerWaveView {...args} track={track} />
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
