import {
  ConnectionEndpoint,
  PipecatClient,
  TransportConnectionParams,
  TransportState,
} from "@pipecat-ai/client-js";
import {
  PipecatClientAudio,
  PipecatClientProvider,
} from "@pipecat-ai/client-react";
import { DailyTransport } from "@pipecat-ai/daily-transport";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import {
  Button,
  Card,
  CardContent,
  LoaderIcon,
  PipecatLogo,
  XIcon,
} from "@pipecat-ai/voice-ui-kit";
import { useEffect, useRef, useState } from "react";
import { AgentVisualization } from "./AgentAudioViz";
import { Controls } from "./Controls";

export interface AppProps {
  connectParams: TransportConnectionParams | ConnectionEndpoint;
  transportType: "daily" | "smallwebrtc";
}

export type AppState = "idle" | "connecting" | "connected" | "disconnected";

export const App = ({ connectParams, transportType }: AppProps) => {
  const [client, setClient] = useState<PipecatClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<AppState>("idle");
  const isMounted = useRef(false);

  useEffect(() => {
    if (isMounted.current) return;

    isMounted.current = true;
    async function initClient() {
      // Only run on client side
      if (typeof window === "undefined") return;

      let transport: DailyTransport | SmallWebRTCTransport;
      switch (transportType) {
        case "smallwebrtc":
          transport = new SmallWebRTCTransport();
          break;
        case "daily":
        default:
          transport = new DailyTransport();
          break;
      }

      const pcClient = new PipecatClient({
        enableCam: false,
        enableMic: true,
        transport: transport,
        callbacks: {
          onTransportStateChanged: (state: TransportState) => {
            console.log(state);
            switch (state) {
              case "connecting":
              case "authenticating":
              case "connected":
                setState("connecting");
                break;
              case "ready":
                setState("connected");
                break;
              case "disconnected":
              case "disconnecting":
              default:
                setState("idle");
                break;
            }
          },
          onError: () => {
            setError(
              "An error occured connecting to agent. It may be that the agent is at capacity. Please try again later.",
            );
          },
        },
      });
      await pcClient.initDevices();
      setClient(pcClient);
    }

    initClient();
  }, [connectParams, transportType]);

  const handleStartSession = async () => {
    if (
      !client ||
      !["initialized", "disconnected", "error"].includes(client.state)
    ) {
      return;
    }
    setError(null);

    try {
      await client.connect(connectParams);
    } catch (err) {
      console.error("Connection error:", err);
      setError(
        `Failed to start session: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  if (!client) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoaderIcon className="animate-spin opacity-50" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="shadow-long">
          <CardContent>
            <div className="bg-destructive text-background font-semibold text-center p-3 rounded-lg flex flex-col gap-2">
              An error occured connecting to agent.
              <p className="text-sm font-medium text-balanced text-background/80">
                It may be that the agent is at capacity. Please try again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PipecatClientProvider client={client!}>
      <div className="w-full h-screen">
        <div className="flex flex-col h-full">
          <div className="relative bg-background overflow-hidden flex-1 shadow-long/[0.02]">
            <main className="flex flex-col gap-0 h-full relative justify-end items-center">
              <AgentVisualization state={state} />
              {["idle", "connecting"].includes(state) && (
                <div className="absolute w-full h-full flex items-center justify-center">
                  <Button
                    size="xl"
                    variant={state !== "idle" ? "secondary" : "default"}
                    onClick={handleStartSession}
                    disabled={state !== "idle"}
                    isLoading={state !== "idle"}
                  >
                    {state !== "idle" ? "Connecting..." : "Start session"}
                  </Button>
                </div>
              )}
              {state === "connected" && (
                <Controls onEndSession={() => client?.disconnect()} />
              )}
            </main>
          </div>
          <footer className="p-5 md:p-7 text-center flex flex-row gap-4 items-center justify-center">
            <PipecatLogo className="h-[24px] w-auto text-black" />
            <div className="flex flex-row gap-2 items-center justify-center opacity-60">
              <p className="text-sm text-muted-foreground font-medium">
                Pipecat AI
              </p>
              <XIcon size={16} className="text-black/30" />
              <p className="text-sm text-muted-foreground font-medium">
                Voice UI Kit
              </p>
            </div>
          </footer>
        </div>
      </div>
      <PipecatClientAudio />
    </PipecatClientProvider>
  );
};

export default App;
