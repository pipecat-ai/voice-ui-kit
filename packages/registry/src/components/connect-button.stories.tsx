import { type TransportState, TransportStateEnum } from "@pipecat-ai/client-js";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { PhoneIcon, PhoneOffIcon } from "lucide-react";

import { ConnectButtonView } from "@/components/pipecat/connect-button";

const TRANSPORT_STATES = Object.values(TransportStateEnum) as TransportState[];

const meta = {
  title: "Components/ConnectButton",
  component: ConnectButtonView,
  args: {
    transportState: "disconnected",
  },
  argTypes: {
    transportState: {
      control: "select",
      options: TRANSPORT_STATES,
    },
  },
} satisfies Meta<typeof ConnectButtonView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomStateProps: Story = {
  args: {
    stateProps: {
      disconnected: { children: "Start call", icon: <PhoneIcon /> },
      initialized: { children: "Start call", icon: <PhoneIcon /> },
      ready: {
        children: "End call",
        icon: <PhoneOffIcon />,
        variant: "destructive",
      },
      error: { children: "Try again" },
    },
  },
};

export const AllStates: Story = {
  render: (args) => (
    <div className="flex flex-col items-start gap-3">
      {TRANSPORT_STATES.map((state) => (
        <div key={state} className="flex items-center gap-3">
          <ConnectButtonView {...args} transportState={state} />
          <span className="text-muted-foreground font-mono text-xs">
            {state}
          </span>
        </div>
      ))}
    </div>
  ),
};
