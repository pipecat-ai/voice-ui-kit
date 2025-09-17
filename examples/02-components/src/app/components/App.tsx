import {
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
  ConnectButton,
  ControlBar,
  ErrorCard,
  PipecatLogo,
  TranscriptOverlay,
  UserAudioControl,
} from "@pipecat-ai/voice-ui-kit";
import { PlasmaVisualizer } from "@pipecat-ai/voice-ui-kit/webgl";
import { LoaderIcon, LogOutIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface AppProps {
  connectParams: TransportConnectionParams;
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
              "An error occured connecting to agent. It may be that the agent is at capacity. Please try again later."
            );
          },
        },
      });
      await pcClient.initDevices();
      setClient(pcClient);
    }

    initClient();
  }, [transportType]);

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
        `Failed to start session: ${
          err instanceof Error ? err.message : String(err)
        }`
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
      <ErrorCard error={error} title="An error occured connecting to agent." />
    );
  }

  return (
    <PipecatClientProvider client={client!}>
      <div className="w-full h-screen">
        <div className="flex flex-col h-full">
          <div className="relative bg-background overflow-hidden flex-1 shadow-long/[0.02]">
            <main className="flex flex-col gap-0 h-full relative justify-end items-center">
              <PlasmaVisualizer />
              {["idle", "connecting"].includes(state) && (
                <div className="absolute w-full h-full flex items-center justify-center">
                  <ConnectButton size="xl" onConnect={handleStartSession} />
                </div>
              )}
              {state === "connected" && (
                <div className="absolute w-full h-full flex items-center justify-center">
                  <TranscriptOverlay
                    participant="remote"
                    className="max-w-md"
                  />
                </div>
              )}
              {state === "connected" && (
                <ControlBar>
                  <UserAudioControl />
                  <Button
                    size="xl"
                    isIcon={true}
                    variant="outline"
                    onClick={() => client?.disconnect()}
                  >
                    <LogOutIcon />
                  </Button>
                </ControlBar>
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
