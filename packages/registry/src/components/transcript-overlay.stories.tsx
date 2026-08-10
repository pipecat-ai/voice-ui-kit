import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";

import { TranscriptOverlayView } from "@/components/pipecat/transcript-overlay";

const SENTENCE =
  "Hi there! I'm your voice agent — ask me anything about your account.".split(
    " ",
  );

const meta = {
  title: "Components/TranscriptOverlay",
  component: TranscriptOverlayView,
} satisfies Meta<typeof TranscriptOverlayView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Static: Story = {
  args: { words: SENTENCE },
  render: (args) => (
    <div className="w-96">
      <TranscriptOverlayView {...args} />
    </div>
  ),
};

export const Streaming: Story = {
  args: { words: SENTENCE },
  render: function StreamingStory() {
    const [count, setCount] = useState(1);
    const [turnEnd, setTurnEnd] = useState(false);
    useEffect(() => {
      const interval = setInterval(() => {
        setCount((c) => {
          if (c >= SENTENCE.length) {
            setTurnEnd(true);
            setTimeout(() => {
              setTurnEnd(false);
              setCount(1);
            }, 2500);
            clearInterval(interval);
            return c;
          }
          return c + 1;
        });
      }, 250);
      return () => clearInterval(interval);
    }, [turnEnd]);
    return (
      <div className="w-96">
        <TranscriptOverlayView
          words={SENTENCE.slice(0, count)}
          turnEnd={turnEnd}
        />
      </div>
    );
  },
};

export const Sizes: Story = {
  args: { words: [] },
  render: () => (
    <div className="flex w-96 flex-col gap-6">
      <TranscriptOverlayView size="sm" words={["Small", "caption", "size"]} />
      <TranscriptOverlayView words={["Default", "caption", "size"]} />
      <TranscriptOverlayView size="lg" words={["Large", "caption", "size"]} />
    </div>
  ),
};
