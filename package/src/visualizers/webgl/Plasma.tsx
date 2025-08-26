import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import * as THREE from "three";

// Configuration interfaces
interface PlasmaConfig {
  // Core plasma properties
  intensity?: number;
  radius?: number;
  effectScale?: number;
  effectCenter?: { x: number; y: number };
  blendMode?: 0 | 1 | 2 | 3 | 4 | 5;
  plasmaSpeed?: number;
  rayLength?: number;

  // Ring properties
  ringCount?: number;
  ringVisibility?: number;
  ringDistance?: number;
  ringSpread?: number;
  ringBounce?: number;
  ringThickness?: number;
  ringThicknessAudio?: number;
  ringVariance?: number;
  ringSharpness?: number;
  ringAmplitude?: number;
  ringSpeed?: number;
  ringSegments?: number;
  ringColorInheritance?: number;

  // Color properties
  useCustomColors?: boolean;
  color1?: string;
  color2?: string;
  color3?: string;
  backgroundColor?: string;
  colorCycleSpeed?: number;

  // Glow properties
  glowFalloff?: number;
  glowThreshold?: number;

  // Animation properties
  lerpSpeed?: number;
  audioLerpSpeed?: number;

  // Audio properties
  audioEnabled?: boolean;
  audioSensitivity?: number;
  audioSmoothing?: number;
  frequencyBands?: number;
  bassResponse?: number;
  midResponse?: number;
  trebleResponse?: number;
  plasmaVolumeReactivity?: number;
  volumeThreshold?: number;
}

export interface PlasmaProps {
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  initialConfig?: PlasmaConfig;
  onReady?: () => void;
  pixelRatio?: number;
  powerPreference?: "high-performance" | "low-power" | "default";
  alpha?: boolean;
  antialias?: boolean;
  preserveDrawingBuffer?: boolean;
  fallbackContent?: React.ReactNode;
  audioTrack?: MediaStreamTrack | null;
}

export interface PlasmaRef {
  updateConfig: (config: Partial<PlasmaConfig>) => void;
  getConfig: () => PlasmaConfig;
  resetToDefaults: () => void;
}

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

const fragmentShader = `
    uniform vec2 iResolution;
    uniform float iTime;
    uniform float intensity;
    uniform float radius;
    uniform int blendMode;
    uniform float effectScale;
    uniform vec2 effectCenter;
    uniform vec3 color1;
    uniform vec3 color2;
    uniform vec3 color3;
    uniform bool useCustomColors;
    uniform float colorCycleSpeed;
    uniform float ringCount;
    uniform float ringVisibility;
    uniform float ringDistance;
    uniform float ringSpread;
    uniform float ringBounce;
    uniform float ringThickness;
    uniform float ringVariance;
    uniform float ringSharpness;
    uniform float ringAmplitude;
    uniform float ringSpeed;
    uniform float ringSegments;
    uniform float ringColorInheritance;
    uniform vec3 backgroundColor;
    uniform float plasmaSpeed;
    uniform float rayLength;
    uniform float glowFalloff;
    uniform float glowThreshold;
    varying vec2 vUv;
  
    #define TAU 6.2831852
    #define MOD3 vec3(.1031,.11369,.13787)
  
    vec3 blendColors(vec3 bg, vec3 fg, float amt, int mode) {
        if (mode == 0) return mix(bg, fg, amt);
        if (mode == 1) return clamp(bg + fg * amt, 0.0, 1.0);
        if (mode == 2) return 1.0 - (1.0 - bg) * (1.0 - fg * amt);
        if (mode == 3) {
            vec3 base = bg;
            vec3 blend = fg * amt;
            return vec3(
                (base.r < 0.5) ? (2.0 * base.r * blend.r) : (1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r)),
                (base.g < 0.5) ? (2.0 * base.g * blend.g) : (1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g)),
                (base.b < 0.5) ? (2.0 * base.b * blend.b) : (1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b))
            );
        }
        if (mode == 4) {
            vec3 base = bg;
            vec3 blend = fg * amt;
            return vec3(
                (blend.r < 0.5) ? (base.r - (1.0 - 2.0 * blend.r) * base.r * (1.0 - base.r)) : (base.r + (2.0 * blend.r - 1.0) * (sqrt(base.r) - base.r)),
                (blend.g < 0.5) ? (base.g - (1.0 - 2.0 * blend.g) * base.g * (1.0 - base.g)) : (base.g + (2.0 * blend.g - 1.0) * (sqrt(base.g) - base.g)),
                (blend.b < 0.5) ? (base.b - (1.0 - 2.0 * blend.b) * base.b * (1.0 - base.b)) : (base.b + (2.0 * blend.b - 1.0) * (sqrt(base.b) - base.b))
            );
        }
        if (mode == 5) return bg * (1.0 - amt) + fg * amt;
        return mix(bg, fg, amt);
    }
  
    vec3 hash33(vec3 p3) {
        p3 = fract(p3 * MOD3);
        p3 += dot(p3, p3.yxz+19.19);
        return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
    }
  
    float simplex_noise(vec3 p) {
        const float K1 = 0.333333333;
        const float K2 = 0.166666667;
        
        vec3 i = floor(p + (p.x + p.y + p.z) * K1);
        vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
            
        vec3 e = step(vec3(0.0), d0 - d0.yzx);
        vec3 i1 = e * (1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy * (1.0 - e);
        
        vec3 d1 = d0 - (i1 - K2);
        vec3 d2 = d0 - (i2 - 2.0 * K2);
        vec3 d3 = d0 - (1.0 - 3.0 * K2);
        
        vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
        vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
        
        return dot(vec4(31.316), n);
    }
  
    vec3 getColor(vec2 uv, float t, float intensity) {
        float radius = length(uv);
        float angular1 = dot(uv, vec2(1.0, 0.0)) / (radius + 0.001);
        float angular2 = dot(uv, vec2(0.0, 1.0)) / (radius + 0.001);
        
        float phase1 = t * colorCycleSpeed + radius * 3.0 + intensity * 2.0;
        float phase2 = t * colorCycleSpeed * 0.7 + angular1 * 2.0 + intensity * 1.5;
        float phase3 = t * colorCycleSpeed * 1.3 + (radius + angular2) * 1.5;
        
        if (useCustomColors) {
            float band1 = sin(phase1) * 0.5 + 0.5;
            float band2 = sin(phase2 + 2.094) * 0.5 + 0.5; 
            float band3 = sin(phase3 + 4.189) * 0.5 + 0.5;
            
            band1 = pow(band1, 1.0 - intensity * 0.5);
            band2 = pow(band2, 1.0 - intensity * 0.3);
            band3 = pow(band3, 1.0 - intensity * 0.4);
            
            float sum = band1 + band2 + band3;
            return (color1 * band1 + color2 * band2 + color3 * band3) / sum;
        } else {
            vec3 rainbow = 0.5 + 0.5 * cos(phase1 + uv.xyx * 3.0 + vec3(0.0, 2.0, 4.0));
            vec3 rainbow2 = 0.5 + 0.5 * cos(phase2 + uv.yxy * 2.0 + vec3(1.0, 3.0, 5.0));
            return mix(rainbow, rainbow2, intensity);
        }
    }
  
    void main() {
        vec2 uv = (vUv * iResolution - iResolution.xy * 0.5) / iResolution.y;
        uv = (uv - effectCenter) / effectScale;
            
        float a = sin(atan(uv.y, uv.x));
        float am = abs(a - 0.5) * 0.25;
        float l = length(uv);                         
        
        float m1 = clamp(0.1 / smoothstep(0.0, radius, l), 0.0, 1.0);
        float m2 = clamp(0.1 / smoothstep(0.42, 0.0, l), 0.0, 1.0);
        
        float glowAttenuation = exp(-l * glowFalloff);
        m1 *= glowAttenuation;
        
        float s1 = simplex_noise(vec3(uv * 2.0, 1.0 + iTime * 0.525 * plasmaSpeed)) * max(1.0 - l * rayLength, 0.0) + 0.9;
        float s2 = simplex_noise(vec3(uv, 15.0 + iTime * 0.525 * plasmaSpeed)) * max(l, 0.025) + 1.25;
        float s3 = simplex_noise(vec3(vec2(am, am * 100.0 + iTime * 3.0 * plasmaSpeed) * 0.15, 30.0 + iTime * 0.525 * plasmaSpeed)) * max(l, 0.25) + 1.5;
        s3 *= smoothstep(0.0, 0.3345, l);    
        
        float sh = smoothstep(0.15, 0.35, l);
        float m = m1 * m1 * m2 * s1 * s2 * s3 * (1.0 - l) * sh * intensity;
        
        m = max(0.0, m - glowThreshold) / (1.0 - glowThreshold);
        
        float normalizedIntensity = clamp(m / intensity, 0.0, 1.0);
        vec3 colorVal = getColor(uv, iTime, normalizedIntensity);
        vec3 col = blendColors(backgroundColor, colorVal, m, blendMode);
        
        float angle = atan(uv.y, uv.x);
        float wave = iTime * ringSpeed;
        float pixelSize = 2.0 / iResolution.y;
        float thicknessFactor = ringThickness * ringThickness * 0.0001;
        float baseThickness = pixelSize * (1.0 + thicknessFactor * 99.0);
        float ringStart = 0.3;
        
        vec3 ringAccum = vec3(0.0);
        int numRings = int(ringCount);
        
        for (int i = 0; i < 5; i++) {
            if (i >= numRings) break;
            
            float ringIndex = float(i);
            float phaseOffset1 = ringIndex * 1.7 + ringVariance * sin(ringIndex * 3.14);
            float phaseOffset2 = ringIndex * 2.3 + ringVariance * cos(ringIndex * 2.71);
            float speedVariance = 1.0 + ringVariance * sin(ringIndex * 4.5) * 0.5;
            
            float normalizedAngle = angle * 0.159154943 + 0.5;
            float segmentsFloor = floor(ringSegments + 0.5);
            
            float wavePhase1 = sin(normalizedAngle * segmentsFloor * TAU + wave * speedVariance + phaseOffset1);
            float wavePhase2 = sin(normalizedAngle * floor(ringSegments * 1.5 + 0.5) * TAU - wave * speedVariance * 0.7 + phaseOffset2);
            float wavePhase3 = sin(normalizedAngle * floor(ringSegments * 0.5 + 0.5) * TAU + wave * speedVariance * 1.3 + ringIndex);
            
            float fractSegments = fract(ringSegments);
            if (fractSegments > 0.0) {
                float nextWavePhase1 = sin(normalizedAngle * floor(ringSegments + 1.5) * TAU + wave * speedVariance + phaseOffset1);
                wavePhase1 = mix(wavePhase1, nextWavePhase1, smoothstep(0.0, 1.0, fractSegments));
            }
            
            float combinedWave = mix(wavePhase1, wavePhase1 * 0.4 + wavePhase2 * 0.4 + wavePhase3 * 0.2, ringVariance);
            
            float baseRadius = ringStart + ringDistance + ringSpread * ringIndex * 0.2;
            if (ringBounce > 0.0) {
                baseRadius *= 1.0 + sin(iTime * 2.0 + ringIndex * 0.5) * ringBounce;
            }
            
            float ringRadius = baseRadius + ringAmplitude * combinedWave;
            float thicknessModulation = 1.0 + ringVariance * combinedWave * 0.3;
            float currentThickness = baseThickness * thicknessModulation;
            
            float ringDist = abs(l - ringRadius);
            float softEdge = smoothstep(currentThickness, currentThickness * 0.2, ringDist);
            float hardEdge = 1.0 - step(currentThickness * 0.5, ringDist);
            float ringMask = mix(softEdge, hardEdge, ringSharpness);
            
            float falloff = exp(-ringIndex * 0.3);
            float ringStrength = ringMask * ringVisibility * falloff;
            
            vec3 ringColor = vec3(1.0);
            if (useCustomColors) {
                float colorPhase = iTime * 0.3 + ringIndex * 0.7;
                vec3 originalRingColor = getColor(uv * 0.5, colorPhase, ringStrength);
                
                if (ringColorInheritance > 0.0) {
                    vec2 samplePos = normalize(uv) * ringRadius;
                    vec3 plasmaColor = getColor(samplePos, iTime, ringStrength);
                    ringColor = mix(originalRingColor, plasmaColor, ringColorInheritance);
                } else {
                    ringColor = originalRingColor;
                }
            }
            
            if (ringVariance > 0.0) {
                float noiseScale = 10.0 + ringIndex * 2.0;
                float ringNoise = simplex_noise(vec3(uv * noiseScale, iTime * 0.5 + ringIndex)) * 0.5 + 0.5;
                ringStrength *= mix(1.0, ringNoise, ringVariance * 0.5);
            }
            
            ringAccum += ringColor * ringStrength * 0.6;
        }
        
        col = clamp(col + ringAccum, 0.0, 1.5);
        gl_FragColor = vec4(col, 1.0);
    }
  `;

const defaultConfig: Required<PlasmaConfig> = {
  // Core plasma properties
  intensity: 1.5,
  radius: 1.85,
  effectScale: 0.5,
  effectCenter: { x: 0, y: 0 },
  blendMode: 0,
  plasmaSpeed: 1.0,
  rayLength: 1.0,

  // Ring properties
  ringCount: 3,
  ringVisibility: 0.6,
  ringDistance: 0.0,
  ringSpread: 0.07,
  ringBounce: 0.0,
  ringThickness: 12.0,
  ringThicknessAudio: 2.0,
  ringVariance: 0.64,
  ringSharpness: 1,
  ringAmplitude: 0.02,
  ringSpeed: 1.2,
  ringSegments: 5.4,
  ringColorInheritance: 1,

  // Color properties
  useCustomColors: true,
  color1: "#22d3ee",
  color2: "#34d399",
  color3: "#818cf8",
  backgroundColor: "transparent",
  colorCycleSpeed: 0.6,

  // Glow properties
  glowFalloff: 1.0,
  glowThreshold: 0.0,

  // Animation properties
  lerpSpeed: 0.05,
  audioLerpSpeed: 0.069,

  // Audio properties
  audioEnabled: true,
  audioSensitivity: 1.0,
  audioSmoothing: 0.8,
  frequencyBands: 32,
  bassResponse: 1.2,
  midResponse: 1.0,
  trebleResponse: 0.8,
  plasmaVolumeReactivity: 2.0,
  volumeThreshold: 0.15,
};

const interpolatedProps = [
  // Core plasma properties
  "effectScale",
  "intensity",
  "radius",
  "rayLength",
  "glowFalloff",
  "glowThreshold",

  // Ring properties
  "ringCount",
  "ringVisibility",
  "ringDistance",
  "ringSpread",
  "ringBounce",
  "ringThickness",
  "ringVariance",
  "ringSharpness",
  "ringAmplitude",
  "ringSpeed",
  "ringSegments",
  "ringColorInheritance",
];

const immediateProps = ["colorCycleSpeed", "plasmaSpeed", "blendMode"];

const hexToRgb = (hex: string): THREE.Vector3 => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? new THREE.Vector3(
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      )
    : new THREE.Vector3(1, 1, 1);
};

const Plasma = memo(
  forwardRef<PlasmaRef, PlasmaProps>(
    (
      {
        width,
        height,
        className,
        style,
        initialConfig = {},
        onReady,
        pixelRatio,
        powerPreference = "high-performance",
        alpha = false,
        antialias = true,
        preserveDrawingBuffer = false,
        fallbackContent,
        audioTrack,
      },
      ref,
    ) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const sceneRef = useRef<THREE.Scene | null>(null);
      const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
      const materialRef = useRef<THREE.ShaderMaterial | null>(null);
      const frameRef = useRef<number | null>(null);
      const startTimeRef = useRef<number>(Date.now());
      const isVisibleRef = useRef<boolean>(true);
      const hasWebGLRef = useRef<boolean>(true);

      const configRef = useRef<Required<PlasmaConfig>>({
        ...defaultConfig,
        ...initialConfig,
      });
      const targetRef = useRef<
        Record<
          string,
          number | boolean | { x: number; y: number } | THREE.Vector3
        >
      >({});
      const currentRef = useRef<
        Record<
          string,
          number | boolean | { x: number; y: number } | THREE.Vector3
        >
      >({});

      // Audio analysis refs
      const audioContextRef = useRef<AudioContext | null>(null);
      const analyserRef = useRef<AnalyserNode | null>(null);
      const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
      const audioDataRef = useRef<Float32Array | null>(null);
      const smoothedAudioRef = useRef<Float32Array | null>(null);

      // Helper functions
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

      const isVector = (value: unknown): value is { x: number; y: number } => {
        return (
          typeof value === "object" &&
          value !== null &&
          "x" in value &&
          "y" in value
        );
      };

      const isVector3 = (value: unknown): value is THREE.Vector3 => {
        return value instanceof THREE.Vector3;
      };

      const setShaderValue = useCallback(
        (
          property: string,
          value: number | boolean | { x: number; y: number } | THREE.Vector3,
          bypassSmoothing = false,
        ) => {
          if (property in targetRef.current) {
            targetRef.current[property] = value;
            if (
              (immediateProps.includes(property) || bypassSmoothing) &&
              materialRef.current?.uniforms[property]
            ) {
              materialRef.current.uniforms[property].value = value;
              // If bypassing smoothing, also update current value with audio lerp speed
              if (bypassSmoothing && property in currentRef.current) {
                const current = currentRef.current[property];
                if (typeof current === "number" && typeof value === "number") {
                  currentRef.current[property] = lerp(
                    current,
                    value,
                    configRef.current.audioLerpSpeed,
                  );
                }
              }
            }
          }
        },
        [],
      );

      const processAudioData = useCallback(() => {
        if (
          !analyserRef.current ||
          !audioDataRef.current ||
          !smoothedAudioRef.current ||
          !configRef.current.audioEnabled
        ) {
          return null;
        }

        analyserRef.current.getFloatFrequencyData(audioDataRef.current);

        const bands = configRef.current.frequencyBands;
        const sensitivity = configRef.current.audioSensitivity;

        // Calculate the size of each frequency band
        const bandSize = Math.floor(audioDataRef.current.length / bands);
        const bandValues = new Float32Array(bands);

        // Process each frequency band
        for (let i = 0; i < bands; i++) {
          let bandSum = 0;
          // Sum up the values for this frequency band
          for (let j = 0; j < bandSize; j++) {
            const index = i * bandSize + j;
            const rawValue = (audioDataRef.current[index] + 140) / 140; // Normalize from -140 to 0 dB
            bandSum += Math.max(0, Math.min(1, rawValue));
          }
          // Average the band values
          const bandAverage = bandSum / bandSize;
          // Apply smoothing using existing lerping
          smoothedAudioRef.current[i] = bandAverage;
          bandValues[i] = bandAverage;
        }

        // Calculate overall volume from all bands
        const volume =
          (bandValues.reduce((a, b) => a + b, 0) / bands) * sensitivity;

        return {
          bandValues,
          volume,
          spectrum: smoothedAudioRef.current,
        };
      }, []);

      const applyAudioReactivity = useCallback(() => {
        const audioData = processAudioData();
        if (!audioData) return;

        const { volume, bandValues } = audioData;
        const reactivity = configRef.current.plasmaVolumeReactivity;
        const threshold = configRef.current.volumeThreshold;

        // Add threshold and compress volume range
        const compressedVolume =
          volume < threshold ? 0 : (volume - threshold) / (1 - threshold); // Compress remaining range to 0-1

        // Create a more dynamic response to volume
        const volumeResponse = Math.pow(compressedVolume, 1.5) * reactivity;

        // Apply volume reactivity to core plasma properties with more dynamic scaling
        setShaderValue(
          "intensity",
          configRef.current.intensity * (1 + volumeResponse * 1),
          true,
        );
        setShaderValue(
          "radius",
          configRef.current.radius * (1 + volumeResponse * 0.6),
          true,
        );
        setShaderValue(
          "effectScale",
          configRef.current.effectScale * (1 - volumeResponse * 0.5),
          true,
        );
        setShaderValue(
          "glowFalloff",
          configRef.current.glowFalloff * (1 - volumeResponse * 0.25),
          true,
        );
        setShaderValue(
          "colorCycleSpeed",
          configRef.current.colorCycleSpeed * (1 - volumeResponse * 0.03),
          true,
        );
        setShaderValue(
          "plasmaSpeed",
          configRef.current.plasmaSpeed * (1 - volumeResponse * 0.25),
          true,
        );

        // Only adjust ring properties if we have significant audio
        if (volume >= threshold) {
          // Make rings react to audio by adjusting their wave properties
          const averageFrequency =
            bandValues.reduce((a, b) => a + b, 0) / bandValues.length;
          const frequencyVariance =
            Math.max(...bandValues) - Math.min(...bandValues);

          // Set ring visibility to 1 and adjust thickness based on audio
          setShaderValue("ringVisibility", 1.0, true);
          setShaderValue(
            "ringThickness",
            configRef.current.ringThickness *
              configRef.current.ringThicknessAudio,
            false,
          );
          setShaderValue(
            "ringDistance",
            configRef.current.ringDistance - frequencyVariance * 0.1,
            false,
          );

          // Adjust ring wave properties based on audio
          setShaderValue(
            "ringAmplitude",
            configRef.current.ringAmplitude * (1 + averageFrequency * 3),
            true,
          );
          setShaderValue(
            "ringSpeed",
            configRef.current.ringSpeed * (1 + frequencyVariance * 1),
            true,
          );
          setShaderValue(
            "ringVariance",
            configRef.current.ringVariance * (1 + frequencyVariance),
            true,
          );
        } else {
          // When no significant audio, smoothly return to default values
          setShaderValue(
            "ringVisibility",
            configRef.current.ringVisibility,
            false,
          );
          setShaderValue(
            "ringThickness",
            configRef.current.ringThickness,
            false,
          );
          setShaderValue("ringDistance", configRef.current.ringDistance, false);
          setShaderValue(
            "ringAmplitude",
            configRef.current.ringAmplitude,
            false,
          );
          setShaderValue("ringSpeed", configRef.current.ringSpeed, false);
          setShaderValue("ringVariance", configRef.current.ringVariance, false);
        }
      }, [processAudioData, setShaderValue]);

      const updateInterpolation = useCallback(() => {
        if (!materialRef.current) return;

        const lerpSpeed = configRef.current.lerpSpeed;

        interpolatedProps.forEach((prop) => {
          if (prop in targetRef.current && prop in currentRef.current) {
            const current = currentRef.current[prop];
            const target = targetRef.current[prop];
            if (typeof current === "number" && typeof target === "number") {
              // Use lerpSpeed for normal transitions
              currentRef.current[prop] = lerp(current, target, lerpSpeed);
              if (materialRef.current!.uniforms[prop]) {
                materialRef.current!.uniforms[prop].value =
                  currentRef.current[prop];
              }
            }
          }
        });

        // Update vector properties
        if (targetRef.current.effectCenter && currentRef.current.effectCenter) {
          const current = currentRef.current.effectCenter;
          const target = targetRef.current.effectCenter;
          if (isVector(current) && isVector(target)) {
            current.x = lerp(current.x, target.x, lerpSpeed);
            current.y = lerp(current.y, target.y, lerpSpeed);
            materialRef.current!.uniforms.effectCenter.value.set(
              current.x,
              current.y,
            );
          }
        }

        // Update colors
        ["color1", "color2", "color3", "backgroundColor"].forEach(
          (colorKey) => {
            if (targetRef.current[colorKey] && currentRef.current[colorKey]) {
              const target = targetRef.current[colorKey];
              const current = currentRef.current[colorKey];
              if (
                target instanceof THREE.Vector3 &&
                current instanceof THREE.Vector3
              ) {
                current.x = lerp(current.x, target.x, lerpSpeed);
                current.y = lerp(current.y, target.y, lerpSpeed);
                current.z = lerp(current.z, target.z, lerpSpeed);
                materialRef.current!.uniforms[colorKey].value.set(
                  current.x,
                  current.y,
                  current.z,
                );
              }
            }
          },
        );
      }, []);

      const animate = useCallback(() => {
        if (
          !rendererRef.current ||
          !sceneRef.current ||
          !materialRef.current ||
          !isVisibleRef.current
        )
          return;

        // Apply audio reactivity if enabled
        if (audioTrack && configRef.current.audioEnabled) {
          applyAudioReactivity();
        }

        updateInterpolation();
        materialRef.current.uniforms.iTime.value =
          (Date.now() - startTimeRef.current) * 0.001;

        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;

        rendererRef.current.render(sceneRef.current, camera);
        frameRef.current = requestAnimationFrame(animate);
      }, [updateInterpolation, applyAudioReactivity, audioTrack]);

      const updateConfig = useCallback((newConfig: Partial<PlasmaConfig>) => {
        Object.entries(newConfig).forEach(([key, value]) => {
          if (value !== undefined) {
            const configKey = key as keyof PlasmaConfig;
            (configRef.current[configKey] as typeof value) = value;

            if (key === "effectCenter" && typeof value === "object") {
              targetRef.current[key] = { ...value };
            } else if (key.includes("color") || key === "backgroundColor") {
              targetRef.current[key] = hexToRgb(value as string);
            } else {
              targetRef.current[key] = value as
                | number
                | boolean
                | { x: number; y: number };
            }

            // Update immediate properties directly
            if (
              immediateProps.includes(key) &&
              materialRef.current?.uniforms[key]
            ) {
              materialRef.current.uniforms[key].value = value;
            }

            // Update non-interpolated properties
            if (
              key === "useCustomColors" &&
              materialRef.current?.uniforms.useCustomColors
            ) {
              materialRef.current.uniforms.useCustomColors.value =
                value as boolean;
            }
            if (key === "lerpSpeed") {
              configRef.current.lerpSpeed = value as number;
            }
          }
        });
      }, []);

      const getConfig = useCallback(() => ({ ...configRef.current }), []);

      const resetToDefaults = useCallback(() => {
        updateConfig(defaultConfig);
      }, [updateConfig]);

      useImperativeHandle(
        ref,
        () => ({
          updateConfig,
          getConfig,
          resetToDefaults,
        }),
        [updateConfig, getConfig, resetToDefaults],
      );

      // Audio setup effect
      useEffect(() => {
        if (!audioTrack || !configRef.current.audioEnabled) {
          // Cleanup if no audio track
          if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
          }
          if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
          }
          return;
        }

        // Setup audio analysis
        const setupAudio = async () => {
          try {
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            analyserRef.current.fftSize = configRef.current.frequencyBands * 2;
            analyserRef.current.smoothingTimeConstant = 0.8;

            const stream = new MediaStream([audioTrack]);
            sourceRef.current =
              audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);

            const bufferLength = analyserRef.current.frequencyBinCount;
            audioDataRef.current = new Float32Array(bufferLength);
            smoothedAudioRef.current = new Float32Array(bufferLength);
            smoothedAudioRef.current.fill(0);
          } catch (error) {
            console.error("Error setting up audio analysis:", error);
          }
        };

        setupAudio();

        return () => {
          if (sourceRef.current) {
            sourceRef.current.disconnect();
          }
          if (audioContextRef.current) {
            audioContextRef.current.close();
          }
        };
      }, [audioTrack]);

      useEffect(() => {
        if (!canvasRef.current) return;

        // Check WebGL support
        const testCanvas = document.createElement("canvas");
        const gl =
          testCanvas.getContext("webgl") ||
          testCanvas.getContext("experimental-webgl");
        if (!gl) {
          hasWebGLRef.current = false;
          console.warn("WebGL not supported");
          return;
        }

        const canvas = canvasRef.current;
        const canvasWidth = width || canvas.offsetWidth || window.innerWidth;
        const canvasHeight =
          height || canvas.offsetHeight || window.innerHeight;

        // Initialize Three.js with WebGL context attributes
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
        camera.position.z = 1;

        const renderer = new THREE.WebGLRenderer({
          canvas,
          antialias,
          alpha,
          powerPreference,
          preserveDrawingBuffer,
          failIfMajorPerformanceCaveat: false,
        });
        renderer.setSize(canvasWidth, canvasHeight, false);

        // Use provided pixel ratio or auto-detect, but cap at 2 for performance
        const dpr = pixelRatio || Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(dpr);

        // Initialize state
        interpolatedProps.forEach((prop) => {
          const value = configRef.current[prop as keyof PlasmaConfig];
          if (
            typeof value === "number" ||
            typeof value === "boolean" ||
            value instanceof THREE.Vector3 ||
            isVector(value)
          ) {
            targetRef.current[prop] = value;
            currentRef.current[prop] = value;
          }
        });

        immediateProps.forEach((prop) => {
          const value = configRef.current[prop as keyof PlasmaConfig];
          if (
            typeof value === "number" ||
            typeof value === "boolean" ||
            value instanceof THREE.Vector3 ||
            isVector(value)
          ) {
            targetRef.current[prop] = value;
          }
        });

        targetRef.current.effectCenter = { ...configRef.current.effectCenter };
        currentRef.current.effectCenter = { ...configRef.current.effectCenter };

        ["color1", "color2", "color3", "backgroundColor"].forEach(
          (colorKey) => {
            const hex = configRef.current[
              colorKey as keyof PlasmaConfig
            ] as string;
            targetRef.current[colorKey] = hexToRgb(hex);
            currentRef.current[colorKey] = hexToRgb(hex);
          },
        );

        // Create uniforms
        const uniforms = {
          iTime: { value: 0 },
          iResolution: { value: new THREE.Vector2(canvasWidth, canvasHeight) },
          intensity: { value: currentRef.current.intensity },
          radius: { value: currentRef.current.radius },
          blendMode: { value: configRef.current.blendMode },
          effectScale: { value: currentRef.current.effectScale },
          effectCenter: {
            value: new THREE.Vector2(
              currentRef.current.effectCenter.x,
              currentRef.current.effectCenter.y,
            ),
          },
          color1: {
            value: isVector3(currentRef.current.color1)
              ? currentRef.current.color1.clone()
              : new THREE.Vector3(),
          },
          color2: {
            value: isVector3(currentRef.current.color2)
              ? currentRef.current.color2.clone()
              : new THREE.Vector3(),
          },
          color3: {
            value: isVector3(currentRef.current.color3)
              ? currentRef.current.color3.clone()
              : new THREE.Vector3(),
          },
          useCustomColors: { value: configRef.current.useCustomColors },
          colorCycleSpeed: { value: configRef.current.colorCycleSpeed },
          ringCount: { value: currentRef.current.ringCount },
          ringVisibility: { value: currentRef.current.ringVisibility },
          ringDistance: { value: currentRef.current.ringDistance },
          ringSpread: { value: currentRef.current.ringSpread },
          ringBounce: { value: currentRef.current.ringBounce },
          ringThickness: { value: currentRef.current.ringThickness },
          ringVariance: { value: currentRef.current.ringVariance },
          ringSharpness: { value: currentRef.current.ringSharpness },
          ringAmplitude: { value: currentRef.current.ringAmplitude },
          ringSpeed: { value: configRef.current.ringSpeed },
          ringSegments: { value: currentRef.current.ringSegments },
          ringColorInheritance: {
            value: currentRef.current.ringColorInheritance,
          },
          backgroundColor: {
            value: isVector3(currentRef.current.backgroundColor)
              ? currentRef.current.backgroundColor.clone()
              : new THREE.Vector3(),
          },
          plasmaSpeed: { value: configRef.current.plasmaSpeed },
          rayLength: { value: currentRef.current.rayLength },
          glowFalloff: { value: currentRef.current.glowFalloff },
          glowThreshold: { value: currentRef.current.glowThreshold },
        };

        const material = new THREE.ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader,
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        sceneRef.current = scene;
        rendererRef.current = renderer;
        materialRef.current = material;

        // Handle resize with ResizeObserver
        const resizeObserver = new ResizeObserver(() => {
          if (!renderer || !material) return;

          const { width: newWidth, height: newHeight } =
            canvas.getBoundingClientRect();

          // Only update if size actually changed
          if (newWidth > 0 && newHeight > 0) {
            renderer.setSize(newWidth, newHeight, false);
            material.uniforms.iResolution.value.set(newWidth, newHeight);
          }
        });

        // Observe the canvas element
        resizeObserver.observe(canvas);

        // Visibility handling for performance
        const handleVisibilityChange = () => {
          isVisibleRef.current = !document.hidden;
          if (isVisibleRef.current && !frameRef.current) {
            animate();
          }
        };

        // Error handling
        const handleContextLost = (event: Event) => {
          event.preventDefault();
          if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
          }
        };

        const handleContextRestored = () => {
          // Reinitialize if needed
          animate();
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        canvas.addEventListener("webglcontextlost", handleContextLost);
        canvas.addEventListener("webglcontextrestored", handleContextRestored);

        // Start animation
        animate();

        // Notify ready
        if (onReady) {
          onReady();
        }

        return () => {
          resizeObserver.disconnect();
          document.removeEventListener(
            "visibilitychange",
            handleVisibilityChange,
          );
          canvas.removeEventListener("webglcontextlost", handleContextLost);
          canvas.removeEventListener(
            "webglcontextrestored",
            handleContextRestored,
          );
          if (frameRef.current) {
            cancelAnimationFrame(frameRef.current);
          }
          renderer.dispose();
          material.dispose();
          geometry.dispose();
        };
      }, [
        width,
        height,
        animate,
        onReady,
        pixelRatio,
        powerPreference,
        alpha,
        antialias,
        preserveDrawingBuffer,
      ]);

      if (!hasWebGLRef.current && fallbackContent) {
        return <>{fallbackContent}</>;
      }

      return (
        <canvas
          ref={canvasRef}
          className={className}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            touchAction: "none",
            ...style,
          }}
        />
      );
    },
  ),
);

Plasma.displayName = "Plasma";

export default Plasma;

export type { PlasmaConfig };
