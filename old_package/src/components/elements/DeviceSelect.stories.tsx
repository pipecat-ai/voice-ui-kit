import { Card, CardContent } from "@/components/ui/card";
import { type SelectTriggerProps } from "@/components/ui/select";
import type { Story, StoryDefault } from "@ladle/react";
import { PipecatClient } from "@pipecat-ai/client-js";
import { PipecatClientProvider } from "@pipecat-ai/client-react";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { useEffect, useState } from "react";
import { DeviceSelect, DeviceSelectComponent } from "./DeviceSelect";

const mockDevices: MediaDeviceInfo[] = [
  {
    deviceId: "default-1",
    groupId: "group-1",
    kind: "audioinput",
    label: "Default Microphone",
    toJSON() {
      return this as unknown as MediaDeviceInfo;
    },
  } as MediaDeviceInfo,
  {
    deviceId: "usb-2",
    groupId: "group-1",
    kind: "audioinput",
    label: "USB Mic",
    toJSON() {
      return this as unknown as MediaDeviceInfo;
    },
  } as MediaDeviceInfo,
  {
    deviceId: "bt-3",
    groupId: "group-2",
    kind: "audioinput",
    label: "Bluetooth Headset",
    toJSON() {
      return this as unknown as MediaDeviceInfo;
    },
  } as MediaDeviceInfo,
];

export default {
  title: "Components / Device Select",
} satisfies StoryDefault;

export const Default: Story<SelectTriggerProps> = ({ ...props }) => (
  <Card className="w-full max-w-sm">
    <CardContent className="p-6">
      <div className="flex flex-col gap-4">
        <DeviceSelectComponent
          {...props}
          placeholder="Select microphone"
          guide="Mic"
          availableDevices={mockDevices}
          selectedDevice={mockDevices[0]}
          updateDevice={() => {}}
        />
        <DeviceSelectComponent
          {...props}
          size="lg"
          placeholder="Select microphone"
          availableDevices={mockDevices}
          selectedDevice={mockDevices[1]}
          updateDevice={() => {}}
        />
      </div>
    </CardContent>
  </Card>
);

Default.storyName = "Device Select";

export const Connected: Story<SelectTriggerProps> = ({ ...props }) => (
  <Card className="w-full max-w-sm">
    <CardContent className="p-6">
      <DeviceSelect {...props} placeholder="Select microphone" guide="Mic" />
    </CardContent>
  </Card>
);

Connected.decorators = [
  (Component) => {
    const [client, setClient] = useState<PipecatClient | null>(null);

    useEffect(() => {
      const client = new PipecatClient({
        transport: new SmallWebRTCTransport(),
      });
      setClient(client);
    }, []);

    if (!client) {
      return <div>Loading...</div>;
    }

    return (
      <PipecatClientProvider client={client!}>
        <Component />
      </PipecatClientProvider>
    );
  },
];

Connected.storyName = "Connected";
