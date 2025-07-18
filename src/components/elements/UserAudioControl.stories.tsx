import type { ButtonSize, ButtonVariant } from "@/components/ui/buttonVariants";
import {
  buttonSizeOptions,
  buttonVariantOptions,
} from "@/components/ui/buttonVariants";
import type { Story, StoryDefault } from "@ladle/react";
import { PipecatClient } from "@pipecat-ai/client-js";
import { PipecatClientProvider } from "@pipecat-ai/client-react";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { useEffect, useState } from "react";
import UserAudioControl from "./UserAudioControl";

export default {
  title: "Components",
  argTypes: {
    variant: {
      options: buttonVariantOptions,
      control: { type: "select" },
      defaultValue: "secondary",
    },
    size: {
      options: buttonSizeOptions,
      control: { type: "select" },
      defaultValue: "default",
    },
    noAudioText: {
      control: { type: "text" },
      defaultValue: null,
    },
  },
} satisfies StoryDefault;

export const UserAudioControlDefault: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  noAudioText: string;
}> = ({ variant, size, noAudioText }) => {
  return (
    <UserAudioControl
      variant={variant}
      size={size}
      {...(noAudioText && { noAudioText })}
    />
  );
};

UserAudioControlDefault.args = {
  variant: "secondary",
  size: "default",
};

UserAudioControlDefault.storyName = "User Audio Control";

export const UserAudioControlConnected: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
}> = ({ variant, size }) => <UserAudioControl variant={variant} size={size} />;

UserAudioControlConnected.decorators = [
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
      <div>
        <PipecatClientProvider client={client!}>
          <Component />
        </PipecatClientProvider>
      </div>
    );
  },
];
UserAudioControlConnected.storyName = "User Audio Control Connected";
