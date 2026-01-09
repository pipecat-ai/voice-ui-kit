import CopyText from "@/components/elements/CopyText";
import DataList from "@/components/elements/DataList";
import { TextDashBlankslate } from "@/index";
import Daily from "@daily-co/daily-js";
import { BotReadyData, RTVIEvent } from "@pipecat-ai/client-js";
import { usePipecatClient, useRTVIClientEvent } from "@pipecat-ai/client-react";
import { useState } from "react";

interface Props {
  noTransportType?: boolean;
  noSessionId?: boolean;
  noParticipantId?: boolean;
  noRTVIVersion?: boolean;
  participantId?: string;
  sessionId?: string;
}

export const SessionInfo: React.FC<Props> = ({
  noTransportType = false,
  noSessionId = false,
  noParticipantId = false,
  noRTVIVersion = false,
  sessionId,
  participantId,
}) => {
  const client = usePipecatClient();
  const [serverVersion, setServerVersion] = useState<string | null>(null);

  // Reset server version on disconnect
  useRTVIClientEvent(RTVIEvent.Disconnected, () => {
    setServerVersion(null);
  });

  // Track server RTVI version from BotReady event
  useRTVIClientEvent(RTVIEvent.BotReady, (botData: BotReadyData) => {
    setServerVersion(botData.version);
  });

  let transportTypeName = "Unknown";
  if (client && "dailyCallClient" in client.transport) {
    transportTypeName = `Daily (v${Daily.version()})`;
  } else if (
    // @ts-expect-error - __proto__ not typed
    client?.transport.__proto__.constructor.SERVICE_NAME ===
    "small-webrtc-transport"
  ) {
    transportTypeName = "Small WebRTC";
  }

  const data: React.ComponentProps<typeof DataList>["data"] = {};
  if (!noTransportType) {
    data["Transport"] = transportTypeName;
  }
  if (!noSessionId) {
    data["Session ID"] = sessionId ? (
      <CopyText className="justify-end" iconSize={12} text={sessionId} />
    ) : (
      <TextDashBlankslate />
    );
  }
  if (!noParticipantId) {
    data["Participant ID"] = participantId ? (
      <CopyText className="justify-end" iconSize={12} text={participantId} />
    ) : (
      <TextDashBlankslate />
    );
  }
  if (!noRTVIVersion) {
    const clientVersion = client?.version;
    data["RTVI Client"] = clientVersion ? (
      `v${clientVersion}`
    ) : (
      <TextDashBlankslate />
    );
    data["RTVI Server"] = serverVersion ? (
      `v${serverVersion}`
    ) : (
      <TextDashBlankslate />
    );
  }

  return (
    <DataList
      classNames={{ container: "w-full overflow-hidden" }}
      data={data}
    />
  );
};
