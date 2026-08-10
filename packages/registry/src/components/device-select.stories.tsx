import type { Meta, StoryObj } from "@storybook/react-vite";
import { MicIcon } from "lucide-react";
import { useState } from "react";

import {
  DeviceDropdownContent,
  DeviceDropdownTrigger,
  DeviceDropdownView,
  DeviceSelectView,
} from "@/components/pipecat/device-select";
import { Button } from "@/components/ui/button";

import { MOCK_MICS, MOCK_SPEAKERS } from "../fixtures/devices";

const meta = {
  title: "Components/DeviceSelect",
  component: DeviceSelectView,
} satisfies Meta<typeof DeviceSelectView>;

export default meta;
type Story = StoryObj<typeof meta>;

function StatefulSelect(
  props: Partial<React.ComponentProps<typeof DeviceSelectView>>,
) {
  const [selectedId, setSelectedId] = useState(MOCK_MICS[0]!.deviceId);
  const devices = props.devices ?? MOCK_MICS;
  return (
    <DeviceSelectView
      {...props}
      devices={devices}
      selectedDevice={devices.find((d) => d.deviceId === selectedId)}
      onDeviceChange={setSelectedId}
    />
  );
}

export const Default: Story = {
  render: () => <StatefulSelect />,
};

export const WithGuide: Story = {
  render: () => (
    <div className="w-80">
      <StatefulSelect
        kind="audiooutput"
        devices={MOCK_SPEAKERS}
        guide={<MicIcon className="size-4" />}
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => <DeviceSelectView devices={[]} />,
};

export const Dropdown: Story = {
  render: function DropdownStory() {
    const [selectedId, setSelectedId] = useState(MOCK_MICS[1]!.deviceId);
    return (
      <DeviceDropdownView
        devices={MOCK_MICS}
        selectedDevice={MOCK_MICS.find((d) => d.deviceId === selectedId)}
        onDeviceChange={setSelectedId}
      >
        <DeviceDropdownTrigger
          render={<Button variant="outline">Choose microphone</Button>}
        />
        <DeviceDropdownContent />
      </DeviceDropdownView>
    );
  },
};
