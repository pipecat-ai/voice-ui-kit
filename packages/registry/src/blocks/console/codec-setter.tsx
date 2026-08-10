"use client";

import { usePipecatClient } from "@pipecat-ai/client-react";
import { useEffect } from "react";

import { loadTransport } from "@/lib/transports";

export interface SmallWebRTCCodecSetterProps {
  /** Preferred audio codec, e.g. "opus". Default "default" (no override). */
  audioCodec?: string;
  /** Preferred video codec, e.g. "VP8". Default "default" (no override). */
  videoCodec?: string;
}

/**
 * Headless helper that applies audio/video codec preferences to a
 * SmallWebRTC transport. Renders nothing; safe to mount for other
 * transports (it verifies the transport class before touching it). Must be
 * rendered inside a PipecatClientProvider.
 */
export function SmallWebRTCCodecSetter({
  audioCodec = "default",
  videoCodec = "default",
}: SmallWebRTCCodecSetterProps) {
  const client = usePipecatClient();

  useEffect(() => {
    if (!client) return;
    let cancelled = false;

    (async () => {
      let SmallWebRTCTransport;
      try {
        SmallWebRTCTransport = await loadTransport("smallwebrtc");
      } catch {
        // Transport package not installed — nothing to configure.
        return;
      }
      if (cancelled || !(client.transport instanceof SmallWebRTCTransport)) {
        return;
      }
      // Structural cast: the transport package's types can't be named here
      // (transports are optional installs).
      const transport = client.transport as unknown as {
        setAudioCodec?: (codec: string) => void;
        setVideoCodec?: (codec: string) => void;
      };
      transport.setAudioCodec?.(audioCodec);
      transport.setVideoCodec?.(videoCodec);
    })();

    return () => {
      cancelled = true;
    };
  }, [audioCodec, client, videoCodec]);

  return null;
}
