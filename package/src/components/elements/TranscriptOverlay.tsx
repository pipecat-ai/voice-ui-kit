"use client";

import { cn } from "@/lib/utils";
import { type BotTTSTextData, RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { cva } from "class-variance-authority";
import { useCallback, useState } from "react";

interface Props {
  participant: "local" | "remote";
  className?: string;
  size?: "default";
}

const transcriptOverlayVariants = cva(
  `mx-auto items-center justify-end text-center 
  *:box-decoration-clone *:text-balance *:animate-in *:fade-in *:duration-300 *:mx-auto
  *:**:bg-foreground *:**:text-background *:**:box-decoration-clone *:**:text-balance
  `,
  {
    variants: {
      size: {
        default:
          "*:leading-6 *:**:px-3 *:**:py-1.5 *:**:text-sm *:**:font-medium *:**:rounded-lg",
        sm: "*:leading-4 *:**:px-2 *:**:py-1 *:**:text-xs *:**:font-medium *:**:rounded-md",
        lg: "*:leading-7 *:**:px-4 *:**:py-2 *:**:text-base *:**:font-medium *:**:rounded-xl",
      },
    },
  },
);

export const TranscriptOverlayPartComponent = ({ text }: { text: string }) => (
  <span>{text}</span>
);

export const TranscriptOverlayComponent = ({
  children,
  className,
  size = "default",
  turnEnd,
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "sm" | "lg";
  turnEnd?: boolean;
}) => {
  return (
    <div
      className={cn(
        transcriptOverlayVariants({ size }),
        turnEnd ? "animate-out fade-out duration-1000 fill-mode-forwards" : "",
        className,
      )}
    >
      <p>{children}</p>
    </div>
  );
};

export const TranscriptOverlay = ({
  participant = "remote",
  className,
  size = "default",
}: Props) => {
  const [transcript, setTranscript] = useState<string[]>([]);
  const [turnEnd, setIsTurnEnd] = useState(false);
  const transportState = usePipecatClientTransportState();

  useRTVIClientEvent(
    RTVIEvent.BotTtsText,
    useCallback(
      (event: BotTTSTextData) => {
        if (participant === "local") {
          return;
        }

        if (turnEnd) {
          setTranscript([]);
          setIsTurnEnd(false);
        }

        setTranscript((prev) => [...prev, event.text]);
      },
      [turnEnd, participant],
    ),
  );

  useRTVIClientEvent(
    RTVIEvent.BotStoppedSpeaking,
    useCallback(() => {
      if (participant === "local") {
        return;
      }
      setIsTurnEnd(true);
    }, [participant]),
  );

  useRTVIClientEvent(
    RTVIEvent.BotTtsStopped,
    useCallback(() => {
      if (participant === "local") {
        return;
      }
      setIsTurnEnd(true);
    }, [participant]),
  );

  if (transcript.length === 0 || transportState !== "ready") {
    return null;
  }

  return (
    <TranscriptOverlayComponent
      size={size}
      turnEnd={turnEnd}
      className={className}
    >
      <TranscriptOverlayPartComponent text={transcript.join(" ")} />
    </TranscriptOverlayComponent>
  );
};

export default TranscriptOverlay;
