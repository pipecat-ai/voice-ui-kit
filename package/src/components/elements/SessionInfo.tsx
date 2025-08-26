import CopyText from "@/components/elements/CopyText";
import DataList from "@/components/elements/DataList";
import { TextDashBlankslate } from "@/index";
import Daily from "@daily-co/daily-js";
import { usePipecatClient } from "@pipecat-ai/client-react";

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
    data["RTVI"] = client?.version || <TextDashBlankslate />;
  }

  return (
    <DataList
      classNames={{ container: "w-full overflow-hidden" }}
      data={data}
    />
  );
};
