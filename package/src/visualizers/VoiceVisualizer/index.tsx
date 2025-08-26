import React, { useEffect, useRef } from "react";

import { usePipecatClientMediaTrack } from "@pipecat-ai/client-react";

type ParticipantType = Parameters<typeof usePipecatClientMediaTrack>[1];

interface Props {
  backgroundColor?: string;
  barColor?: string;
  barCount?: number;
  barGap?: number;
  barLineCap?: "round" | "square";
  barMaxHeight?: number;
  barOrigin?: "top" | "bottom" | "center";
  barWidth?: number;
  participantType: ParticipantType;
  className?: string;
}

export const VoiceVisualizer: React.FC<Props> = React.memo(
  ({
    backgroundColor = "transparent",
    barColor = "black",
    barCount = 5,
    barGap = 12,
    barLineCap = "round",
    barMaxHeight = 120,
    barOrigin = "center",
    barWidth = 30,
    participantType,
    className,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const resolvedBarColorRef = useRef<string>("black");

    // Resolve the color only when barColor changes
    useEffect(() => {
      function resolveColor(color: string) {
        if (!color) return "black";
        if (color.startsWith("--")) {
          return (
            getComputedStyle(document.documentElement)
              .getPropertyValue(color)
              .trim() || "black"
          );
        }
        return color;
      }
      resolvedBarColorRef.current = resolveColor(barColor);
    }, [barColor]);

    const track: MediaStreamTrack | null = usePipecatClientMediaTrack(
      "audio",
      participantType,
    );

    useEffect(() => {
      if (!canvasRef.current) return;

      const canvasWidth = barCount * barWidth + (barCount - 1) * barGap;
      const canvasHeight = barMaxHeight;

      const canvas = canvasRef.current;

      const scaleFactor = 2;

      // Make canvas fill the width and height of its container
      const resizeCanvas = () => {
        canvas.width = canvasWidth * scaleFactor;
        canvas.height = canvasHeight * scaleFactor;

        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

        canvasCtx.lineCap = barLineCap;
        canvasCtx.scale(scaleFactor, scaleFactor);
      };

      const canvasCtx = canvas.getContext("2d")!;
      resizeCanvas();

      if (!track) return;

      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(
        new MediaStream([track]),
      );
      const analyser = audioContext.createAnalyser();

      analyser.fftSize = 1024;

      source.connect(analyser);

      const frequencyData = new Uint8Array(analyser.frequencyBinCount);

      canvasCtx.lineCap = barLineCap;

      // Create frequency bands based on barCount
      const bands = Array.from({ length: barCount }, (_, i) => {
        // Use improved logarithmic scale for better frequency distribution
        const minFreq = barCount > 20 ? 200 : 80; // Adjust min frequency based on bar count
        const maxFreq = 10000; // Cover most important audio frequencies

        // Use Mel scale inspired approach for more perceptually uniform distribution
        // This helps with a large number of bars by placing fewer in the very low range
        // https://en.wikipedia.org/wiki/Mel_scale
        const melMin = 2595 * Math.log10(1 + minFreq / 700);
        const melMax = 2595 * Math.log10(1 + maxFreq / 700);
        const melStep = (melMax - melMin) / barCount;

        const melValue = melMin + i * melStep;
        const startFreq = 700 * (Math.pow(10, melValue / 2595) - 1);
        const endFreq = 700 * (Math.pow(10, (melValue + melStep) / 2595) - 1);

        return {
          startFreq,
          endFreq,
          smoothValue: 0,
        };
      });

      const getFrequencyBinIndex = (frequency: number) => {
        const nyquist = audioContext.sampleRate / 2;
        return Math.round(
          (frequency / nyquist) * (analyser.frequencyBinCount - 1),
        );
      };

      function drawSpectrum() {
        analyser.getByteFrequencyData(frequencyData);
        canvasCtx.clearRect(
          0,
          0,
          canvas.width / scaleFactor,
          canvas.height / scaleFactor,
        );
        canvasCtx.fillStyle = backgroundColor;
        canvasCtx.fillRect(
          0,
          0,
          canvas.width / scaleFactor,
          canvas.height / scaleFactor,
        );

        let isActive = false;

        const totalBarsWidth =
          bands.length * barWidth + (bands.length - 1) * barGap;
        const startX = (canvas.width / scaleFactor - totalBarsWidth) / 2;

        const adjustedCircleRadius = barWidth / 2;

        const resolvedBarColor = resolvedBarColorRef.current;

        bands.forEach((band, i) => {
          const startIndex = getFrequencyBinIndex(band.startFreq);
          const endIndex = getFrequencyBinIndex(band.endFreq);
          const bandData = frequencyData.slice(startIndex, endIndex);
          const bandValue =
            bandData.reduce((acc, val) => acc + val, 0) / bandData.length;

          const smoothingFactor = 0.2;

          if (bandValue < 1) {
            band.smoothValue = Math.max(
              band.smoothValue - smoothingFactor * 5,
              0,
            );
          } else {
            band.smoothValue =
              band.smoothValue +
              (bandValue - band.smoothValue) * smoothingFactor;
            isActive = true;
          }

          const x = startX + i * (barWidth + barGap);
          // Calculate bar height with a maximum cap
          const minHeight = 0;
          const barHeight = Math.max(
            minHeight,
            Math.min((band.smoothValue / 255) * barMaxHeight, barMaxHeight),
          );

          let yTop, yBottom;
          const canvasHeight = canvas.height / scaleFactor;

          switch (barOrigin) {
            case "top":
              yTop = adjustedCircleRadius;
              yBottom = Math.min(
                adjustedCircleRadius + barHeight,
                canvasHeight - adjustedCircleRadius,
              );
              break;
            case "bottom":
              yBottom = canvasHeight - adjustedCircleRadius;
              yTop = Math.max(yBottom - barHeight, adjustedCircleRadius);
              break;
            case "center":
            default:
              yTop = Math.max(
                canvasHeight / 2 - barHeight / 2,
                adjustedCircleRadius,
              );
              yBottom = Math.min(
                canvasHeight / 2 + barHeight / 2,
                canvasHeight - adjustedCircleRadius,
              );
              break;
          }

          if (band.smoothValue > 0) {
            canvasCtx.beginPath();
            canvasCtx.moveTo(x + barWidth / 2, yTop);
            canvasCtx.lineTo(x + barWidth / 2, yBottom);
            canvasCtx.lineWidth = barWidth;
            canvasCtx.strokeStyle = resolvedBarColor;
            canvasCtx.stroke();
          } else {
            drawInactiveCircle(adjustedCircleRadius, resolvedBarColor, x, yTop);
          }
        });

        if (!isActive) {
          drawInactiveCircles(adjustedCircleRadius, resolvedBarColor);
        }

        requestAnimationFrame(drawSpectrum);
      }

      function drawInactiveCircle(
        circleRadius: number,
        color: string,
        x: number,
        y: number,
      ) {
        switch (barLineCap) {
          case "square":
            canvasCtx.fillStyle = color;
            canvasCtx.fillRect(
              x + barWidth / 2 - circleRadius,
              y - circleRadius,
              circleRadius * 2,
              circleRadius * 2,
            );
            break;
          case "round":
          default:
            canvasCtx.beginPath();
            canvasCtx.arc(x + barWidth / 2, y, circleRadius, 0, 2 * Math.PI);
            canvasCtx.fillStyle = color;
            canvasCtx.fill();
            canvasCtx.closePath();
            break;
        }
      }

      function drawInactiveCircles(circleRadius: number, color: string) {
        const totalBarsWidth =
          bands.length * barWidth + (bands.length - 1) * barGap;
        const startX = (canvas.width / scaleFactor - totalBarsWidth) / 2;
        const canvasHeight = canvas.height / scaleFactor;

        let y;
        switch (barOrigin) {
          case "top":
            y = circleRadius;
            break;
          case "bottom":
            y = canvasHeight - circleRadius;
            break;
          case "center":
          default:
            y = canvasHeight / 2;
            break;
        }

        bands.forEach((_, i) => {
          const x = startX + i * (barWidth + barGap);
          drawInactiveCircle(circleRadius, color, x, y);
        });
      }

      drawSpectrum();

      // Handle resizing
      window.addEventListener("resize", resizeCanvas);

      return () => {
        audioContext.close();
        window.removeEventListener("resize", resizeCanvas);
      };
    }, [
      backgroundColor,
      barCount,
      barGap,
      barLineCap,
      barMaxHeight,
      barOrigin,
      barWidth,
      track,
      barColor,
    ]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
        className={className}
      />
    );
  },
);

VoiceVisualizer.displayName = "VoiceVisualizer";
