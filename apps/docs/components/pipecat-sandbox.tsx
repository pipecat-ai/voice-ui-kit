"use client";

import { PipecatClient } from "@pipecat-ai/client-js";
import { PipecatClientProvider } from "@pipecat-ai/client-react";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type SandboxStatus = "idle" | "initializing" | "ready" | "error";

/**
 * Opt-in Pipecat client for docs previews. Nothing runs until the user
 * clicks — then a real PipecatClient (SmallWebRTC transport) initializes
 * local devices, so connected components work against actual hardware.
 * No bot connection is made.
 */
export function PipecatSandbox({
  children,
  enableCam = false,
}: {
  children: React.ReactNode;
  enableCam?: boolean;
}) {
  const [client, setClient] = useState<PipecatClient | null>(null);
  const [status, setStatus] = useState<SandboxStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!client) return;
    return () => {
      client.disconnect().catch(() => {
        // Never connected — nothing to tear down.
      });
    };
  }, [client]);

  const start = async () => {
    setStatus("initializing");
    try {
      const next = new PipecatClient({
        transport: new SmallWebRTCTransport(),
        enableMic: true,
        enableCam,
      });
      setClient(next);
      await next.initDevices();
      setStatus("ready");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!client) {
    return (
      <div className="flex max-w-sm flex-col items-center gap-4 text-center">
        <p className="text-muted-foreground text-sm">
          Runs a real <code className="font-mono">PipecatClient</code> against
          your devices — microphone{enableCam ? " and camera" : ""} access will
          be requested. No bot connection is made.
        </p>
        <Button onClick={() => void start()}>Initialize devices</Button>
      </div>
    );
  }

  return (
    <PipecatClientProvider client={client}>
      <div className="flex flex-col items-center gap-4">
        {children}
        <span className="text-muted-foreground font-mono text-xs">
          {status === "initializing" && "requesting device access…"}
          {status === "ready" && "devices ready — no bot connected"}
          {status === "error" && (error ?? "device initialization failed")}
        </span>
      </div>
    </PipecatClientProvider>
  );
}
