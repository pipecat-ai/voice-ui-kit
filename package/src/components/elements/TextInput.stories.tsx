import { Button } from "@/components/ui";
import type { Story } from "@ladle/react";
import { PipecatClient } from "@pipecat-ai/client-js";
import {
  PipecatClientAudio,
  PipecatClientProvider,
  usePipecatClient,
} from "@pipecat-ai/client-react";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { SendIcon } from "lucide-react";
import { type ComponentProps, useEffect, useState } from "react";
import { TextInput, TextInputComponent } from "./TextInput";

export default {
  title: "Components/Text Input",
  component: TextInputComponent,
};

const simulateSend = async (message: string) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("message", message);
};

export const Default: Story = () => (
  <TextInputComponent onSend={simulateSend} />
);
Default.storyName = "Component";

export const Multiline: Story = () => (
  <TextInputComponent size="xl" onSend={simulateSend} multiline />
);
Multiline.storyName = "Multiline";

export const WithButtonLabel: Story = () => (
  <TextInputComponent
    onSend={simulateSend}
    buttonProps={{
      loader: "stripes",
    }}
    buttonLabel={
      <>
        <SendIcon /> Send
      </>
    }
  />
);
WithButtonLabel.storyName = "With Button Label";

export const Pipecat: Story = () => {
  const client = usePipecatClient();
  return (
    <div className="flex flex-col gap-2">
      <TextInput role="assistant" />
      <Button onClick={() => client?.connect()}>Connect</Button>
    </div>
  );
};
Pipecat.decorators = [
  (Component) => {
    const [client, setClient] = useState<PipecatClient | null>(null);

    useEffect(() => {
      const client = new PipecatClient({
        transport: new SmallWebRTCTransport({
          webrtcUrl: "/api/offer",
        }),
      });
      setClient(client);
    }, []);

    if (!client) {
      return <div>Loading...</div>;
    }

    return (
      <div>
        {/* client-react@1.8.0 dts bug: cast as in PipecatAppBase. */}
        <PipecatClientProvider
          client={
            client! as unknown as ComponentProps<
              typeof PipecatClientProvider
            >["client"]
          }
        >
          <Component />
          <PipecatClientAudio />
        </PipecatClientProvider>
      </div>
    );
  },
];

Pipecat.storyName = "Pipecat";
