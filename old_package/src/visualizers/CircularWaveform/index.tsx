import { cn } from "@/lib/utils";
import React, { useCallback, useEffect, useRef } from "react";
import {
  type CanvasWaveformOptions,
  CircularWaveformCanvas,
  WaveformState,
} from "./canvas";

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

  const initializeWaveform = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const { width: canvasWidth, height: canvasHeight } = getSize();

    const options: CanvasWaveformOptions = {
      width: canvasWidth,
      height: canvasHeight,
      state: WaveformState.IDLE,
      color1,
      color2,
      backgroundColor,
      sensitivity,
      rotationEnabled,
      numBars,
      barWidth,
      debug,
    };

    // Create the waveform canvas
    const waveform = new CircularWaveformCanvas(canvas, options);

    // Store reference
    waveformRef.current = waveform;

    // Start visualization after a short delay
    setTimeout(() => {
      // Start the visualization
      waveform.startVisualization();

      // Apply the correct state based on props
      const currentState = determineState();
      waveform.setState(currentState);
    }, 100);
  }, [
    getSize,
    color1,
    color2,
    backgroundColor,
    sensitivity,
    rotationEnabled,
    numBars,
    barWidth,
    debug,
    determineState,
  ]);

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

  // Initialize canvas on component mount
  useEffect(() => {
    initializeWaveform();
  }, [initializeWaveform]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (waveformRef.current) {
        waveformRef.current.dispose();
      }
    };
  }, []);

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
