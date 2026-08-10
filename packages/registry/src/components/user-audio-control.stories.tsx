import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { UserAudioControlView } from "@/components/pipecat/user-audio-control";

import { MOCK_MICS, MOCK_SPEAKERS } from "../fixtures/devices";

const meta = {
  title: "Components/UserAudioControl",
  component: UserAudioControlView,
  args: {
    variant: "outline",
    size: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost"],
    },
    size: { control: "select", options: ["sm", "default", "lg"] },
  },
} satisfies Meta<typeof UserAudioControlView>;

export default meta;
type Story = StoryObj<typeof meta>;

function Stateful(
  props: Partial<React.ComponentProps<typeof UserAudioControlView>>,
) {
  const [enabled, setEnabled] = useState(true);
  const [micId, setMicId] = useState(MOCK_MICS[0]!.deviceId);
  const [speakerId, setSpeakerId] = useState(MOCK_SPEAKERS[0]!.deviceId);
  return (
    <UserAudioControlView
      isMicEnabled={enabled}
      onToggleMic={() => setEnabled((v) => !v)}
      mics={MOCK_MICS}
      selectedMic={MOCK_MICS.find((d) => d.deviceId === micId)}
      onMicChange={setMicId}
      speakers={MOCK_SPEAKERS}
      selectedSpeaker={MOCK_SPEAKERS.find((d) => d.deviceId === speakerId)}
      onSpeakerChange={setSpeakerId}
      {...props}
    />
  );
}

export const Default: Story = {
  render: (args) => <Stateful {...args} />,
};

export const PushToTalk: Story = {
  render: function PushToTalkStory(args) {
    const [enabled, setEnabled] = useState(false);
    const [mode, setMode] = useState<"toggle" | "push-to-talk">("push-to-talk");
    return (
      <UserAudioControlView
        {...args}
        isMicEnabled={enabled}
        onMicEnabledChange={setEnabled}
        mode={mode}
        onModeChange={setMode}
        mics={MOCK_MICS}
        selectedMic={MOCK_MICS[0]}
        speakers={MOCK_SPEAKERS}
        selectedSpeaker={MOCK_SPEAKERS[0]}
      />
    );
  },
};

export const WithText: Story = {
  render: (args) => (
    <Stateful {...args} activeText="Microphone on" inactiveText="Muted" />
  ),
};

export const Loading: Story = {
  args: { isLoading: true },
};

export const Unavailable: Story = {
  args: { unavailableText: "Microphone blocked" },
};

export const NoDevicePicker: Story = {
  render: (args) => <Stateful {...args} noDevicePicker />,
};
