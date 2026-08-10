import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import {
  BotAudioControlView,
  BotVolumeSliderView,
} from "@/components/pipecat/bot-audio";

const meta = {
  title: "Components/BotAudio",
  component: BotAudioControlView,
} satisfies Meta<typeof BotAudioControlView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Control: Story = {
  render: function ControlStory() {
    const [volume, setVolume] = useState(0.8);
    return (
      <BotAudioControlView
        volume={volume}
        onVolumeChange={setVolume}
        label="Bot volume"
      />
    );
  },
};

export const InlineSlider: Story = {
  render: function SliderStory() {
    const [volume, setVolume] = useState(0.5);
    return (
      <div className="w-64">
        <BotVolumeSliderView volume={volume} onVolumeChange={setVolume} />
      </div>
    );
  },
};

export const Vertical: Story = {
  render: function VerticalStory() {
    const [volume, setVolume] = useState(0.6);
    return (
      <BotVolumeSliderView
        volume={volume}
        onVolumeChange={setVolume}
        orientation="vertical"
        noLabel
      />
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, label: "Bot volume" },
};
