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
import UserAudioControl, { UserAudioComponent } from "./UserAudioControl";

export default {
  title: "Components / User Audio Control",
  argTypes: {
    variant: {
      options: buttonVariantOptions,
      control: { type: "select" },
      defaultValue: "secondary",
    },
    size: {
      options: buttonSizeOptions,
      control: { type: "select" },
      defaultValue: "md",
    },
    noAudioText: {
      control: { type: "text" },
      defaultValue: null,
    },
  },
} satisfies StoryDefault;

/**
 * No audio / audio disabled
 */
export const NoAudio: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  noAudioText: string;
}> = ({ variant, size, noAudioText }) => {
  return (
    <Card className="w-full">
      <CardContent>
        <UserAudioComponent
          variant={variant}
          size={size}
          noAudio={true}
          {...(noAudioText && { noAudioText })}
        />
      </CardContent>
    </Card>
  );
};

NoAudio.args = {
  variant: "secondary",
  size: "md",
};

NoAudio.storyName = "No Audio";

/**
 * Component
 */
export const Default: Story<{
  size: ButtonSize;
  isMuted: boolean;
  noDevicePicker: boolean;
  noVisualizer: boolean;
  isLoading: boolean;
}> = ({
  size,
  isMuted = false,
  noDevicePicker = false,
  noVisualizer = false,
  isLoading = false,
}) => (
  <Card className="w-full">
    <CardContent className="flex flex-col gap-4">
      {["primary", "secondary", "outline", "ghost"].map((v) => (
        <UserAudioComponent
          key={v}
          variant={v as ButtonVariant}
          size={size}
          isMicEnabled={!isMuted}
          availableMics={[]}
          selectedMic={undefined as unknown as OptionalMediaDeviceInfo}
          updateMic={() => {}}
          noVisualizer={noVisualizer}
          noDevicePicker={noDevicePicker}
          buttonProps={{
            isLoading,
          }}
        />
      ))}
      {["primary", "secondary", "outline", "ghost"].map((v) => (
        <UserAudioComponent
          key={v}
          variant={v as ButtonVariant}
          size={size}
          state="active"
          isMicEnabled={!isMuted}
          availableMics={[]}
          selectedMic={undefined as unknown as OptionalMediaDeviceInfo}
          updateMic={() => {}}
          noVisualizer={noVisualizer}
          noDevicePicker={noDevicePicker}
          buttonProps={{
            isLoading,
          }}
        />
      ))}
      {["primary", "secondary", "outline", "ghost"].map((v) => (
        <UserAudioComponent
          key={v}
          variant={v as ButtonVariant}
          size={size}
          state="inactive"
          isMicEnabled={!isMuted}
          availableMics={[]}
          selectedMic={undefined as unknown as OptionalMediaDeviceInfo}
          updateMic={() => {}}
          noVisualizer={noVisualizer}
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
  isMuted: false,
};

Default.argTypes = {
  ...Default.argTypes,
  isMuted: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  noDevicePicker: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  noVisualizer: {
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
 * Text-only variations (no icon, no visualizer) with state-based text
 */
export const TextOnly: Story<{
  size: ButtonSize;
}> = ({ size }) => (
  <Card className="w-full">
    <CardContent className="flex flex-col gap-4">
      {["primary", "secondary", "outline", "ghost"].map((v) => (
        <div key={`row-${v}`} className="flex items-center gap-3">
          <UserAudioComponent
            variant={v as ButtonVariant}
            size={size}
            state="active"
            isMicEnabled
            noDevicePicker
            noVisualizer
            noIcon
            activeText="Listening"
          />
          <UserAudioComponent
            variant={v as ButtonVariant}
            size={size}
            state="inactive"
            isMicEnabled={false}
            noDevicePicker
            noVisualizer
            noIcon
            inactiveText="Muted"
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
  <UserAudioControl variant={variant} size={size} state={state} />
);

Connected.args = {
  variant: "secondary",
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
