import { usePipecatClient } from "@pipecat-ai/client-react";
import { useEffect } from "react";

export const AutoInitDevices = () => {
  const client = usePipecatClient();

  useEffect(() => {
    if (!client) return;

    if (["idle", "disconnected"].includes(client.state)) {
      client.initDevices();
    }
  }, [client]);

  return null;
};
