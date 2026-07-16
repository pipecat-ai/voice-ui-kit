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
import { type ComponentProps, useEffect, useState } from "react";
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
    noToneFeedback: {
      control: { type: "boolean" },
      defaultValue: false,
    },
  },
} satisfies StoryDefault;

/**
 * Headless keypad in immediate mode. Presses are collected into a local buffer
 * so you can see the sequence that would be sent to the server.
 */
export const Default: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  disabled: boolean;
  noSubLabels: boolean;
  noToneFeedback: boolean;
}> = ({ variant, size, disabled, noSubLabels, noToneFeedback }) => {
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
          mode="immediate"
          variant={variant}
          size={size}
          disabled={disabled}
          noSubLabels={noSubLabels}
          noToneFeedback={noToneFeedback}
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
  noToneFeedback: false,
};

Default.storyName = "Pure Component";

/**
 * Buffered mode. Presses accumulate in an editable field; pressing Send (or
 * Enter) submits the whole sequence at once. Here we just log each submission.
 */
export const Buffered: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  noSubLabels: boolean;
  noToneFeedback: boolean;
}> = ({ variant, size, noSubLabels, noToneFeedback }) => {
  const [sent, setSent] = useState<string[]>([]);

  return (
    <Card className="w-full max-w-xs">
      <CardContent className="flex flex-col gap-4">
        <DTMFKeypadComponent
          mode="buffered"
          variant={variant}
          size={size}
          noSubLabels={noSubLabels}
          noToneFeedback={noToneFeedback}
          onSend={(sequence) => setSent((s) => [...s, sequence])}
        />
        {sent.length > 0 && (
          <div className="font-mono text-xs opacity-70">
            sent: {sent.join(", ")}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

Buffered.args = {
  variant: "secondary",
  size: "lg",
  noSubLabels: false,
  noToneFeedback: false,
};

Buffered.storyName = "Buffered (Pure)";

/**
 * Connected keypad. Requires a live Pipecat client; the keypad is disabled
 * until the transport is connected. In buffered mode (default) the sequence is
 * sent on submit; in immediate mode each press sends its tone via `sendTone`.
 */
export const Connected: Story<{
  mode: "immediate" | "buffered";
  variant: ButtonVariant;
  size: ButtonSize;
  noSubLabels: boolean;
  noToneFeedback: boolean;
}> = ({ mode, variant, size, noSubLabels, noToneFeedback }) => (
  <Card className="w-full max-w-xs">
    <CardContent>
      <DTMFKeypad
        mode={mode}
        variant={variant}
        size={size}
        noSubLabels={noSubLabels}
        noToneFeedback={noToneFeedback}
      />
    </CardContent>
  </Card>
);

Connected.args = {
  mode: "buffered",
  variant: "secondary",
  size: "lg",
  noToneFeedback: false,
};

Connected.argTypes = {
  mode: {
    options: ["immediate", "buffered"],
    control: { type: "radio" },
    defaultValue: "buffered",
  },
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

    // client-react@1.8.0 ships a duplicated, non-assignable PipecatClient type
    // instead of re-exporting client-js's; cast as in PipecatAppBase. Remove
    // once client-react re-exports the type.
    return (
      <PipecatClientProvider
        client={
          client as unknown as ComponentProps<
            typeof PipecatClientProvider
          >["client"]
        }
      >
        <Component />
      </PipecatClientProvider>
    );
  },
];

Connected.storyName = "Connected";
