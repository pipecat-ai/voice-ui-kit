import {
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import DataList from "@/components/elements/DataList";
import { cn } from "@/lib/utils";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { useState } from "react";

interface Props {
  classNames?: React.ComponentProps<typeof DataList>["classNames"] & {
    agentValue?: string;
    clientValue?: string;
  };
  noAgentState?: boolean;
  noClientState?: boolean;
}

export const ClientStatus: React.FC<Props> = ({
  classNames = {},
  noAgentState = false,
  noClientState = false,
}) => {
  const transportState = usePipecatClientTransportState();

  const agentConnecting =
    transportState === "connecting" ||
    transportState === "connected" ||
    transportState === "ready";

  const [isBotConnected, setIsBotConnected] = useState(false);

  useRTVIClientEvent(RTVIEvent.BotReady, () => {
    if (noAgentState) return;
    setIsBotConnected(true);
  });
  useRTVIClientEvent(RTVIEvent.Disconnected, () => {
    if (noAgentState) return;
    setIsBotConnected(false);
  });
  useRTVIClientEvent(RTVIEvent.BotDisconnected, () => {
    if (noAgentState) return;
    setIsBotConnected(false);
  });

  if (noAgentState && noClientState) return null;

  const data: React.ComponentProps<typeof DataList>["data"] = {};
  if (!noClientState) {
    data["Client"] = (
      <span
        className={cn(
          "vkui:uppercase",
          {
            "vkui:text-emerald-500":
              transportState === "connected" || transportState === "ready",
          },
          classNames.clientValue,
        )}
      >
        {transportState}
      </span>
    );
  }

  if (!noAgentState) {
    data["Agent"] = isBotConnected ? (
      <span
        className={cn(
          "vkui:text-emerald-500 vkui:uppercase",
          classNames.agentValue,
        )}
      >
        Connected
      </span>
    ) : agentConnecting ? (
      <span className={cn("vkui:uppercase", classNames.agentValue)}>
        Connecting...
      </span>
    ) : (
      "---"
    );
  }

  return <DataList classNames={classNames} data={data} />;
};

export default ClientStatus;
