"use client";
import { usePipecatClientMediaTrack } from "@pipecat-ai/client-react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  type AnimationPlaybackControlsWithThen,
  type ValueAnimationTransition,
} from "motion/react";
import { memo, useCallback, useEffect, useRef, useState } from "react";

import { ReactShaderToy } from "@/components/pipecat/wave-shader";
import {
  createVisualizerAnalyser,
  resolveVisualizerColor,
  type VisualizerState,
} from "@/lib/visualizer";

export type { VisualizerState };

type ParticipantType = Parameters<typeof usePipecatClientMediaTrack>[1];

export interface AudioVisualizerWaveViewProps {
  /** Audio track to visualize. Rests as a calm drifting aura when null. */
  track?: MediaStreamTrack | null;
  /**
   * Aura color. Any CSS color, "currentColor", or a "--css-var" name.
   * Defaults to a vivid cyan — the aura is made of light, so near-black
   * colors wash out to gray.
   */
  color?: string;
  /** Hue variation across the aura's layers (0–1, default 0.05). */
  colorShift?: number;
  /** Visualizer size in px (square, default 224). */
  size?: number;
  /** Animation speed multiplier over the state's base pace (default 1). */
  speed?: number;
  /** Edge-deformation multiplier over the state's base depth (default 1). */
  amplitude?: number;
  /** Brightness multiplier over the state's base glow (default 1). */
  glow?: number;
  /** Edge blur/softness of the aura (default 0.2). */
  softness?: number;
  /**
   * Background optimization: "dark" uses bloom, "light" boosts
   * saturation. Defaults to detecting the root element's "dark" class.
   */
  themeMode?: "dark" | "light";
  /** Override the volume computed from the track (0–1). */
  volume?: number;
  /**
   * Override: a session is being established — the aura shimmers gently.
   * Wins over isThinking; the track is ignored while set. Without
   * overrides the visualizer derives silent/speaking from the track on
   * its own.
   */
  isConnecting?: boolean;
  /**
   * Override: the bot is working on a response — the aura pulses deeply.
   * The track is ignored while set.
   */
  isThinking?: boolean;
  className?: string;
}

/**
 * Overall track volume 0–1 (RMS of the byte spectrum), updated per
 * animation frame while a track is live.
 */
function useTrackVolume(
  track?: MediaStreamTrack | null,
  opts: { fftSize?: number; smoothingTimeConstant?: number } = {},
): number {
  const [volume, setVolume] = useState(0);
  const { fftSize, smoothingTimeConstant } = opts;

  useEffect(() => {
    if (!track) {
      setVolume(0);
      return;
    }
    const { analyser, dispose } = createVisualizerAnalyser(track);
    if (fftSize) analyser.fftSize = fftSize;
    if (smoothingTimeConstant !== undefined) {
      analyser.smoothingTimeConstant = smoothingTimeConstant;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);
    let rafId = 0;
    const tick = () => {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] ?? 0) / 255;
        sum += v * v;
      }
      setVolume(Math.sqrt(sum / data.length));
      rafId = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(rafId);
      dispose();
    };
  }, [track, fftSize, smoothingTimeConstant]);

  return volume;
}

const DEFAULT_TRANSITION: ValueAnimationTransition = {
  duration: 0.5,
  ease: "easeOut",
};
const DEFAULT_PULSE_TRANSITION: ValueAnimationTransition = {
  duration: 0.35,
  ease: "easeOut",
  repeat: Infinity,
  repeatType: "mirror",
};

/** A state value that can tween, spring, or pulse via motion. */
function useAnimatedValue<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  const motionValue = useMotionValue(initialValue);
  const controlsRef = useRef<AnimationPlaybackControlsWithThen | null>(null);
  useMotionValueEvent(motionValue, "change", (value) => setValue(value as T));

  const animateFn = useCallback(
    (targetValue: T | T[], transition: ValueAnimationTransition) => {
      controlsRef.current = animate(motionValue, targetValue, transition);
    },
    [motionValue],
  );

  return { value, motionValue, controls: controlsRef, animate: animateFn };
}

/**
 * Maps the kit's visualizer lifecycle onto the shader's parameters:
 * silent drifts calmly, connecting springs up with a gentle shimmer,
 * thinking pulses deeply, and speaking churns fast with the aura's
 * body scaled by live volume.
 */
function useAuraParams(
  state: VisualizerState,
  track?: MediaStreamTrack | null,
  volumeProp?: number,
) {
  const [speed, setSpeed] = useState(10);
  const {
    value: scale,
    animate: animateScale,
    motionValue: scaleMotionValue,
  } = useAnimatedValue(0.2);
  const { value: amplitude, animate: animateAmplitude } = useAnimatedValue(1.2);
  const { value: frequency, animate: animateFrequency } = useAnimatedValue(0.4);
  const { value: brightness, animate: animateBrightness } =
    useAnimatedValue(1.0);

  const trackVolume = useTrackVolume(state === "speaking" ? track : null, {
    fftSize: 512,
    smoothingTimeConstant: 0.55,
  });
  const volume = volumeProp ?? trackVolume;

  useEffect(() => {
    switch (state) {
      case "silent":
        setSpeed(10);
        animateScale(0.2, DEFAULT_TRANSITION);
        animateAmplitude(1.2, DEFAULT_TRANSITION);
        animateFrequency(0.4, DEFAULT_TRANSITION);
        animateBrightness(1.0, DEFAULT_TRANSITION);
        return;
      case "connecting":
        setSpeed(20);
        animateScale(0.3, { type: "spring", duration: 1.0, bounce: 0.35 });
        animateAmplitude(1.0, DEFAULT_TRANSITION);
        animateFrequency(0.7, DEFAULT_TRANSITION);
        animateBrightness([1.5, 2.0], DEFAULT_PULSE_TRANSITION);
        return;
      case "thinking":
        setSpeed(30);
        animateScale(0.3, DEFAULT_TRANSITION);
        animateAmplitude(0.5, DEFAULT_TRANSITION);
        animateFrequency(1, DEFAULT_TRANSITION);
        animateBrightness([0.5, 2.5], DEFAULT_PULSE_TRANSITION);
        return;
      case "speaking":
        setSpeed(70);
        animateScale(0.3, DEFAULT_TRANSITION);
        animateAmplitude(0.75, DEFAULT_TRANSITION);
        animateFrequency(1.25, DEFAULT_TRANSITION);
        animateBrightness(1.5, DEFAULT_TRANSITION);
        return;
    }
  }, [
    state,
    animateScale,
    animateAmplitude,
    animateFrequency,
    animateBrightness,
  ]);

  useEffect(() => {
    if (state === "speaking" && volume > 0 && !scaleMotionValue.isAnimating()) {
      animateScale(0.2 + 0.2 * volume, { duration: 0 });
    }
  }, [state, volume, scaleMotionValue, animateScale]);

  return { speed, scale, amplitude, frequency, brightness };
}

// #1FD5F9 as shader RGB — the fallback when a color can't be parsed.
const DEFAULT_RGB: [number, number, number] = [0.121, 0.835, 0.976];

/** Resolved CSS color → RGB floats for the shader uniform. */
function colorToRgb(color: string): [number, number, number] {
  const ctx = document.createElement("canvas").getContext("2d");
  if (!ctx) return DEFAULT_RGB;
  ctx.fillStyle = color;
  const normalized = String(ctx.fillStyle);
  if (normalized.startsWith("#")) {
    const n = parseInt(normalized.slice(1, 7), 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const parts = normalized.match(/[\d.]+/g);
  if (parts && parts.length >= 3) {
    return [
      Number(parts[0]) / 255,
      Number(parts[1]) / 255,
      Number(parts[2]) / 255,
    ];
  }
  return DEFAULT_RGB;
}

const shaderSource = `
const float TAU = 6.283185;

// Noise for dithering
vec2 randFibo(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.xx + p.yx) * p.xy);
}

// Tonemap
vec3 Tonemap(vec3 x) {
  x *= 4.0;
  return x / (1.0 + x);
}

// Luma for alpha
float luma(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

// RGB to HSV
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

// HSV to RGB
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// SDF shapes
float sdCircle(vec2 st, float r) {
  return length(st) - r;
}

float sdLine(vec2 p, float r) {
  float halfLen = r * 2.0;
  vec2 a = vec2(-halfLen, 0.0);
  vec2 b = vec2(halfLen, 0.0);
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float getSdf(vec2 st) {
  if(uShape == 1.0) return sdCircle(st, uScale);
  else if(uShape == 2.0) return sdLine(st, uScale);
  return sdCircle(st, uScale); // Default
}

vec2 turb(vec2 pos, float t, float it) {
  // Initial rotation matrix for swirl direction
  mat2 rotation = mat2(0.6, -0.25, 0.25, 0.9);
  // Secondary rotation applied each iteration (approx 53 degree rotation)
  mat2 layerRotation = mat2(0.6, -0.8, 0.8, 0.6);

  float frequency = mix(2.0, 15.0, uFrequency);
  float amplitude = uAmplitude;
  float frequencyGrowth = 1.4;
  float animTime = t * 0.1 * uSpeed;

  const int LAYERS = 4;
  for(int i = 0; i < LAYERS; i++) {
    // Calculate wave displacement for this layer
    vec2 rotatedPos = pos * rotation;
    vec2 wave = sin(frequency * rotatedPos + float(i) * animTime + it);

    // Apply displacement along rotation direction
    pos += (amplitude / frequency) * rotation[0] * wave;

    // Evolve parameters for next layer
    rotation *= layerRotation;
    amplitude *= mix(1.0, max(wave.x, wave.y), uVariance);
    frequency *= frequencyGrowth;
  }

  return pos;
}

const float ITERATIONS = 36.0;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;

  vec3 pp = vec3(0.0);
  vec3 bloom = vec3(0.0);
  float t = iTime * 0.5;
  vec2 pos = uv - 0.5;

  vec2 prevPos = turb(pos, t, 0.0 - 1.0 / ITERATIONS);
  float spacing = mix(1.0, TAU, uSpacing);

  for(float i = 1.0; i < ITERATIONS + 1.0; i++) {
    float iter = i / ITERATIONS;
    vec2 st = turb(pos, t, iter * spacing);
    float d = abs(getSdf(st));
    float pd = distance(st, prevPos);
    prevPos = st;
    float dynamicBlur = exp2(pd * 2.0 * 1.4426950408889634) - 1.0;
    float ds = smoothstep(0.0, uBlur * 0.05 + max(dynamicBlur * uSmoothing, 0.001), d);

    // Shift color based on iteration using uColorScale
    vec3 color = uColor;
    if(uColorShift > 0.01) {
      vec3 hsv = rgb2hsv(color);
      // Shift hue by iteration
      hsv.x = fract(hsv.x + (1.0 - iter) * uColorShift * 0.3);
      color = hsv2rgb(hsv);
    }

    float invd = 1.0 / max(d + dynamicBlur, 0.001);
    pp += (ds - 1.0) * color;
    bloom += clamp(invd, 0.0, 250.0) * color;
  }

  pp *= 1.0 / ITERATIONS;

  vec3 color;

  // Dark mode (default)
  if(uMode < 0.5) {
    // use bloom effect
    bloom = bloom / (bloom + 2e4);
    color = (-pp + bloom * 3.0 * uBloom) * 1.2;
    color += (randFibo(fragCoord).x - 0.5) / 255.0;
    color = Tonemap(color);
    float alpha = luma(color) * uMix;
    fragColor = vec4(color * uMix, alpha);
  }

  // Light mode
  else {
    // no bloom effect
    color = -pp;
    color += (randFibo(fragCoord).x - 0.5) / 255.0;

    // Preserve hue by tone mapping brightness only
    float brightness = length(color);
    vec3 direction = brightness > 0.0 ? color / brightness : color;

    // Reinhard on brightness
    float factor = 2.0;
    float mappedBrightness = (brightness * factor) / (1.0 + brightness * factor);
    color = direction * mappedBrightness;

    // Boost saturation to compensate for white background bleed-through
    // When alpha < 1.0, white bleeds through making colors look desaturated
    // So we increase saturation to maintain vibrant appearance
    float gray = dot(color, vec3(0.2, 0.5, 0.1));
    float saturationBoost = 3.0;
    color = mix(vec3(gray), color, saturationBoost);

    // Clamp between 0-1
    color = clamp(color, 0.0, 1.0);

    float alpha = mappedBrightness * clamp(uMix, 1.0, 2.0);
    fragColor = vec4(color, alpha);
  }
}`;

interface AuraShaderProps {
  /** Animation speed. */
  speed: number;
  /** Edge-deformation depth. */
  amplitude: number;
  /** Wobble frequency. */
  frequency: number;
  /** Orb radius in shader space. */
  scale: number;
  /** Brightness of the orb. */
  brightness: number;
  /** Edge blur/softness of the aura. */
  softness: number;
  /** Aura color as shader RGB floats. */
  rgbColor: [number, number, number];
  /** Hue variation across layers (0–1). */
  colorShift: number;
  /** "dark" uses bloom, "light" boosts saturation. */
  themeMode: "dark" | "light";
}

/** The shader surface: parameters in, ReactShaderToy uniforms out. */
function AuraShader({
  speed,
  amplitude,
  frequency,
  scale,
  brightness,
  softness,
  rgbColor,
  colorShift,
  themeMode,
}: AuraShaderProps) {
  return (
    <ReactShaderToy
      fs={shaderSource}
      devicePixelRatio={globalThis.devicePixelRatio ?? 1}
      uniforms={{
        // Aurora wave speed
        uSpeed: { type: "1f", value: speed },
        // Edge blur/softness
        uBlur: { type: "1f", value: softness },
        // Shape scale
        uScale: { type: "1f", value: scale },
        // Shape type: 1=circle, 2=line
        uShape: { type: "1f", value: 1.0 },
        // Wave frequency and complexity
        uFrequency: { type: "1f", value: frequency },
        // Turbulence amplitude
        uAmplitude: { type: "1f", value: amplitude },
        // Light intensity (bloom)
        uBloom: { type: "1f", value: 0.0 },
        // Brightness of the aurora
        uMix: { type: "1f", value: brightness },
        // Contour spacing around the shape (0-1)
        uSpacing: { type: "1f", value: 0.5 },
        // Color palette offset - shifts colors along the gradient (0-1)
        uColorShift: { type: "1f", value: colorShift },
        // Amplitude variation across layers (0-1)
        uVariance: { type: "1f", value: 0.1 },
        // Smoothing of the aurora (0-1)
        uSmoothing: { type: "1f", value: 1.0 },
        // Display mode: 0=dark background, 1=light background
        uMode: { type: "1f", value: themeMode === "light" ? 1.0 : 0.0 },
        // Color
        uColor: { type: "3fv", value: rgbColor },
      }}
      onError={(error) => {
        console.error("Shader error:", error);
      }}
      onWarning={(warning) => {
        console.warn("Shader warning:", warning);
      }}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/**
 * Shader aura audio visualizer for any MediaStreamTrack: swirling ribbons
 * of turbulent light that react to the session. Silent drifts calmly;
 * speaking churns fast with the aura's body swelling on live volume;
 * connecting springs up with a gentle shimmer; thinking pulses deeply.
 *
 * Silent and speaking derive from the track; the isConnecting /
 * isThinking overrides opt into the kit's other shared lifecycle states,
 * and every state change animates instead of snapping. The resolved
 * VisualizerState is exposed as data-state. Renders nothing where WebGL
 * is unavailable.
 */
export const AudioVisualizerWaveView = memo(function AudioVisualizerWaveView({
  track = null,
  color = "#1FD5F9",
  colorShift = 0.05,
  size = 224,
  speed = 1,
  amplitude = 1,
  glow = 1,
  softness = 0.2,
  themeMode,
  volume,
  isConnecting = false,
  isThinking = false,
  className,
}: AudioVisualizerWaveViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rgbColor, setRgbColor] =
    useState<[number, number, number]>(DEFAULT_RGB);

  const state: VisualizerState = isConnecting
    ? "connecting"
    : isThinking
      ? "thinking"
      : track
        ? "speaking"
        : "silent";

  const params = useAuraParams(state, track, volume);

  // Resolve CSS-flavored colors to shader RGB. className is a dependency
  // because it can change what currentColor resolves to.
  useEffect(() => {
    setRgbColor(colorToRgb(resolveVisualizerColor(color, rootRef.current)));
  }, [color, className]);

  // Default the shader's background mode to the documentElement theme;
  // rechecked per render, which the animated params drive constantly.
  const resolvedThemeMode =
    themeMode ??
    (typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light");

  return (
    <div
      ref={rootRef}
      data-slot="audio-visualizer-wave"
      data-state={state}
      style={{ width: size, height: size }}
      className={className}
    >
      <AuraShader
        speed={params.speed * speed}
        amplitude={params.amplitude * amplitude}
        frequency={params.frequency}
        scale={params.scale}
        brightness={params.brightness * glow}
        softness={softness}
        rgbColor={rgbColor}
        colorShift={colorShift}
        themeMode={resolvedThemeMode}
      />
    </div>
  );
});

export interface AudioVisualizerWaveProps extends Omit<
  AudioVisualizerWaveViewProps,
  "track"
> {
  /** Which participant's audio to visualize. */
  participantType: ParticipantType;
}

/**
 * Aura audio visualizer wired to a Pipecat media track. Pass
 * isConnecting / isThinking to reflect session state; silent and speaking
 * follow the participant's audio automatically. Must be rendered inside a
 * PipecatClientProvider.
 */
export function AudioVisualizerWave({
  participantType,
  ...props
}: AudioVisualizerWaveProps) {
  const track = usePipecatClientMediaTrack("audio", participantType);
  return <AudioVisualizerWaveView track={track} {...props} />;
}
