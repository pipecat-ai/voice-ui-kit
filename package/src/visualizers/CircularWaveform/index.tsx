import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useRef } from "react";
import { CircularWaveformCanvas, WaveformState } from "./canvas";

export interface CircularWaveformProps {
  size?: number;
  isThinking?: boolean;
  audioTrack?: MediaStreamTrack | null;
  className?: string;
  color1?: string;
  color2?: string;
  backgroundColor?: string;
  sensitivity?: number;
  rotationEnabled?: boolean;
  numBars?: number;
  barWidth?: number;
  debug?: boolean;
}

export const CircularWaveform: React.FC<CircularWaveformProps> = ({
  size,
  audioTrack = null,
  isThinking = false,
  className = "",
  color1 = "#00D3F2",
  color2 = "#E12AFB",
  backgroundColor = "transparent",
  sensitivity = 1,
  rotationEnabled = true,
  numBars = 64,
  barWidth = 4,
  debug = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const waveformRef = useRef<CircularWaveformCanvas | null>(null);

  const getSize = useCallback((): { width: number; height: number } => {
    if (size) {
      return { width: size, height: size };
    }

    let containerWidth = window.innerWidth;
    let containerHeight = window.innerHeight;

    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      containerWidth = containerRect.width;
      containerHeight = containerRect.height;
    }

    const availableSize = Math.min(containerWidth, containerHeight);
    const calculatedSize = availableSize;

    return { width: calculatedSize, height: calculatedSize };
  }, [size]);

  const determineState = useCallback((): WaveformState => {
    const newState = isThinking
      ? WaveformState.THINKING
      : audioTrack
        ? WaveformState.AUDIO
        : WaveformState.IDLE;

    return newState;
  }, [isThinking, audioTrack]);

  // Connect audio track if provided
  const connectAudioTrack = useCallback(() => {
    if (!waveformRef.current || !audioTrack) return;

    waveformRef.current.connectToAudioTrack(audioTrack);
  }, [audioTrack]);

  // Handle container resize using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;

    const handleContainerResize = () => {
      if (!waveformRef.current || !canvasRef.current) return;

      const { width: canvasWidth, height: canvasHeight } = getSize();
      waveformRef.current.updateCanvasSize(canvasWidth, canvasHeight);
    };

    const resizeObserver = new ResizeObserver(() => {
      handleContainerResize();
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [getSize]);

  // Initialize the waveform instance once on mount — its lifecycle equals the
  // canvas element's lifecycle. Every prop change (state, colors, options, …)
  // is applied imperatively on the existing instance via the setState /
  // updateOptions / updateCanvasSize effects below. Recreating the instance
  // here would leak the previous one (RAF loop + AudioContext) and drop the
  // connected audio track, since the connect effect only runs on track changes.
  /* eslint-disable react-hooks/exhaustive-deps -- intentionally snapshots initial props; later changes flow through the effects below */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { width, height } = getSize();

    const waveform = new CircularWaveformCanvas(canvas, {
      width,
      height,
      state: WaveformState.IDLE,
      color1,
      color2,
      backgroundColor,
      sensitivity,
      rotationEnabled,
      numBars,
      barWidth,
      debug,
    });

    waveformRef.current = waveform;
    waveform.startVisualization();
    // Initial state sync; later changes are applied by the effect below.
    waveform.setState(determineState());

    return () => {
      // Release the ref before disposing so a re-run of this effect (e.g.
      // React StrictMode double-mount) never talks to a dead instance.
      waveformRef.current = null;
      waveform.dispose();
    };
  }, []);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Keep the canvas size in sync when the `size` prop changes without an
  // actual container resize (ResizeObserver only fires on DOM size changes).
  useEffect(() => {
    if (!waveformRef.current) return;

    const { width, height } = getSize();
    waveformRef.current.updateCanvasSize(width, height);
  }, [getSize]);

  // Connect audio track if provided
  useEffect(() => {
    if (audioTrack && waveformRef.current) {
      connectAudioTrack();
    }
  }, [audioTrack, connectAudioTrack]);

  // Update waveform state when relevant props change
  useEffect(() => {
    if (!waveformRef.current) return;

    const currentState = determineState();
    waveformRef.current.setState(currentState);
  }, [isThinking, audioTrack, determineState]);

  // Update waveform options when props change
  useEffect(() => {
    if (!waveformRef.current) return;

    waveformRef.current.updateOptions({
      color1,
      color2,
      backgroundColor,
      sensitivity,
      rotationEnabled,
      numBars,
      barWidth,
      debug,
    });
  }, [
    color1,
    color2,
    backgroundColor,
    sensitivity,
    rotationEnabled,
    numBars,
    barWidth,
    debug,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "circular-waveform-container w-full h-full flex items-center justify-center",
        className,
      )}
      style={{ position: "relative" }}
    >
      <canvas ref={canvasRef} className="circular-waveform-canvas" />
    </div>
  );
};

CircularWaveform.displayName = "CircularWaveform";
