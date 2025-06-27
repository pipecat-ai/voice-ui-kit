import {
  useRTVIClientEvent,
  useRTVIClientTransportState,
} from "@pipecat-ai/client-react";
import DataList from "@/components/elements/DataList";
import { cn } from "@/lib/utils";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { useState } from "react";

export const ClientStatus: React.FC = () => {
  const transportState = useRTVIClientTransportState();

  const agentConnecting =
    transportState === "connecting" ||
    transportState === "connected" ||
    transportState === "ready";

  const [isBotConnected, setIsBotConnected] = useState(false);

  useRTVIClientEvent(RTVIEvent.BotReady, () => {
    setIsBotConnected(true);
  });
  useRTVIClientEvent(RTVIEvent.Disconnected, () => {
    setIsBotConnected(false);
  });
  useRTVIClientEvent(RTVIEvent.BotDisconnected, () => {
    setIsBotConnected(false);
  });

  return (
    <DataList
      data={{
        Client: (
          <span
            className={cn("vkui:uppercase", {
              "vkui:text-emerald-500":
                transportState === "connected" || transportState === "ready",
            })}
          >
            {transportState}
          </span>
        ),
        Agent: isBotConnected ? (
          <span className="vkui:text-emerald-500 vkui:uppercase">
            Connected
          </span>
        ) : agentConnecting ? (
          <span className="vkui:uppercase">Connecting...</span>
        ) : (
          "---"
        ),
      }}
    />
  );
};
