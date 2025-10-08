"use client";
import { useSandboxStore } from "@/lib/sandbox";

import {
  usePipecatClient,
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import {
  Button,
  Card,
  CardContent,
  ErrorCard,
  Input,
  PipecatAppBase,
  SpinLoader,
  UserAudioControl,
} from "@pipecat-ai/voice-ui-kit";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { RTVIEvent } from "@pipecat-ai/client-js";
import "@pipecat-ai/voice-ui-kit/styles.scoped";

const App = ({
  onConnect,
  onDisconnect,
}: {
  onConnect: () => void;
  onDisconnect: () => void;
}) => {
  const [message, setMessage] = useState("");
  const transportState = usePipecatClientTransportState();
  const client = usePipecatClient();
  const router = useRouter();
  const { setCode } = useSandboxStore();

  useRTVIClientEvent(RTVIEvent.ServerMessage, (message) => {
    console.log("message", message);
    if (message.page) {
      router.push(message.page);
    } else {
      setCode(message.code);
      router.push("/sandbox");
    }
  });

  const handleSend = () => {
    if (!client) return;
    client.sendClientMessage("custom-message", { text: message });
  };

  return (
    <>
      <UserAudioControl />
      <Button
        isLoading={
          !["ready", "disconnected", "initialized"].includes(transportState)
        }
        disabled={
          !["ready", "disconnected", "initialized"].includes(transportState)
        }
        variant={transportState === "ready" ? "secondary" : "active"}
        onClick={() => {
          if (transportState === "ready") {
            onDisconnect();
          } else {
            onConnect();
          }
        }}
      >
        {transportState === "ready" ? "Disconnect" : "Connect"}
      </Button>
      {transportState === "ready" && (
        <>
          <Input
            placeholder="Enter your message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button onClick={handleSend}>Send</Button>
        </>
      )}
    </>
  );
};

export default function Bot() {
  return (
    <div className="vkui-root fixed bottom-4 right-4 z-50">
      <Card rounded="xl" shadow="xlong" withGradientBorder>
        <CardContent>
          <PipecatAppBase
            transportType="smallwebrtc"
            connectParams={{
              webrtcUrl: "/api/offer",
            }}
          >
            {({ client, handleConnect, handleDisconnect, error }) =>
              !client ? (
                <SpinLoader />
              ) : error ? (
                <ErrorCard error={error} />
              ) : (
                <App
                  onConnect={() => handleConnect?.()}
                  onDisconnect={() => handleDisconnect?.()}
                />
              )
            }
          </PipecatAppBase>
        </CardContent>
      </Card>
    </div>
  );
}
