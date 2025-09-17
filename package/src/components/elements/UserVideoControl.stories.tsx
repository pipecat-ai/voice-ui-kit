import type {
  ButtonSize,
  ButtonState,
  ButtonVariant,
} from "@/components/ui/buttonVariants";
import {
  buttonSizeOptions,
  buttonVariantOptions,
} from "@/components/ui/buttonVariants";
import { Card, CardContent } from "@/components/ui/card";
import type { Story, StoryDefault } from "@ladle/react";
import { PipecatClient } from "@pipecat-ai/client-js";
import {
  type OptionalMediaDeviceInfo,
  PipecatClientProvider,
} from "@pipecat-ai/client-react";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { useEffect, useState } from "react";
import UserVideoControl, { UserVideoComponent } from "./UserVideoControl";

export default {
  title: "Components / User Video Control",
  argTypes: {
    variant: {
      options: buttonVariantOptions,
      control: { type: "select" },
      defaultValue: "outline",
    },
    size: {
      options: buttonSizeOptions,
      control: { type: "select" },
      defaultValue: "md",
    },
    noVideoText: {
      control: { type: "text" },
      defaultValue: null,
    },
  },
} satisfies StoryDefault;

/**
 * No video / video disabled
 */
export const NoVideo: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  noVideoText: string;
}> = ({ variant, size, noVideoText }) => {
  return (
    <Card className="w-full">
      <CardContent>
        <UserVideoComponent
          variant={variant}
          size={size}
          noVideo={true}
          {...(noVideoText && { noVideoText })}
        />
      </CardContent>
    </Card>
  );
};

NoVideo.args = {
  variant: "outline",
  size: "md",
};

NoVideo.storyName = "No Video";

/**
 * Component
 */
export const Default: Story<{
  size: ButtonSize;
  isCamEnabled: boolean;
  noDevicePicker: boolean;
  noVideo: boolean;
  isLoading: boolean;
}> = ({
  size,
  isCamEnabled = false,
  noDevicePicker = false,
  noVideo = false,
  isLoading = false,
}) => (
  <Card className="w-full">
    <CardContent className="flex flex-col gap-4">
      {["primary", "secondary", "outline", "ghost"].map((v) => (
        <UserVideoComponent
          key={v}
          variant={v as ButtonVariant}
          size={size}
          isCamEnabled={isCamEnabled}
          availableCams={[]}
          selectedCam={undefined as unknown as OptionalMediaDeviceInfo}
          updateCam={() => {}}
          noVideo={noVideo}
          noDevicePicker={noDevicePicker}
          buttonProps={{
            isLoading,
          }}
        />
      ))}
      {["primary", "secondary", "outline", "ghost"].map((v) => (
        <UserVideoComponent
          key={v}
          variant={v as ButtonVariant}
          size={size}
          state="active"
          isCamEnabled={isCamEnabled}
          availableCams={[]}
          selectedCam={undefined as unknown as OptionalMediaDeviceInfo}
          updateCam={() => {}}
          noVideo={noVideo}
          noDevicePicker={noDevicePicker}
          buttonProps={{
            isLoading,
          }}
        />
      ))}
      {["primary", "secondary", "outline", "ghost"].map((v) => (
        <UserVideoComponent
          key={v}
          variant={v as ButtonVariant}
          size={size}
          state="inactive"
          isCamEnabled={isCamEnabled}
          availableCams={[]}
          selectedCam={undefined as unknown as OptionalMediaDeviceInfo}
          updateCam={() => {}}
          noVideo={noVideo}
          noDevicePicker={noDevicePicker}
          buttonProps={{
            isLoading,
          }}
        />
      ))}
    </CardContent>
  </Card>
);

Default.args = {
  size: "md",
  isCamEnabled: false,
};

Default.argTypes = {
  ...Default.argTypes,
  isCamEnabled: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  noDevicePicker: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  noVideo: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  isLoading: {
    control: { type: "boolean" },
    defaultValue: false,
  },
};

Default.storyName = "Pure Component";

/**
 * Text-only variations (no icon, no video) with state-based text
 */
export const TextOnly: Story<{
  size: ButtonSize;
}> = ({ size }) => (
  <Card className="w-full">
    <CardContent className="flex flex-col gap-4">
      {["primary", "secondary", "outline", "ghost"].map((v) => (
        <div key={`row-${v}`} className="flex items-center gap-3">
          <UserVideoComponent
            variant={v as ButtonVariant}
            size={size}
            state="active"
            isCamEnabled
            noDevicePicker
            noVideo
            noIcon
            activeText="Camera On"
          />
          <UserVideoComponent
            variant={v as ButtonVariant}
            size={size}
            state="inactive"
            isCamEnabled={false}
            noDevicePicker
            noVideo
            noIcon
            inactiveText="Camera Off"
          />
        </div>
      ))}
    </CardContent>
  </Card>
);

TextOnly.args = {
  size: "md",
};

TextOnly.storyName = "Text Only";

/**
 * Connected
 */
export const Connected: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  state: ButtonState;
}> = ({ variant, size, state }) => (
  <UserVideoControl variant={variant} size={size} state={state} />
);

Connected.args = {
  variant: "outline",
  size: "md",
};

Connected.decorators = [
  (Component) => {
    const [client, setClient] = useState<PipecatClient | null>(null);

    useEffect(() => {
      const client = new PipecatClient({
        transport: new SmallWebRTCTransport(),
      });
      client.initDevices();
      setClient(client);
    }, []);

    if (!client) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        <PipecatClientProvider client={client!}>
          <Component />
        </PipecatClientProvider>
      </div>
    );
  },
];
Connected.storyName = "Connected";
