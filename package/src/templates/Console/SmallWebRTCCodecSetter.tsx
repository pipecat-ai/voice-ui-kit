import { usePipecatClient } from "@pipecat-ai/client-react";
import { useEffect } from "react";
import { PipecatBaseProps } from "@/components/PipecatAppBase";
import { loadTransport } from "@/lib/transports";

interface Props {
  audioCodec?: string;
  transportType: PipecatBaseProps["transportType"];
  videoCodec?: string;
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

      loadTransport("smallwebrtc").then(({ SmallWebRTCTransport }) => {
        if (!SmallWebRTCTransport) return;
        const transport = client.transport as unknown;
        if (!(transport instanceof SmallWebRTCTransport)) return;
        if (audioCodec) {
          transport.setAudioCodec(audioCodec);
        }
        if (videoCodec) {
          transport.setVideoCodec(videoCodec);
        }
      });
    },
    [audioCodec, client, videoCodec, transportType],
  );

  return null;
};
