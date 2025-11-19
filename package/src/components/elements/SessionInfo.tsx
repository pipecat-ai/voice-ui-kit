import CopyText from "@/components/elements/CopyText";
import DataList from "@/components/elements/DataList";
import { TextDashBlankslate } from "@/index";
import { usePipecatClient } from "@pipecat-ai/client-react";
import { useEffect, useState } from "react";

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
  const [dailyVersion, setDailyVersion] = useState<string | null>(null);
  const transport = client?.transport;
  const isDailyTransport = !!transport && "dailyCallClient" in transport;

  useEffect(() => {
    let isMounted = true;

    const loadDailyVersion = async () => {
      try {
        const { default: Daily } = await import("@daily-co/daily-js");
        if (!isMounted) {
          return;
        }
        setDailyVersion(Daily.version());
      } catch {
        if (isMounted) {
          setDailyVersion(null);
        }
      }
    };

    if (isDailyTransport) {
      loadDailyVersion();
    } else {
      setDailyVersion(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isDailyTransport]);

  let transportTypeName = "Unknown";
  if (isDailyTransport) {
    transportTypeName = dailyVersion ? `Daily (v${dailyVersion})` : "Daily";
  } else if (
    // @ts-expect-error - __proto__ not typed
    transport?.__proto__.constructor.SERVICE_NAME === "small-webrtc-transport"
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
