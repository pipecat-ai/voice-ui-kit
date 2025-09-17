"use client";

import { cn } from "@/lib/utils";
import { type BotTTSTextData, RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClientTransportState,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { cva } from "class-variance-authority";
import { useCallback, useState } from "react";

/**
 * Base props shared by all transcript overlay components
 */
interface BaseTranscriptOverlayProps {
  /** Additional CSS classes to apply to the component */
  className?: string;
  /** Size variant of the transcript overlay */
  size?: "sm" | "md" | "lg";
  /** Duration of the fade-in animation in milliseconds (default: 300) */
  fadeInDuration?: number;
  /** Duration of the fade-out animation in milliseconds (default: 1000) */
  fadeOutDuration?: number;
}

/**
 * Props for the connected TranscriptOverlay component that integrates with Pipecat
 */
interface TranscriptOverlayProps extends BaseTranscriptOverlayProps {
  /** The participant type - "local" for user speech, "remote" for bot speech */
  participant: "local" | "remote";
}

/**
 * Props for the headless TranscriptOverlayComponent (for manual control)
 */
interface TranscriptOverlayComponentProps extends BaseTranscriptOverlayProps {
  /** Array of words to display as individual animated spans */
  words: string[];
  /** Whether the current speech turn has ended (triggers fade-out animation) */
  turnEnd?: boolean;
}

const transcriptOverlayVariants = cva(
  `mx-auto items-center justify-end text-center 
  *:box-decoration-clone *:text-balance *:mx-auto *:inline
  *:bg-foreground *:text-background *:box-decoration-clone *:text-balance
  `,
  {
    variants: {
      size: {
        sm: "*:leading-4 *:px-2 *:py-1 *:text-xs *:font-medium *:rounded-md",
        md: "*:leading-6 *:px-3 *:py-1.5 *:text-sm *:font-medium *:rounded-lg",
        lg: "*:leading-7 *:px-4 *:py-2 *:text-base *:font-medium *:rounded-xl",
      },
    },
  },
);

/**
 * A simple component that renders transcript text as an animated span element.
 * Each word gets its own fade-in animation when rendered, creating a smooth
 * word-by-word appearance effect.
 *
 * @param text - The text content to display
 * @param fadeInDuration - Duration of the fade-in animation in milliseconds (default: 300)
 * @returns A span element with fade-in animation
 */
export const TranscriptOverlayPartComponent = ({
  text,
  fadeInDuration = 300,
}: {
  text: string;
  fadeInDuration?: number;
}) => (
  <span
    className="animate-in fade-in"
    style={{ animationDuration: `${fadeInDuration}ms` }}
  >
    {text}
  </span>
);

/**
 * The main transcript overlay component that handles the visual presentation of transcript text.
 * This component provides the styling and animation for displaying speech transcripts with
 * word-by-word fade-in animations and optional fade-out when the turn ends.
 *
 * The background wraps around each line of text, creating separate background blocks
 * for multi-line transcripts while maintaining smooth word-by-word animations.
 *
 * @param words - Array of words to display as individual animated spans
 * @param className - Additional CSS classes to apply
 * @param size - Size variant of the overlay ("sm", "md", or "lg")
 * @param turnEnd - Whether the current speech turn has ended (triggers fade-out animation)
 * @param fadeInDuration - Duration of the fade-in animation in milliseconds (default: 300)
 * @param fadeOutDuration - Duration of the fade-out animation in milliseconds (default: 1000)
 * @returns A div element containing the styled transcript overlay
 */
export const TranscriptOverlayComponent = ({
  words,
  className,
  size = "md",
  turnEnd,
  fadeInDuration = 300,
  fadeOutDuration = 1000,
}: TranscriptOverlayComponentProps) => {
  const containerStyle = {
    "--fade-in-duration": `${fadeInDuration}ms`,
    ...(turnEnd && { animationDuration: `${fadeOutDuration}ms` }),
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        transcriptOverlayVariants({ size }),
        turnEnd ? "animate-out fade-out fill-mode-forwards" : "",
        className,
      )}
      style={containerStyle}
    >
      <p>
        {words.map((word, index) => (
          <TranscriptOverlayPartComponent
            key={index}
            text={word + (index < words.length - 1 ? " " : "")}
            fadeInDuration={fadeInDuration}
          />
        ))}
      </p>
    </div>
  );
};

/**
 * A React component that displays real-time speech transcripts as an overlay.
 *
 * This component listens to Pipecat Client events to automatically display
 * speech transcripts from either the local user or remote bot. It provides
 * smooth word-by-word fade-in animations and handles the accumulation of
 * transcript text as speech progresses.
 *
 * The component integrates with the Pipecat Client SDK and must be used
 * within a PipecatClientProvider context to function properly.
 *
 * Features:
 * - Real-time transcript display with word-by-word animations
 * - Automatic transcript accumulation and cleanup
 * - Smooth fade-in/fade-out animations
 * - Support for both local and remote participants
 * - Responsive design with line-wrapped backgrounds
 *
 * @param participant - Whether to display "local" (user) or "remote" (bot) transcripts
 * @param className - Additional CSS classes to apply to the component
 * @param size - Size variant of the transcript overlay ("sm", "md", or "lg")
 * @param fadeInDuration - Duration of the fade-in animation in milliseconds (default: 300)
 * @param fadeOutDuration - Duration of the fade-out animation in milliseconds (default: 1000)
 * @returns The transcript overlay component or null if no transcript is available
 *
 * @example
 * ```tsx
 * // Display bot speech transcripts
 * <TranscriptOverlay participant="remote" />
 *
 * // Display user speech transcripts with custom styling and animation durations
 * <TranscriptOverlay
 *   participant="local"
 *   className="custom-overlay"
 *   size="lg"
 *   fadeInDuration={500}
 *   fadeOutDuration={1500}
 * />
 * ```
 */
export const TranscriptOverlay = ({
  participant = "remote",
  className,
  size = "md",
  fadeInDuration = 300,
  fadeOutDuration = 1000,
}: TranscriptOverlayProps) => {
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
      words={transcript}
      size={size}
      turnEnd={turnEnd}
      className={className}
      fadeInDuration={fadeInDuration}
      fadeOutDuration={fadeOutDuration}
    />
  );
};

export default TranscriptOverlay;
