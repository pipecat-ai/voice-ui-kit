import { Card, CardContent } from "@/components/ui/card";
import type { ButtonSize, ButtonVariant } from "@/components/ui/buttonVariants";
import {
  buttonSizeOptions,
  buttonVariantOptions,
} from "@/components/ui/buttonVariants";
import type { Story, StoryDefault } from "@ladle/react";
import { type DTMFButton, PipecatClient } from "@pipecat-ai/client-js";
import { PipecatClientProvider } from "@pipecat-ai/client-react";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { useEffect, useState } from "react";
import { DTMFKeypad, DTMFKeypadComponent } from "./DTMFKeypad";

export default {
  title: "Components / DTMF Keypad",
  argTypes: {
    variant: {
      options: buttonVariantOptions,
      control: { type: "select" },
      defaultValue: "secondary",
    },
    size: {
      options: buttonSizeOptions,
      control: { type: "select" },
      defaultValue: "lg",
    },
    disabled: {
      control: { type: "boolean" },
      defaultValue: false,
    },
    noSubLabels: {
      control: { type: "boolean" },
      defaultValue: false,
    },
  },
} satisfies StoryDefault;

/**
 * Headless keypad. Presses are collected into a local buffer so you can see
 * the sequence that would be sent to the server.
 */
export const Default: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  noSubLabels: boolean;
}> = ({ variant, size, disabled, noSubLabels }) => {
  const [sequence, setSequence] = useState("");

  return (
    <Card className="w-full max-w-xs">
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 font-mono text-sm min-h-6">
          <span className="truncate">{sequence || " "}</span>
          {sequence && (
            <button
              type="button"
              className="text-xs opacity-60 hover:opacity-100"
              onClick={() => setSequence("")}
            >
              clear
            </button>
          )}
        </div>
        <DTMFKeypadComponent
          variant={variant}
          size={size}
          disabled={disabled}
          noSubLabels={noSubLabels}
          onPress={(button: DTMFButton) => setSequence((s) => s + button)}
        />
      </CardContent>
    </Card>
  );
};

Default.args = {
  variant: "secondary",
  size: "lg",
  disabled: false,
  noSubLabels: false,
};

Default.storyName = "Pure Component";

/**
 * Connected keypad. Requires a live Pipecat client; the keypad is disabled
 * until the transport is connected. Pressing a key calls `sendDTMF`.
 */
export const Connected: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  noSubLabels: boolean;
}> = ({ variant, size, noSubLabels }) => (
  <Card className="w-full max-w-xs">
    <CardContent>
      <DTMFKeypad variant={variant} size={size} noSubLabels={noSubLabels} />
    </CardContent>
  </Card>
);

Connected.args = {
  variant: "secondary",
  size: "lg",
};

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
      <PipecatClientProvider client={client}>
        <Component />
      </PipecatClientProvider>
    );
  },
];

Connected.storyName = "Connected";
