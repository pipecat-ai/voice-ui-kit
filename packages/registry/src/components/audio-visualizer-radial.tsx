"use client";

import { usePipecatClientMediaTrack } from "@pipecat-ai/client-react";
import { memo, useEffect, useRef } from "react";

import {
  createVisualizerAnalyser,
  createVoiceBands,
  readBand,
  resolveVisualizerColor,
  type VisualizerState,
} from "@/lib/visualizer";

export type { VisualizerState };

type ParticipantType = Parameters<typeof usePipecatClientMediaTrack>[1];

// Thinking's breath swells the ring by this fraction of its radius.
const BREATH = 0.1;

export interface AudioVisualizerRadialViewProps {
  /** Audio track to visualize. Renders the dim resting ring when null. */
  track?: MediaStreamTrack | null;
  /** Canvas background. Any CSS color, or "transparent". */
  backgroundColor?: string;
  /** Dot color. Supports "currentColor" (default) and "--css-var" names. */
  barColor?: string;
  /**
   * Color of the lit dots in the connecting and thinking animations; same
   * formats as barColor, which it defaults to.
   */
  accentColor?: string;
  /** Number of dots around the ring. */
  barCount?: number;
  /**
   * Dot diameter / bar thickness in px. Defaults to filling half the
   * ring's circumference (radius × π / barCount), so dots and gaps stay
   * balanced at any barCount or radius.
   */
  barWidth?: number;
  /** Max length a dot grows outward from the ring while speaking, in px. */
  barMaxLength?: number;
  /** Radius of the resting ring, in px. */
  radius?: number;
  /** Dot / bar end style. */
  barLineCap?: "round" | "square";
  /**
   * How quickly bars chase the live spectrum while speaking: the fraction
   * of the remaining distance covered per frame (0–1, default 0.5). Lower
   * is smoother, 1 disables smoothing. State transitions keep their own
   * fixed ease.
   */
  barSpeed?: number;
  /** Opacity of unlit dots (default 0.1). Lit dots render at 1. */
  restingOpacity?: number;
  /**
   * Speed multiplier for both animated overrides (default 1): the
   * connecting pair and the thinking comet orbit at the same rate, one
   * lap every two seconds.
   */
  rotationSpeed?: number;
  /**
   * Override: a session is being established — two opposed lit dots glide
   * around the ring. Wins over isThinking; the track is ignored while
   * set. Without overrides the visualizer derives silent/speaking from
   * the track on its own.
   */
  isConnecting?: boolean;
  /**
   * Override: the bot is working on a response — a comet (bright head,
   * fading tail) orbits the ring while the ring slowly breathes. The
   * track is ignored while set.
   */
  isThinking?: boolean;
  /**
   * Breaths per second for the thinking swell (default 0.2 — a
   * five-second cycle, ±10% of radius). 0 disables breathing.
   */
  breathingSpeed?: number;
  className?: string;
}

/**
 * Canvas-2D radial audio visualizer for any MediaStreamTrack: a ring of
 * dots that light up and grow outward with the live spectrum. Bands are
 * mel-scaled over the voice range (see visualizer.ts) and mirrored across
 * the ring's vertical axis, so the spectrum has no seam where it wraps.
 * Bars chase the audio at a configurable barSpeed.
 *
 * Silent rests as a dim ring; speaking lights every dot; connecting
 * glides two opposed lit dots around the ring; thinking orbits a comet
 * while the ring breathes. Lit dots take accentColor, applied as an
 * overlay that fades with the same ease as opacity, so trails keep the
 * accent hue. Silent and speaking derive from the track; the
 * isConnecting / isThinking overrides opt into the kit's other shared
 * lifecycle states; every state change eases briefly instead of
 * snapping. The resolved VisualizerState is exposed as data-state, and
 * the canvas sizes itself so grown bars, caps, and the breath always
 * render inside it.
 */
export const AudioVisualizerRadialView = memo(
  function AudioVisualizerRadialView({
    track = null,
    backgroundColor = "transparent",
    barColor = "currentColor",
    accentColor,
    barCount = 24,
    barWidth,
    barMaxLength = 24,
    radius = 32,
    barLineCap = "round",
    barSpeed = 0.5,
    restingOpacity = 0.1,
    rotationSpeed = 1,
    isConnecting = false,
    isThinking = false,
    breathingSpeed = 0.2,
    className,
  }: AudioVisualizerRadialViewProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const resolvedBarColorRef = useRef<string>("black");
    const resolvedAccentColorRef = useRef<string>("black");
    const analyserRef = useRef<AnalyserNode | null>(null);
    const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
    // Displayed length/alpha/accent-weight per dot, persisted across
    // renders so state changes ease from wherever the ring currently is.
    const displayRef = useRef<{ h: number; a: number; c: number }[]>([]);
    // Eased 0–1 breath weight, persisted the same way so the radius swell
    // ramps in and out instead of snapping.
    const breathRef = useRef(0);

    // Resolve CSS-flavored colors to concrete values the canvas can use.
    // className is a dependency because it can change what currentColor
    // resolves to.
    useEffect(() => {
      resolvedBarColorRef.current = resolveVisualizerColor(
        barColor,
        canvasRef.current,
      );
      resolvedAccentColorRef.current = resolveVisualizerColor(
        accentColor ?? barColor,
        canvasRef.current,
      );
    }, [barColor, accentColor, className]);

    // Audio pipeline — only recreated when the track changes. The
    // overrides are synthetic, so they skip the pipeline entirely.
    useEffect(() => {
      if (!track || isConnecting || isThinking) {
        analyserRef.current = null;
        frequencyDataRef.current = null;
        return;
      }

      const { analyser, dispose } = createVisualizerAnalyser(track);
      analyserRef.current = analyser;
      frequencyDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      return () => {
        analyserRef.current = null;
        frequencyDataRef.current = null;
        dispose();
      };
    }, [track, isConnecting, isThinking]);

    // Canvas setup + animation loop
    useEffect(() => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current;
      const dotWidth = barWidth ?? (radius * Math.PI) / barCount;
      // Line caps extend segments by half the dot width; the canvas fits
      // whichever reaches further, grown bars or the breath's swell.
      const capRadius = dotWidth / 2;
      const growth = Math.max(barMaxLength, BREATH * radius);
      const side = 2 * (radius + growth + capRadius);
      const center = side / 2;
      const scaleFactor = 2;

      canvas.width = side * scaleFactor;
      canvas.height = side * scaleFactor;
      canvas.style.width = `${side}px`;
      canvas.style.height = `${side}px`;

      const canvasCtx = canvas.getContext("2d")!;
      canvasCtx.lineCap = barLineCap;
      canvasCtx.scale(scaleFactor, scaleFactor);

      // Half the bands, mirrored: dot i and dot barCount−i share a band,
      // so both directions around the ring run low→high and the wrap has
      // no seam. Low frequencies at the top, sibilance at the bottom.
      const sampleRate = analyserRef.current?.context.sampleRate ?? 48000;
      const frequencyBinCount = analyserRef.current?.frequencyBinCount ?? 512;
      const bands = createVoiceBands(
        Math.floor(barCount / 2) + 1,
        sampleRate,
        frequencyBinCount,
      );

      // Static per-dot geometry, clockwise from the top of the ring.
      const dots = Array.from({ length: barCount }, (_, i) => {
        const angle = (i / barCount) * Math.PI * 2;
        return {
          angle,
          ux: Math.cos(angle - Math.PI / 2),
          uy: Math.sin(angle - Math.PI / 2),
          band: bands[Math.min(i, barCount - i)]!,
        };
      });

      // Displayed values persist across effect restarts (mode/track
      // changes) so transitions ease from the current picture; a barCount
      // change (or a hot reload of the entry shape) resets them.
      const display = displayRef.current;
      if (display.length !== barCount || display[0]?.c === undefined) {
        display.length = 0;
        for (let i = 0; i < barCount; i++) display.push({ h: 0, a: 1, c: 0 });
      }

      // Displayed values ease toward per-frame targets, so mode changes
      // blend (~120ms) instead of snapping. Live audio instead chases at
      // barSpeed — the configurable speaking responsiveness.
      const EASE = 0.28;
      const chase = Math.min(1, Math.max(0.05, barSpeed));
      const rest = Math.min(1, Math.max(0, restingOpacity));
      // Both overrides orbit at the same angular rate, so switching
      // states never changes pace. Thinking drags a tail a third of the
      // ring long, fading quadratically; connecting glows over a tight
      // window around each of its two opposed dots.
      const revPerSec = 0.5 * rotationSpeed;
      const TAIL = (Math.PI * 2) / 3;
      const glowWindow = 1.5 * ((Math.PI * 2) / barCount);
      const breathsPerSec = Math.max(0, breathingSpeed);
      const circDist = (a: number, b: number) => {
        const d = Math.abs(a - b) % (Math.PI * 2);
        return d > Math.PI ? Math.PI * 2 - d : d;
      };

      let rafId: number;

      function drawSpectrum() {
        const analyser = analyserRef.current;
        const frequencyData = frequencyDataRef.current;
        const resolvedBarColor = resolvedBarColorRef.current;
        const time = performance.now() / 1000;

        canvasCtx.clearRect(0, 0, side, side);
        canvasCtx.fillStyle = backgroundColor;
        canvasCtx.fillRect(0, 0, side, side);

        let spectrum: Uint8Array<ArrayBuffer> | null = null;
        if (!isConnecting && !isThinking && analyser && frequencyData) {
          analyser.getByteFrequencyData(frequencyData);
          spectrum = frequencyData;
        }

        // One shared head position drives both overrides; connecting
        // mirrors it to the opposite side of the ring.
        const headAngle =
          isConnecting || isThinking ? time * revPerSec * Math.PI * 2 : 0;

        let settled = true;

        // Breath: a slow radial sine while thinking, weighted by an
        // eased ramp so the radius never snaps when the state flips.
        const breathTarget = isThinking ? 1 : 0;
        breathRef.current += (breathTarget - breathRef.current) * EASE;
        if (Math.abs(breathTarget - breathRef.current) > 0.01) settled = false;
        const ringRadius =
          radius +
          breathRef.current *
            BREATH *
            radius *
            Math.sin(time * breathsPerSec * Math.PI * 2);

        for (let i = 0; i < barCount; i++) {
          const { angle, ux, uy, band } = dots[i]!;
          let targetLength = 0;
          // Glow is the accent overlay's strength: 0 rests, 1 is fully
          // lit, fades in between.
          let glow = 0;

          if (isConnecting) {
            const toHead = circDist(angle, headAngle);
            const nearest = Math.min(toHead, Math.PI - toHead);
            const w = Math.max(0, 1 - nearest / glowWindow);
            glow = w * w;
          } else if (isThinking) {
            const behind =
              (((headAngle - angle) % (Math.PI * 2)) + Math.PI * 2) %
              (Math.PI * 2);
            const w = behind < TAIL ? 1 - behind / TAIL : 0;
            glow = w * w;
          } else if (spectrum) {
            targetLength = (readBand(spectrum, band) / 255) * barMaxLength;
          }
          // Silent (no overrides, no analyser): a dim resting ring.
          const targetAlpha = spectrum ? 1 : rest;

          const d = display[i]!;
          d.h += (targetLength - d.h) * (spectrum ? chase : EASE);
          d.a += (targetAlpha - d.a) * EASE;
          d.c += (glow - d.c) * EASE;
          if (
            Math.abs(targetLength - d.h) > 0.5 ||
            Math.abs(targetAlpha - d.a) > 0.02 ||
            Math.abs(glow - d.c) > 0.02
          ) {
            settled = false;
          }

          // One stroked segment covers every length — the line cap
          // renders the floored, near-zero length as the resting dot.
          // Base layer in barColor, accent overlaid at the glow's
          // strength, so accent fades to transparent rather than
          // blending toward the bar color.
          const len = Math.max(d.h, 0.1);
          canvasCtx.beginPath();
          canvasCtx.moveTo(center + ux * ringRadius, center + uy * ringRadius);
          canvasCtx.lineTo(
            center + ux * (ringRadius + len),
            center + uy * (ringRadius + len),
          );
          canvasCtx.lineWidth = dotWidth;
          canvasCtx.globalAlpha = d.a;
          canvasCtx.strokeStyle = resolvedBarColor;
          canvasCtx.stroke();
          if (d.c > 0.01) {
            canvasCtx.globalAlpha = d.c;
            canvasCtx.strokeStyle = resolvedAccentColorRef.current;
            canvasCtx.stroke();
          }
          canvasCtx.globalAlpha = 1;
        }

        // Animated modes and unfinished transitions keep the loop alive;
        // a settled silent frame stops it (the effect restarts on
        // changes).
        if (isConnecting || isThinking || spectrum || !settled) {
          rafId = requestAnimationFrame(drawSpectrum);
        }
      }

      rafId = requestAnimationFrame(drawSpectrum);

      return () => {
        cancelAnimationFrame(rafId);
      };
    }, [
      backgroundColor,
      // Colors are drawn from refs, but a settled silent frame stops the
      // loop — restart it when they change so it repaints. The resolution
      // effect above runs first (declaration order), so the refs are
      // fresh.
      barColor,
      accentColor,
      barCount,
      barLineCap,
      barMaxLength,
      barSpeed,
      barWidth,
      radius,
      restingOpacity,
      rotationSpeed,
      breathingSpeed,
      track,
      isConnecting,
      isThinking,
    ]);

    return (
      <canvas
        ref={canvasRef}
        data-slot="audio-visualizer-radial"
        data-state={
          (isConnecting
            ? "connecting"
            : isThinking
              ? "thinking"
              : track
                ? "speaking"
                : "silent") satisfies VisualizerState
        }
        style={{ display: "block" }}
        className={className}
      />
    );
  },
);

export interface AudioVisualizerRadialProps extends Omit<
  AudioVisualizerRadialViewProps,
  "track"
> {
  /** Which participant's audio to visualize. */
  participantType: ParticipantType;
}

/**
 * Radial audio visualizer wired to a Pipecat media track. Pass
 * isConnecting / isThinking to reflect session state; silent and speaking
 * follow the participant's audio automatically. Must be rendered inside a
 * PipecatClientProvider.
 */
export function AudioVisualizerRadial({
  participantType,
  ...props
}: AudioVisualizerRadialProps) {
  const track = usePipecatClientMediaTrack("audio", participantType);
  return <AudioVisualizerRadialView track={track} {...props} />;
}
