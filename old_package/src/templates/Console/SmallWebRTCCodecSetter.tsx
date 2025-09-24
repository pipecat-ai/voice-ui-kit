import { usePipecatClient } from "@pipecat-ai/client-react";
import { PipecatBaseProps } from "../../components/PipecatAppBase";
import { useEffect } from "react";

interface Props {
  audioCodec?: string;
  transportType: PipecatBaseProps["transportType"];
  videoCodec?: string;
}

interface SmallWebRTCTransportWithCodecs {
  setAudioCodec: (codec: string | null) => void;
  setVideoCodec: (codec: string | null) => void;
}

export const SmallWebRTCCodecSetter = ({
  audioCodec = "default",
  transportType,
  videoCodec = "default",
}: Props) => {
  const client = usePipecatClient();

  useEffect(
    function updateSmallWebRTCCodecs() {
      if (!client || transportType !== "smallwebrtc") return;
      const transport =
        client.transport as unknown as SmallWebRTCTransportWithCodecs;
      if (audioCodec) {
        transport.setAudioCodec(audioCodec);
      }
      if (videoCodec) {
        transport.setVideoCodec(videoCodec);
      }
    },
    [audioCodec, client, videoCodec, transportType],
  );

  return null;
};
