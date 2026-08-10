import type { Meta, StoryObj } from "@storybook/react-vite";

import { SessionInfoView } from "@/components/pipecat/session-info";

const meta = {
  title: "Components/SessionInfo",
  component: SessionInfoView,
} satisfies Meta<typeof SessionInfoView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    transportName: "Daily",
    sessionId: "d3adb33f-1234-5678-9abc-def012345678",
    participantId: "a1b2c3d4-5678-90ab-cdef-1234567890ab",
    clientVersion: "1.13.0",
    serverVersion: "1.1.0",
  },
  render: (args) => (
    <div className="w-96">
      <SessionInfoView {...args} />
    </div>
  ),
};

export const Disconnected: Story = {
  args: { transportName: "Small WebRTC" },
  render: (args) => (
    <div className="w-96">
      <SessionInfoView {...args} />
    </div>
  ),
};
