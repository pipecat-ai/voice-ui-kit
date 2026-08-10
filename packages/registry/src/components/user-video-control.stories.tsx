import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { UserVideoControlView } from "@/components/pipecat/user-video-control";

import { MOCK_CAMERAS } from "../fixtures/devices";

const meta = {
  title: "Components/UserVideoControl",
  component: UserVideoControlView,
} satisfies Meta<typeof UserVideoControlView>;

export default meta;
type Story = StoryObj<typeof meta>;

function Stateful(
  props: Partial<React.ComponentProps<typeof UserVideoControlView>>,
) {
  const [enabled, setEnabled] = useState(false);
  const [camId, setCamId] = useState(MOCK_CAMERAS[0]!.deviceId);
  return (
    <UserVideoControlView
      isCamEnabled={enabled}
      onToggleCam={() => setEnabled((v) => !v)}
      cams={MOCK_CAMERAS}
      selectedCam={MOCK_CAMERAS.find((d) => d.deviceId === camId)}
      onCamChange={setCamId}
      video={
        <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center font-mono text-xs">
          camera preview
        </div>
      }
      {...props}
    />
  );
}

export const Tile: Story = {
  render: () => (
    <div className="w-96">
      <Stateful />
    </div>
  ),
};

export const ButtonOnly: Story = {
  render: () => (
    <Stateful noVideo activeText="Camera on" inactiveText="Camera off" />
  ),
};

export const Loading: Story = {
  args: { isLoading: true, noVideo: true },
};

export const Unavailable: Story = {
  args: { unavailableText: "Camera blocked", noVideo: true },
};
