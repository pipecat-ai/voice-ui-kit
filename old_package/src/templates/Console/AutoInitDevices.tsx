import { RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClient,
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { useEffect } from "react";

export const AutoInitDevices = () => {
  const client = usePipecatClient();
  const transportState = usePipecatClientTransportState();

  useEffect(() => {
    if (!client) return;

    if (["idle", "disconnected"].includes(transportState)) {
      client.initDevices();
    }
  }, [client, transportState]);

  useRTVIClientEvent(RTVIEvent.Disconnected, () => {
    // Not sure why this timeout is needed but it's a workaround to prevent the devices from not being initialized after disconnecting
    setTimeout(() => client?.initDevices(), 500);
  });

  return null;
};
