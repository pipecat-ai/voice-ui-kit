// Type definitions
export enum WaveformState {
  IDLE = "idle",
  AUDIO = "audio",
  THINKING = "thinking",
  COMPLETE = "complete",
}

export interface CanvasWaveformOptions {
  /** Width of the canvas in pixels (responsive if omitted) */
  width?: number;

  /** Height of the canvas in pixels (responsive if omitted) */
  height?: number;

  /** Primary color for the visualization bars (RGBA or hex format) */
  color1?: string;

  /** Secondary color for the visualization bars (RGBA or hex format) - used for color transitions */
  color2?: string;

  /** Background color of the canvas (use 'transparent' for no background) */
  backgroundColor?: string;

  /** Audio sensitivity factor (0.5-2.0) - higher values make visualization more responsive to quiet sounds */
  sensitivity?: number;

  /** Whether the visualization should rotate */
  rotationEnabled?: boolean;

  /** Base rotation speed (radians per frame * 0.01) */
  rotationSpeed?: number;

  /** How much audio activity boosts rotation speed (higher values = more dramatic spin-up) */
  rotationBoostFactor?: number;

  /** Number of bars in the circular visualization */
  numBars?: number;

  /** Width of each individual bar in pixels */
  barWidth?: number;

  /** Current state of the waveform (idle/audio/thinking/complete) */
  state?: WaveformState;

  /** Whether to display debug information */
  debug?: boolean;
}

interface FrequencyBar {
  angle: number;
  value: number;
  targetValue: number;
  hue: number;
  transitionWeight: number;
}

interface WaveformConfig {
  // Bar rendering properties
  numBars: number;
  barWidth: number;
  maxBarLength: number;
  minBarLength: number;

  // Audio processing
  downsampleFactor: number;
  activityThreshold: number;
  minGain: number;
  maxGain: number;
  dynamicRange: number;
  bassBoost: number;

  // Animation properties
  baseRadius: number;
  rotationSpeed: number;
  rotationBoostFactor: number;
  rotationDecayRate: number;

  // Frequency processing
  frequencySmoothing: number;

  // Pulse properties
  pulseSpeed: number;
  pulseWidth: number;
  maxPulseHeight: number;
  listeningPulseAmount: number;
}

export class CircularWaveformCanvas {
  // DOM elements
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private dpr: number = 1;

  // Audio processing
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private frequencyData: Uint8Array | null = null;

  // Visualization data buffers
  private downsampledData: Float32Array | null = null;
  private normalizedData: Float32Array | null = null;
  private smoothedData: Float32Array | null = null;
  private temporallySmoothedData: Float32Array | null = null;
  private peakValues: Float32Array | null = null;
  private prevFrameData: Float32Array | null = null;

  // Animation state
  private animationId: number | null = null;
  private isPlaying: boolean = false;
  private animationTime: number = 0;
  private lastFrameTime: number = 0;
  private rotation: number = 0;
  private targetRotationSpeed: number = 0;
  private currentRotationSpeed: number = 0;
  private freqBars: FrequencyBar[] = [];

  // Pulse animation
  private nextPulseTime: number = 0;
  private isPulsing: boolean = false;
  private pulseProgress: number = 0;
  private pulseDuration: number = 0.8;

  // Status
  private statusCallback: ((status: string) => void) | null = null;

  // Configuration
  private options: Required<CanvasWaveformOptions> = {
    width: 0,
    height: 0,
    color1: "rgba(0, 150, 255, 0.8)",
    color2: "rgba(255, 0, 150, 0.8)",
    backgroundColor: "transparent",
    sensitivity: 1.0,
    rotationEnabled: true,
    rotationSpeed: 0.05,
    rotationBoostFactor: 15,
    numBars: 128,
    barWidth: 5,
    state: WaveformState.IDLE,
    debug: false,
  };

  private config: WaveformConfig;

  /**
   * Creates a new audio waveform visualization on the provided canvas
   * @param canvas - The HTML canvas element to draw on
   * @param options - Configuration options for the visualization
   */
  constructor(canvas: HTMLCanvasElement, options: CanvasWaveformOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.options = { ...this.options, ...options };
    this.options.state = this.options.state || WaveformState.IDLE;

    this.config = this.generateConfig();
    this.freqBars = this.createFrequencyBars(this.config.numBars);

    this.updateCanvasSize();
    this.drawInitialState();
  }

  //===================================
  // CONFIGURATION AND INITIALIZATION
  //===================================

  /**
   * Generates derived configuration parameters from input options
   */
  private generateConfig(): WaveformConfig {
    const {
      sensitivity,
      numBars,
      barWidth,
      rotationSpeed,
      rotationBoostFactor,
    } = this.options;

    return {
      // Bar rendering properties
      numBars,
      barWidth,
      maxBarLength: 1,
      minBarLength: 0.0001,

      // Audio processing
      downsampleFactor: 2,
      activityThreshold: 0.1,
      minGain: Math.max(0.01, 0.25 - sensitivity * 0.1),
      maxGain: 1.2,
      dynamicRange: Math.max(0.8, Math.min(2.5, sensitivity * 1.2)),
      bassBoost: 1.4,

      // Animation properties
      baseRadius: 0.3,
      rotationSpeed: rotationSpeed * 0.01,
      rotationBoostFactor: rotationBoostFactor,
      rotationDecayRate: 1,

      // Frequency processing
      frequencySmoothing: 0.6,

      // Pulse properties
      pulseSpeed: 8,
      pulseWidth: Math.PI * 0.3,
      maxPulseHeight: 0.15,
      listeningPulseAmount: 2,
    };
  }

  /**
   * Creates frequency bar objects that form the circular visualization
   * @param count - Number of bars to create
   */
  private createFrequencyBars(count: number): FrequencyBar[] {
    const bars: FrequencyBar[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const hue = (i / count) * 360;

      // Calculate transition weight for smoothing connection points
      const transitionPoints = [0, count * 0.5];
      const transitionWidth = count * 0.2;
      const transitionWeight = transitionPoints
        .map((point) => {
          const distance =
            Math.min(
              Math.abs(i - point),
              Math.abs(i - point - count),
              Math.abs(i - point + count),
            ) /
            (transitionWidth / 2);
          return Math.max(0, 1 - distance);
        })
        .reduce((max, val) => Math.max(max, val), 0);

      bars.push({
        angle,
        value: 0,
        targetValue: 0,
        hue,
        transitionWeight,
      });
    }

    return bars;
  }

  /**
   * Initialize the audio context and analyzer
   * @returns AudioContext or null if initialization failed
   */
  private initializeAudio(): AudioContext | null {
    if (this.audioContext) {
      return this.audioContext;
    }

    try {
      const AudioContext: typeof window.AudioContext =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext: typeof window.AudioContext;
          }
        ).webkitAudioContext;

      const audioCtx = new AudioContext({
        latencyHint: "interactive",
        sampleRate: 44100,
      });

      this.audioContext = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.minDecibels = -110;
      analyser.maxDecibels = -30 + (this.config.dynamicRange - 1) * 5;
      analyser.smoothingTimeConstant = 0.5;
      this.analyser = analyser;

      // Create data arrays
      this.frequencyData = new Uint8Array(analyser.frequencyBinCount);

      // Initialize reusable arrays
      const downsampledLength = Math.ceil(
        analyser.frequencyBinCount / this.config.downsampleFactor,
      );
      this.downsampledData = new Float32Array(downsampledLength);
      this.normalizedData = new Float32Array(downsampledLength);
      this.smoothedData = new Float32Array(downsampledLength);
      this.temporallySmoothedData = new Float32Array(downsampledLength);

      // Auto-resume if needed
      if (audioCtx.state === "suspended") {
        this.setupAutoResume(audioCtx);
      }

      return audioCtx;
    } catch (error) {
      console.error("Failed to initialize audio context:", error);
      this.setStatus("Audio API not supported in this browser");
      return null;
    }
  }

  /**
   * Setup event listeners to auto-resume audio context on user interaction
   */
  private setupAutoResume(audioCtx: AudioContext): void {
    const resumeOnInteraction = () => {
      audioCtx
        .resume()
        .then(() => {
          document.removeEventListener("click", resumeOnInteraction);
          document.removeEventListener("touchstart", resumeOnInteraction);
          document.removeEventListener("keydown", resumeOnInteraction);
        })
        .catch((err) => {
          console.error("Failed to resume AudioContext:", err);
        });
    };

    document.addEventListener("click", resumeOnInteraction);
    document.addEventListener("touchstart", resumeOnInteraction);
    document.addEventListener("keydown", resumeOnInteraction);
  }

  /**
   * Setup audio processing chain for voice optimization
   */
  private setupAudioProcessingChain(audioCtx: AudioContext): void {
    if (!this.source || !this.analyser) return;

    // Voice filter - for speech emphasis
    const voiceFilter = audioCtx.createBiquadFilter();
    voiceFilter.type = "peaking";
    voiceFilter.frequency.value = 2000;
    voiceFilter.Q.value = 1.0;
    voiceFilter.gain.value = 3.5;

    // Low shelf for bass
    const lowFilter = audioCtx.createBiquadFilter();
    lowFilter.type = "lowshelf";
    lowFilter.frequency.value = 300;
    lowFilter.gain.value = this.config.bassBoost;

    // Analyzer settings
    this.analyser.fftSize = 1024;
    this.analyser.minDecibels = -100;
    this.analyser.maxDecibels = -30 + (this.config.dynamicRange - 1) * 5;
    this.analyser.smoothingTimeConstant = 0.65;

    // Connect the chain
    this.source.connect(voiceFilter);
    voiceFilter.connect(lowFilter);
    lowFilter.connect(this.analyser);
  }

  //===================================
  // AUDIO PROCESSING
  //===================================

  /**
   * Process audio data from analyzer frequency data
   */
  private processAudioData(frequencyData: Uint8Array): void {
    // Downsample frequency data for efficiency
    const downsampleFactor = this.config.downsampleFactor;
    const sampleLength = Math.ceil(frequencyData.length / downsampleFactor);

    // Initialize arrays if needed
    if (!this.downsampledData || this.downsampledData.length !== sampleLength) {
      this.downsampledData = new Float32Array(sampleLength);
      this.normalizedData = new Float32Array(sampleLength);
      this.smoothedData = new Float32Array(sampleLength);
      this.temporallySmoothedData = new Float32Array(sampleLength);
    }

    // Ensure arrays are initialized
    if (!this.downsampledData || !this.normalizedData) {
      return;
    }

    // Calculate voice frequency range bins
    const vocalLowBin = Math.floor(4 / downsampleFactor);
    const vocalHighBin = Math.min(
      Math.floor(372 / downsampleFactor),
      this.downsampledData.length - 1,
    );

    // Downsample and normalize in one pass
    let maxValue = 0;
    for (let i = 0; i < this.downsampledData.length; i++) {
      // Downsample
      const value = frequencyData[i * downsampleFactor] / 255;
      this.downsampledData[i] = value;

      // Apply emphasis to vocal range
      const emphasis = i >= vocalLowBin && i <= vocalHighBin ? 1.0 : 0.25;
      this.normalizedData[i] = value * emphasis;

      // Track maximum value
      if (
        i >= vocalLowBin &&
        i <= vocalHighBin &&
        this.normalizedData[i] > maxValue
      ) {
        maxValue = this.normalizedData[i];
      }
    }

    // Apply dynamic range adjustment
    for (let i = 0; i < this.normalizedData.length; i++) {
      this.normalizedData[i] = Math.pow(this.normalizedData[i], 0.8);
      this.normalizedData[i] = Math.max(
        this.config.minGain,
        Math.min(this.config.maxGain, this.normalizedData[i]),
      );
    }

    // Apply basic compression if needed
    if (maxValue > 0.7) {
      const compressionRatio = 2.0;
      for (let i = 0; i < this.normalizedData.length; i++) {
        if (this.normalizedData[i] > 0.7) {
          const overThreshold = this.normalizedData[i] - 0.7;
          this.normalizedData[i] = 0.7 + overThreshold / compressionRatio;
        }
      }
    }

    // Apply frequency smoothing and temporal smoothing
    this.applyOptimizedFrequencySmoothing();
    this.applyOptimizedTemporalSmoothing();

    // Calculate audio levels and process bars
    this.calculateOptimizedAudioLevels(
      frequencyData,
      vocalLowBin,
      vocalHighBin,
    );
  }

  /**
   * Apply smoothing between frequency bins
   */
  private applyOptimizedFrequencySmoothing(): void {
    const len = this.normalizedData!.length;
    const radius = Math.max(1, Math.floor(this.config.frequencySmoothing * 3));
    const temp = new Float32Array(len);

    // Single-pass weighted smoothing
    for (let i = 0; i < len; i++) {
      let sum = 0,
        weightSum = 0;

      for (
        let j = Math.max(0, i - radius);
        j <= Math.min(len - 1, i + radius);
        j++
      ) {
        const weight = 1 - Math.abs(i - j) / (radius + 1);
        sum += this.normalizedData![j] * weight;
        weightSum += weight;
      }

      temp[i] = sum / weightSum;
    }

    // Smooth the edges for circular continuity
    const edgeBlendSize = Math.min(8, Math.floor(len * 0.04));
    for (let i = 0; i < edgeBlendSize; i++) {
      const weight = (edgeBlendSize - i) / edgeBlendSize;
      const frontIdx = i;
      const backIdx = len - i - 1;

      if (frontIdx < backIdx) {
        const blendedValue = (temp[frontIdx] + temp[backIdx]) / 2;
        temp[frontIdx] = temp[frontIdx] * (1 - weight) + blendedValue * weight;
        temp[backIdx] = temp[backIdx] * (1 - weight) + blendedValue * weight;
      }
    }

    this.smoothedData!.set(temp);
  }

  /**
   * Apply smoothing over time to prevent jumps
   */
  private applyOptimizedTemporalSmoothing(): void {
    if (
      !this.prevFrameData ||
      this.prevFrameData.length !== this.smoothedData!.length
    ) {
      this.prevFrameData = new Float32Array(this.smoothedData!.length);
      this.prevFrameData.set(this.smoothedData!);
    }

    if (
      !this.temporallySmoothedData ||
      this.temporallySmoothedData.length !== this.smoothedData!.length
    ) {
      this.temporallySmoothedData = new Float32Array(this.smoothedData!.length);
    }

    // Use a fixed smoothing factor
    const smoothFactor = 0.3;

    for (let i = 0; i < this.smoothedData!.length; i++) {
      this.temporallySmoothedData[i] =
        this.smoothedData![i] * (1 - smoothFactor) +
        this.prevFrameData[i] * smoothFactor;

      this.prevFrameData[i] = this.temporallySmoothedData[i];
    }
  }

  // Calculate audio levels with simplified math
  private calculateOptimizedAudioLevels(
    frequencyData: Uint8Array,
    vocalLowBin: number,
    vocalHighBin: number,
  ): void {
    const length = frequencyData.length;

    // Simplified frequency band calculation
    const bassEnd = Math.floor(length * 0.2);
    const midEnd = Math.floor(length * 0.6);

    // Sample every 4th point for efficiency
    const sampleRate = 4;

    // Use efficient summing approach
    let bassSum = 0,
      midSum = 0,
      highSum = 0;
    let bassCount = 0,
      midCount = 0,
      highCount = 0;

    for (let i = 0; i < bassEnd; i += sampleRate) {
      bassSum += frequencyData[i];
      bassCount++;
    }

    for (let i = bassEnd; i < midEnd; i += sampleRate) {
      midSum += frequencyData[i];
      midCount++;
    }

    for (let i = midEnd; i < length; i += sampleRate) {
      highSum += frequencyData[i];
      highCount++;
    }

    // Calculate normalized levels with reasonable defaults to avoid division by zero
    const bassLevel = Math.max(
      0.2,
      (bassSum / (bassCount || 1) / 255) * this.config.bassBoost,
    );
    const midLevel = Math.max(0.2, midSum / (midCount || 1) / 255);
    const highLevel = Math.max(0.2, highSum / (highCount || 1) / 255);

    // Simplified activity level calculation
    const overallActivityLevel = Math.sqrt(
      (bassLevel * bassLevel + midLevel * midLevel + highLevel * highLevel) / 3,
    );

    // Detection logic kept similar to maintain good behavior
    const isActiveAudio = overallActivityLevel > this.config.activityThreshold;
    const volumeScalingFactor = isActiveAudio
      ? Math.min(1.0, Math.max(0.15, Math.pow(overallActivityLevel / 0.4, 1.2)))
      : 0.15;

    // Rotation speed update - simplified calculations
    if (this.options.rotationEnabled) {
      if (isActiveAudio) {
        // Linear relationship is simpler than complex formulas
        const boostAmount =
          Math.min(1.0, overallActivityLevel) * this.config.rotationBoostFactor;
        this.targetRotationSpeed =
          this.config.rotationSpeed * (1 + boostAmount);
      } else {
        this.targetRotationSpeed = this.config.rotationSpeed;
      }
    }

    // Update the frequency bars
    this.updateBarsOptimized(
      vocalLowBin,
      vocalHighBin,
      volumeScalingFactor,
      isActiveAudio,
      overallActivityLevel,
      [bassLevel, midLevel, highLevel],
    );
  }

  // Optimized bar update method
  private updateBarsOptimized(
    vocalLowBin: number,
    vocalHighBin: number,
    volumeScalingFactor: number,
    isActiveAudio: boolean,
    overallActivityLevel: number,
    levelsByRange: number[],
  ): void {
    const barCount = this.freqBars.length;

    if (!this.peakValues || this.peakValues.length !== barCount) {
      this.peakValues = new Float32Array(barCount);
    }

    // Create frequency mapping for bars - maintain good frequency distribution
    const frequencyValues = new Array(barCount).fill(0);

    // Improved frequency distribution to eliminate dead zones
    for (let i = 0; i < barCount; i++) {
      const normalizedPosition = i / barCount;

      // Using a more balanced distribution across the entire circle
      // This helps avoid the harsh transition/dead zone
      if (normalizedPosition < 0.8) {
        // Use first 80% of the circle for a wider range of frequencies
        // This expands the vocal range coverage
        const speechRangeLow = Math.floor(vocalLowBin * 1.2); // Lower starting point
        const speechRangeHigh = Math.min(
          vocalHighBin,
          Math.floor(vocalHighBin * 0.9), // Extend higher for more coverage
        );

        // Map frequency bins more evenly across the circle
        const frequencyIndex = Math.floor(
          speechRangeLow +
            (normalizedPosition * (speechRangeHigh - speechRangeLow)) / 0.8,
        );

        if (this.temporallySmoothedData) {
          const safeIndex = Math.min(
            this.temporallySmoothedData.length - 1,
            Math.max(0, frequencyIndex),
          );
          // Apply a consistent boost across all frequencies
          frequencyValues[i] = this.temporallySmoothedData[safeIndex] * 1.1;
        }
      } else {
        // For the remaining 20%, create a smoother transition to higher frequencies
        // Use overlapping frequencies to avoid harsh transitions
        const remappedPosition = (normalizedPosition - 0.8) / 0.2;

        // Start from a lower frequency point to overlap with the previous section
        const highFreqLow = Math.floor(vocalHighBin * 0.6); // Lower starting point for better overlap
        const highFreqHigh = vocalHighBin;

        const frequencyIndex = Math.floor(
          highFreqLow + remappedPosition * (highFreqHigh - highFreqLow),
        );

        if (this.temporallySmoothedData) {
          const safeIndex = Math.min(
            this.temporallySmoothedData.length - 1,
            Math.max(0, frequencyIndex),
          );
          // Apply a stronger boost to this traditionally less active region
          frequencyValues[i] = this.temporallySmoothedData[safeIndex] * 1.4;
        }
      }
    }

    // Apply enhanced frequency spread with stronger influence in problem areas
    this.applyEnhancedFrequencySpread(frequencyValues);

    // Process each bar using optimized value calculations
    for (let i = 0; i < barCount; i++) {
      const bar = this.freqBars[i];

      // Optimized but effective bar value processing
      const value = this.processBarValueOptimized(
        frequencyValues[i],
        volumeScalingFactor,
        isActiveAudio,
        overallActivityLevel,
        i,
        barCount,
        levelsByRange,
      );

      // Set target with smoothing
      bar.targetValue = value;

      // Simplified smoothing with different rates for increasing vs. decreasing
      const smoothingFactor = bar.targetValue > bar.value ? 0.25 : 0.12;

      const delta = bar.targetValue - bar.value;
      bar.value += delta * smoothingFactor;

      // Cap maximum value
      bar.value = Math.min(bar.value, 0.9);

      // Store the peak value for possible normalization
      this.peakValues[i] = bar.value;
    }
  }

  // Enhanced frequency spread function with special handling for transition areas
  private applyEnhancedFrequencySpread(values: number[]): void {
    const len = values.length;
    const spreadRadius = Math.floor(len * 0.15); // Increased radius for better spread
    const temp = [...values];

    // First, identify the regions with least activity
    const activityLevels = new Array(len).fill(0);
    let totalActivity = 0;

    for (let i = 0; i < len; i++) {
      activityLevels[i] = temp[i];
      totalActivity += temp[i];
    }

    const avgActivity = totalActivity / len;

    // Apply adaptive spreading based on activity levels
    for (let i = 0; i < len; i++) {
      if (temp[i] > 0.08) {
        // Lower threshold to include more source points
        const peakValue = temp[i];

        // Determine if this is in a typically low-activity area
        // (approximately 3/4 through the circle based on the image)
        const isInLowActivityZone =
          i >= Math.floor(len * 0.6) && i <= Math.floor(len * 0.9);

        // Use a wider spread and stronger influence in low activity zones
        const effectiveSpreadRadius = isInLowActivityZone
          ? spreadRadius * 1.5
          : spreadRadius;

        for (let offset = 1; offset <= effectiveSpreadRadius; offset++) {
          const leftIdx = (i - offset + len) % len;
          const rightIdx = (i + offset) % len;

          // Calculate falloff with special boosting for problem areas
          let falloff = 1 - offset / effectiveSpreadRadius;

          // Apply stronger spreading in historically inactive areas
          const targetIsInLowZone =
            (leftIdx >= Math.floor(len * 0.6) &&
              leftIdx <= Math.floor(len * 0.9)) ||
            (rightIdx >= Math.floor(len * 0.6) &&
              rightIdx <= Math.floor(len * 0.9));

          if (targetIsInLowZone) {
            falloff = falloff * 1.3; // Boost the spread influence in problem areas
          }

          const spreadValue = peakValue * falloff * 0.4; // Increased spread influence

          // Apply spread to neighbors with stronger effect
          values[leftIdx] = Math.max(
            values[leftIdx],
            values[leftIdx] * 0.6 + spreadValue * 0.4, // More influence from neighbors
          );
          values[rightIdx] = Math.max(
            values[rightIdx],
            values[rightIdx] * 0.6 + spreadValue * 0.4,
          );
        }
      }
    }

    // Apply multiple smoothing passes focused on transition areas
    const smoothingPasses = 2;
    for (let pass = 0; pass < smoothingPasses; pass++) {
      const resultCopy = [...values];

      for (let i = 0; i < len; i++) {
        // Apply stronger smoothing in problem areas
        const isInTransitionZone =
          i >= Math.floor(len * 0.55) && i <= Math.floor(len * 0.95);

        if (isInTransitionZone || pass === 0) {
          const prev = (i - 1 + len) % len;
          const next = (i + 1) % len;

          // Weighted smoothing (center gets more weight in normal areas, less in transition zones)
          const centerWeight = isInTransitionZone ? 1.5 : 2;
          values[i] =
            (resultCopy[prev] +
              resultCopy[i] * centerWeight +
              resultCopy[next]) /
            (2 + centerWeight);
        }
      }
    }

    // Final balancing to ensure more even distribution
    let minVal = 1.0;
    let maxVal = 0.0;

    // Find min and max
    for (let i = 0; i < len; i++) {
      minVal = Math.min(minVal, values[i]);
      maxVal = Math.max(maxVal, values[i]);
    }

    // If we have a significant range, apply a subtle normalization
    // This brings up low areas slightly without flattening everything
    if (maxVal > minVal * 3 && minVal > 0) {
      const range = maxVal - minVal;
      for (let i = 0; i < len; i++) {
        // Apply sqrt normalization to bring up lower values more than higher ones
        const normalizedVal = (values[i] - minVal) / range;
        const boostedVal =
          Math.sqrt(normalizedVal) * range * 0.8 + minVal * 1.2;

        // Only apply to lower values to avoid flattening everything
        if (values[i] < avgActivity) {
          values[i] = values[i] * 0.7 + boostedVal * 0.3;
        }
      }
    }
  }

  // Optimized bar value processing with similar visual results
  private processBarValueOptimized(
    frequencyValue: number,
    volumeScalingFactor: number,
    isActiveAudio: boolean,
    overallActivityLevel: number,
    barIndex: number,
    barCount: number,
    levelsByRange: number[],
  ): number {
    const position = barIndex / barCount;
    let value = frequencyValue;

    // Simplified level distribution - still maintains good distribution
    const [bassLevel, midLevel, highLevel] = levelsByRange;

    // Simpler zone calculation with fewer trig functions
    const zoneAngle = position * Math.PI * 2;
    const zone1 = 0.5 + 0.5 * Math.cos(zoneAngle);
    const zone2 = 0.5 + 0.5 * Math.cos(zoneAngle - Math.PI * 0.5);
    const zone3 = 0.5 + 0.5 * Math.cos(zoneAngle - Math.PI);
    const zone4 = 0.5 + 0.5 * Math.cos(zoneAngle - Math.PI * 1.5);

    // Simplified boost factor calculation
    const boostFactor =
      (0.85 + bassLevel * 0.7) * zone1 * 0.25 +
      (0.85 + midLevel * 0.6) * zone2 * 0.25 +
      (0.85 + highLevel * 0.6) * zone3 * 0.25 +
      (0.85 + bassLevel * 0.7) * zone4 * 0.25;

    // Apply boost and volume scaling
    value = value * boostFactor * 1.3;
    value = value * volumeScalingFactor * 1.2;

    // Add baseline activity when audio is active
    if (isActiveAudio && overallActivityLevel > 0.2) {
      value = Math.max(value, 0.08 * overallActivityLevel);
    }

    // Handle thinking state separately
    if (this.options.state === WaveformState.THINKING) {
      const thinkingBaseline = 0.01;
      const thinkingOscillation =
        Math.sin(this.animationTime * 0.8 + position * Math.PI * 2) * 0.008;

      const pulseInfluence = this.getThinkingPulseInfluence(barIndex, barCount);
      value = thinkingBaseline + thinkingOscillation + pulseInfluence * 0.1;

      return this.limitBarValue(value);
    }

    // Apply oscillation for organic movement
    if (isActiveAudio) {
      const oscillationIntensity = Math.min(
        0.04,
        Math.max(0.01, overallActivityLevel * 0.12),
      );

      const oscillation =
        Math.sin(this.animationTime * 1.5 + position * Math.PI * 2) *
        oscillationIntensity;

      if (value < 0.15) {
        value += oscillation + overallActivityLevel * 0.2;
      } else {
        value += oscillation * 0.6;
      }
    } else {
      const restingOscillation =
        Math.sin(this.animationTime * 0.8 + position * Math.PI * 2) * 0.002;
      value = Math.min(value, 0.01);
      value = 0.005 + restingOscillation;
    }

    // Apply ceiling
    value = Math.min(value, 0.85);

    // Handle audio pulse effects
    if (this.options.state === WaveformState.AUDIO) {
      const audioPulseInfluence = this.getAudioPulseInfluence(
        barIndex,
        barCount,
      );

      if (audioPulseInfluence > 0) {
        const pulseDamping = Math.max(0, 1 - value * 0.8);
        const pulseAmount = audioPulseInfluence * pulseDamping * 0.4;
        value = value * (1 + pulseAmount) + audioPulseInfluence * 0.05;
      } else if (this.isPulsing && this.pulseProgress > 0) {
        const normalizedPosition = barIndex / barCount;
        let distance = Math.abs(normalizedPosition - this.pulseProgress);
        distance = Math.min(distance, 1 - distance);

        const fadeOutFactor = 1 - this.pulseProgress;
        const influence = Math.max(0, 1 - Math.pow(distance / 0.12, 2));
        const thinkingPulseInfluence = influence * fadeOutFactor * 0.2;

        value =
          value * (1 + thinkingPulseInfluence * 0.1) +
          thinkingPulseInfluence * 0.01;
      }
    }

    // Final bounds check
    value = Math.max(0.005, this.limitBarValue(value, 0.9));

    return value;
  }

  //===================================
  // RENDERING
  //===================================

  /**
   * Main animation frame handler - called on each frame
   */
  private draw = (timestamp: number) => {
    if (!this.ctx) {
      this.animationId = requestAnimationFrame(this.draw);
      return;
    }

    // Calculate time since last frame
    const deltaTime = Math.min(
      Math.max((timestamp - this.lastFrameTime) / 1000, 0.001),
      0.1,
    );
    this.lastFrameTime = timestamp;
    this.animationTime += deltaTime;

    // Update rotation
    if (this.options.rotationEnabled) {
      this.updateRotationSpeed(deltaTime);
      this.rotation += this.currentRotationSpeed * deltaTime * 60;
    }

    // Setup drawing context
    const ctx = this.ctx;
    const canvas = this.canvas;
    const logicalWidth = canvas.width / this.dpr;
    const logicalHeight = canvas.height / this.dpr;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(this.dpr, this.dpr);

    // Update pulse animation in audio mode
    if (this.options.state === WaveformState.AUDIO) {
      this.updateAudioPulse();
    }

    // Clear canvas and draw background
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);
    if (this.options.backgroundColor !== "transparent") {
      ctx.fillStyle = this.options.backgroundColor;
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);
    }

    // Render based on current state
    switch (this.options.state) {
      case WaveformState.COMPLETE:
        this.drawCompleteState();
        break;
      case WaveformState.THINKING:
        this.drawThinkingState(ctx, canvas, deltaTime);
        break;
      case WaveformState.AUDIO:
        if (this.analyser && this.frequencyData) {
          this.drawAudioState(ctx, canvas);
        } else {
          this.drawStaticState(ctx, canvas, deltaTime);
        }
        break;
      case WaveformState.IDLE:
      default:
        this.drawStaticState(ctx, canvas, deltaTime);
        break;
    }

    this.animationId = requestAnimationFrame(this.draw);
  };

  // Draw the initial state (before audio connection)
  public drawInitialState(): void {
    if (!this.ctx) return;

    const ctx = this.ctx;
    // Use logical dimensions for all drawing
    const width = this.canvas.width / this.dpr;
    const height = this.canvas.height / this.dpr;

    // Ensure the correct scale is applied
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(this.dpr, this.dpr);

    // Clear canvas and set background
    ctx.clearRect(0, 0, width, height);

    // Apply background color if not transparent
    if (this.options.backgroundColor !== "transparent") {
      ctx.fillStyle = this.options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }
  }

  // Draw the thinking state animation
  private drawThinkingState(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    deltaTime: number,
  ): void {
    // Use logical dimensions
    const width = canvas.width / this.dpr;
    const height = canvas.height / this.dpr;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseCircleRadius = Math.min(width, height) * this.config.baseRadius;

    // Create traveling pulse animation
    const bars = this.freqBars;
    const barCount = bars.length;

    // Base size and transition constants
    const baseSize = 0.1;

    // Scale down pulse height to be more consistent with audio mode
    // audio mode uses listeningPulseAmount (default 2) but applies additional scaling factors
    const pulseHeight = this.config.maxPulseHeight * 0.35; // Reduced scaling factor

    // Travel pulse position around the circle
    const pulsePosition =
      (this.animationTime * this.config.pulseSpeed) % (Math.PI * 2);

    for (let i = 0; i < barCount; i++) {
      const bar = bars[i];
      const barAngle = (i / barCount) * Math.PI * 2;

      // Calculate this bar's relation to the pulse position
      let angleDiff = Math.abs(barAngle - pulsePosition);
      angleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff); // Handle wrapping

      // Calculate pulse influence using the configured width
      const pulseInfluence = Math.max(
        0,
        1 - angleDiff / (this.config.pulseWidth / 2),
      );

      // Create a smooth pulse shape with reduced amplitude
      const smoothedPulse =
        Math.pow(Math.sin((pulseInfluence * Math.PI) / 2), 2) * pulseHeight;

      // Gradually transition base value toward standard size
      const stabilizationFactor = 0.03 * deltaTime * 60; // Slightly faster stabilization

      // Transition toward baseSize, but preserve some of the current value
      const newBaseValue =
        bar.targetValue * (1 - stabilizationFactor) +
        baseSize * stabilizationFactor;

      // Add pulse on top of the base value
      const newTargetValue = newBaseValue + smoothedPulse;

      // Ensure we don't exceed maximum length
      bar.targetValue = Math.min(newTargetValue, this.config.maxBarLength);

      // Apply smoothing for transitions
      const growFactor = 0.6 * deltaTime * 60; // Fast growth for pulse
      const shrinkFactor = 0.4 * deltaTime * 60; // Slower shrink for smooth fade

      const smoothingFactor =
        bar.targetValue > bar.value
          ? Math.min(1, growFactor)
          : Math.min(1, shrinkFactor);

      const delta = bar.targetValue - bar.value;
      bar.value += delta * smoothingFactor;

      // Draw the bar
      const angle = bar.angle + this.rotation;
      this.drawBar(ctx, centerX, centerY, baseCircleRadius, bar, angle);
    }

    // Use base rotation speed in thinking state
    this.targetRotationSpeed = this.config.rotationSpeed;
  }

  // Draw a basic static state when no audio is available
  private drawStaticState(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    deltaTime: number,
  ): void {
    // Use logical dimensions
    const width = canvas.width / this.dpr;
    const height = canvas.height / this.dpr;
    const centerX = width / 2;
    const centerY = height / 2;
    const circleRadius = Math.min(width, height) * this.config.baseRadius;

    // Clear any previous content
    ctx.clearRect(0, 0, width, height);

    // Apply background color if not transparent
    if (this.options.backgroundColor !== "transparent") {
      ctx.fillStyle = this.options.backgroundColor;
      ctx.fillRect(0, 0, width, height);
    }

    // Draw with minimal animation
    for (let i = 0; i < this.freqBars.length; i++) {
      const bar = this.freqBars[i];
      const angle = bar.angle + this.rotation;

      // Base size with subtle animation
      const baseSize = 0.1;
      const variationAmount = 0.1;
      const randomValue =
        baseSize + Math.sin(this.animationTime + i * 0.1) * variationAmount;

      // Animate towards random value - adjust for delta time
      bar.targetValue = randomValue;
      bar.value += (bar.targetValue - bar.value) * 0.05 * deltaTime * 60;

      // Draw the bar
      this.drawBar(ctx, centerX, centerY, circleRadius, bar, angle);
    }

    // Use base rotation in all states
    this.targetRotationSpeed = this.config.rotationSpeed;
  }

  // Draw the normal audio-reactive state
  private drawAudioState(
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
  ): void {
    // Use logical dimensions
    const width = canvas.width / this.dpr;
    const height = canvas.height / this.dpr;
    const centerX = width / 2;
    const centerY = height / 2;
    const baseCircleRadius = Math.min(width, height) * this.config.baseRadius;

    const analyser = this.analyser!;
    const frequencyData = this.frequencyData!;

    // Get audio data
    analyser.getByteFrequencyData(frequencyData);

    // Process the audio data
    this.processAudioData(frequencyData);

    // Draw each bar
    const bars = this.freqBars;
    const barCount = bars.length;

    for (let i = 0; i < barCount; i++) {
      const bar = bars[i];
      const angle = bar.angle + this.rotation;
      this.drawBar(ctx, centerX, centerY, baseCircleRadius, bar, angle);
    }
  }

  // Draw a bar
  private drawBar(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    baseCircleRadius: number,
    bar: FrequencyBar,
    angle: number,
  ): void {
    // Get the current value and ensure it doesn't exceed maximum bounds
    const currentValue = this.limitBarValue(bar.value);

    // Calculate bar height based on mode
    let barHeight;

    // For audio mode, make bars much smaller at low values
    const minBarLength = baseCircleRadius * this.config.minBarLength;
    const maxBarLength = baseCircleRadius * this.config.maxBarLength;

    // More pronounced power curve (1.4 instead of 1.6) to emphasize changes
    barHeight = minBarLength + Math.pow(currentValue, 1.4) * maxBarLength;

    // Ensure length doesn't exceed the maximum due to pulse
    barHeight = Math.min(barHeight, maxBarLength);

    // Add a small minimum bar length to ensure visibility
    barHeight = Math.max(barHeight, baseCircleRadius * 0.003);

    // Inner and outer radius - adjust inner radius for audio mode
    const innerRadius = baseCircleRadius;
    const outerRadius = innerRadius + barHeight;

    // Calculate positions
    const startX = centerX + Math.cos(angle) * innerRadius;
    const startY = centerY + Math.sin(angle) * innerRadius;
    const endX = centerX + Math.cos(angle) * outerRadius;
    const endY = centerY + Math.sin(angle) * outerRadius;

    // Calculate color based on value - using a stronger exponential curve
    // This makes the color blend more subtle until extreme bar lengths
    // At value=0.3, we want the color to be mostly color1 still
    // At value=0.7+, we want to rapidly shift toward color2
    const normalizedValue = Math.min(1.0, currentValue / 0.3);
    // Use a power curve to delay the blend toward color2
    const colorBlendRatio = Math.pow(normalizedValue, 3.0); // Higher exponent means slower transition
    const color = this.blendColors(
      this.options.color1,
      this.options.color2,
      colorBlendRatio,
    );

    // Calculate line width that varies with volume
    // For small bars, make them much thinner, gradually getting thicker as they grow
    const baseWidth = this.config.barWidth;

    const minWidthRatio = 0.5;
    const maxWidthRatio = 1.5;

    // Adjust the power curve for a more dramatic thickness growth (2.2 instead of 2.5)
    const thicknessRatio =
      minWidthRatio +
      (maxWidthRatio - minWidthRatio) * Math.pow(normalizedValue, 2.2);

    const lineWidth = baseWidth * thicknessRatio;

    // Draw the bar
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.stroke();
  }

  // Helper to blend between two colors
  private blendColors(color1: string, color2: string, ratio: number): string {
    // Parse colors to extract RGB components
    const c1 = this.parseRGBA(color1);
    const c2 = this.parseRGBA(color2);

    // Blend RGB components
    const r = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
    const g = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
    const b = Math.round(c1.b * (1 - ratio) + c2.b * ratio);

    // Use alpha from colors if present, otherwise default to 1
    const a =
      c1.a !== undefined && c2.a !== undefined
        ? c1.a * (1 - ratio) + c2.a * ratio
        : 1;

    // Return blended color
    return a !== 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
  }

  // Helper to parse RGBA from color string
  private parseRGBA(color: string): {
    r: number;
    g: number;
    b: number;
    a?: number;
  } {
    // Handle rgba format
    let match = color.match(
      /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/,
    );
    if (match) {
      return {
        r: parseInt(match[1], 10),
        g: parseInt(match[2], 10),
        b: parseInt(match[3], 10),
        a: match[4] ? parseFloat(match[4]) : undefined,
      };
    }

    // Handle hex format
    match = color.match(/#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
    if (match) {
      return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16),
      };
    }

    // Handle shorthand hex format
    match = color.match(/#([0-9a-f])([0-9a-f])([0-9a-f])/i);
    if (match) {
      return {
        r: parseInt(match[1] + match[1], 16),
        g: parseInt(match[2] + match[2], 16),
        b: parseInt(match[3] + match[3], 16),
      };
    }

    // Default to black if parsing fails
    console.warn(`Failed to parse color: ${color}, using black instead`);
    return { r: 0, g: 0, b: 0 };
  }

  // Draw the complete state (empty state)
  private drawCompleteState(): void {
    // Empty state visualization
    // No rendering needed for now

    // Use base rotation in all states
    this.targetRotationSpeed = this.config.rotationSpeed;
  }

  //===================================
  // PUBLIC API
  //===================================

  /**
   * Start the visualization animation
   */
  public startVisualization(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    // Only reset properties if not already playing
    if (!this.isPlaying) {
      this.rotation = 0;
      this.currentRotationSpeed = this.config.rotationSpeed;
      this.targetRotationSpeed = this.config.rotationSpeed;
      this.animationTime = 0;

      // Delay first pulse
      if (this.nextPulseTime === 0) {
        this.nextPulseTime = 1.5 + this.getRandomPulseInterval();
      }
    }

    // Initialize bars if needed
    if (!this.freqBars.length) {
      this.freqBars = this.createFrequencyBars(this.config.numBars);
    }

    // Initialize peak values array if needed
    if (!this.peakValues || this.peakValues.length !== this.config.numBars) {
      this.peakValues = new Float32Array(this.config.numBars);
    }

    this.lastFrameTime = performance.now();
    this.isPlaying = true;
    this.animationId = requestAnimationFrame(this.draw);
  }

  /**
   * Stop the visualization animation
   */
  public stopVisualization(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    this.isPlaying = false;
    this.targetRotationSpeed = this.config.rotationSpeed;
    this.currentRotationSpeed = this.config.rotationSpeed;

    // Return to idle state if currently in audio state
    if (this.options.state === WaveformState.AUDIO) {
      this.setState(WaveformState.IDLE);
    }
  }

  /**
   * Connect to an audio track to visualize
   * @param track - MediaStreamTrack to connect (typically from microphone)
   * @returns true if successfully connected, false otherwise
   */
  public connectToAudioTrack(track: MediaStreamTrack): boolean {
    const audioCtx = this.initializeAudio();
    if (!audioCtx || !this.analyser) return false;

    try {
      audioCtx
        .resume()
        .catch((err) => console.warn("Failed to resume audio context:", err));

      // Clean up previous source
      if (this.source) {
        this.source.disconnect();
      }

      // Create media stream and audio source
      const mediaStream = new MediaStream();
      mediaStream.addTrack(track);
      this.source = audioCtx.createMediaStreamSource(mediaStream);

      // Set up processing chain and start visualization
      this.setupAudioProcessingChain(audioCtx);
      this.targetRotationSpeed = this.config.rotationSpeed;
      this.currentRotationSpeed = this.config.rotationSpeed;
      this.startVisualization();

      // Change state if not already in thinking mode
      if (this.options.state !== WaveformState.THINKING) {
        this.setState(WaveformState.AUDIO);
      }

      this.setStatus("Audio connected");
      return true;
    } catch (err) {
      console.error("Error connecting audio source:", err);
      this.setStatus(`Error connecting audio: ${(err as Error).message}`);
      return false;
    }
  }

  /**
   * Clean up resources when component is no longer needed
   */
  public dispose(): void {
    this.stopVisualization();

    // Disconnect audio
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    // Close audio context
    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    // Clear arrays to free memory
    this.frequencyData = null;
    this.prevFrameData = null;
    this.downsampledData = null;
    this.normalizedData = null;
    this.smoothedData = null;
    this.temporallySmoothedData = null;
    this.peakValues = null;
  }

  /**
   * Update visualization options
   * @param options - New options to apply
   */
  public updateOptions(options: Partial<CanvasWaveformOptions>): void {
    const prevSensitivity = this.options.sensitivity;
    const prevState = this.options.state;
    const prevRotationSpeed = this.options.rotationSpeed;
    const prevRotationBoostFactor = this.options.rotationBoostFactor;

    // Apply new options
    this.options = { ...this.options, ...options };
    this.config = this.generateConfig();

    // Update audio processing if sensitivity changed
    if (
      this.isPlaying &&
      this.options.sensitivity !== prevSensitivity &&
      this.audioContext
    ) {
      this.setupAudioProcessingChain(this.audioContext);
    }

    // Update rotation parameters if changed
    if (
      this.options.rotationSpeed !== prevRotationSpeed ||
      this.options.rotationBoostFactor !== prevRotationBoostFactor
    ) {
      this.targetRotationSpeed = this.config.rotationSpeed;
    }

    // Handle state change
    if (this.options.state !== prevState) {
      this.setState(this.options.state);
    }

    // Restart visualization if needed
    if (this.isPlaying) {
      if (prevState !== this.options.state) {
        const wasPlaying = this.isPlaying;
        this.stopVisualization();
        if (wasPlaying && this.options.state !== WaveformState.COMPLETE) {
          this.startVisualization();
        }
      }
    } else {
      this.drawInitialState();
    }
  }

  /**
   * Set visualization state
   * @param state - New state to apply
   */
  public setState(state: WaveformState): void {
    if (this.options.state === state) return;

    const prevState = this.options.state;
    this.options.state = state;

    // Reset rotation speed when changing states
    this.targetRotationSpeed = this.config.rotationSpeed;
    this.currentRotationSpeed = this.config.rotationSpeed;

    // Handle state-specific transitions
    switch (state) {
      case WaveformState.THINKING:
        // Reset pulse params but preserve bar values for smooth transition
        this.isPulsing = false;
        this.pulseProgress = 0;
        this.nextPulseTime = this.animationTime;

        // Force immediate draw if not currently animating
        if (this.ctx && !this.isPlaying) {
          this.drawThinkingState(this.ctx, this.canvas, 0);
        }
        break;

      case WaveformState.AUDIO:
        // Handle transition from thinking to audio state
        this.isPulsing = false;
        this.pulseProgress = 0;

        if (prevState === WaveformState.THINKING) {
          // Delay pulse after thinking->audio transition
          this.nextPulseTime =
            this.animationTime + this.getRandomPulseInterval() + 1.0;
        } else {
          // Standard delay for other transitions
          this.nextPulseTime = this.animationTime + 1.0;
        }

        // Resume audio context if necessary
        if (this.audioContext && !this.isPlaying) {
          this.audioContext.resume().catch(console.error);
          this.startVisualization();
        }
        break;
    }

    // Start animation if currently stopped (except for IDLE state)
    if (this.animationId === null && state !== WaveformState.IDLE) {
      this.startVisualization();
    }
  }

  /**
   * Update the canvas size
   * @param width - Optional new width (in pixels)
   * @param height - Optional new height (in pixels)
   */
  public updateCanvasSize(width?: number, height?: number): void {
    // Update dimensions if provided
    if (width !== undefined) this.options.width = width;
    if (height !== undefined) this.options.height = height;

    const size = this.getSize();
    this.dpr = window.devicePixelRatio || 1;

    // Set physical canvas size (scaled for retina displays)
    this.canvas.width = size.width * this.dpr;
    this.canvas.height = size.height * this.dpr;

    // Set CSS size
    this.canvas.style.width = `${size.width}px`;
    this.canvas.style.height = `${size.height}px`;

    // Reset scale for retina displays
    if (this.ctx) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.scale(this.dpr, this.dpr);
    }

    // Redraw if not currently animating
    if (!this.isPlaying && this.ctx) {
      this.drawInitialState();
    }
  }

  /**
   * Calculate responsive dimensions
   */
  private getSize(): { width: number; height: number } {
    if (this.options.width && this.options.height) {
      return { width: this.options.width, height: this.options.height };
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const size = Math.min(screenWidth * 0.95, screenHeight * 0.7, 400);

    return { width: size, height: size };
  }

  /**
   * Register a callback to receive status updates
   * @param callback - Function to call with status messages
   */
  public setStatusCallback(callback: (status: string) => void): void {
    this.statusCallback = callback;
  }

  /**
   * Update status
   */
  private setStatus(status: string): void {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  /**
   * Update the pulse animation for audio state
   */
  private updateAudioPulse(): void {
    const currentTime = this.animationTime;

    // Initialize pulse time if needed
    if (this.nextPulseTime === 0) {
      this.nextPulseTime = currentTime + this.getRandomPulseInterval();
    }

    if (this.isPulsing) {
      // Update progress of active pulse
      this.pulseProgress += 0.016 / this.pulseDuration;

      // Complete pulse and schedule next one
      if (this.pulseProgress >= 1) {
        this.isPulsing = false;
        this.pulseProgress = 0;
        this.nextPulseTime = currentTime + this.getRandomPulseInterval();
      }
    } else if (currentTime >= this.nextPulseTime) {
      // Start a new pulse
      this.isPulsing = true;
      this.pulseProgress = 0;
    }
  }

  /**
   * Get random interval between pulses
   */
  private getRandomPulseInterval(): number {
    return 3 + Math.random() * 5; // 3-8 second range
  }

  /**
   * Update rotation speed based on audio activity
   * @param deltaTime - Time elapsed since last frame (seconds)
   */
  private updateRotationSpeed(deltaTime: number): void {
    // Use base rotation for non-audio states
    if (this.options.state !== WaveformState.AUDIO || !this.analyser) {
      this.targetRotationSpeed = this.config.rotationSpeed;

      if (this.options.state !== WaveformState.AUDIO) {
        this.currentRotationSpeed = this.config.rotationSpeed;
        return;
      }
    }

    // Detect voice activity for audio state
    if (
      this.options.state === WaveformState.AUDIO &&
      this.analyser &&
      this.frequencyData
    ) {
      // Sample frequency data to detect activity
      let sum = 0;
      const sampleSize = Math.min(50, this.frequencyData.length);
      for (let i = 0; i < sampleSize; i++) {
        sum += this.frequencyData[i];
      }

      const avgLevel = sum / sampleSize / 255;
      const hasVoiceActivity = avgLevel >= 0.05;

      if (hasVoiceActivity) {
        // Voice detected - spin up quickly
        const activityLevel = Math.min(1.0, avgLevel * 2);
        const boostFactor = this.config.rotationBoostFactor * activityLevel;

        // Set dramatic target speed
        this.targetRotationSpeed =
          this.config.rotationSpeed * (1 + boostFactor);

        // Fast acceleration (reach target quickly)
        const accelerationRate = 10.0;
        const speedDiff = this.targetRotationSpeed - this.currentRotationSpeed;

        if (speedDiff > 0) {
          this.currentRotationSpeed +=
            speedDiff * Math.min(1, accelerationRate * deltaTime);
        }
      } else {
        // No voice - gradually slow down
        this.targetRotationSpeed = this.config.rotationSpeed;

        // Gentle deceleration based on config
        const decelerationRate = this.config.rotationDecayRate;
        const speedDiff = this.targetRotationSpeed - this.currentRotationSpeed;

        if (speedDiff < 0) {
          this.currentRotationSpeed +=
            speedDiff * Math.min(1, decelerationRate * deltaTime);
        }
      }

      // Debug logging
      if (this.options.debug && Math.random() < 0.01) {
        console.log(
          `Rotation: current=${this.currentRotationSpeed.toFixed(4)}, ` +
            `target=${this.targetRotationSpeed.toFixed(4)}, ` +
            `audio=${hasVoiceActivity ? "active" : "inactive"}`,
        );
      }
    }
  }

  /**
   * Helper method to ensure value doesn't exceed maximum bounds
   */
  private limitBarValue(
    value: number,
    maxValue: number = this.config.maxBarLength,
  ): number {
    return Math.min(value, maxValue);
  }

  /**
   * Calculate a pulse influence factor for the audio mode
   */
  private getAudioPulseInfluence(barIndex: number, barCount: number): number {
    if (!this.isPulsing || this.config.listeningPulseAmount <= 0) {
      return 0;
    }

    // Create a pulse that travels around the circle
    const normalizedPosition = barIndex / barCount;
    const pulseCenter = this.pulseProgress;

    // Calculate distance from pulse center (in circular space)
    let distance = Math.abs(normalizedPosition - pulseCenter);
    distance = Math.min(distance, 1 - distance); // Handle wrapping

    // Create a bell curve centered at the pulse
    const pulseWidth = 0.15;
    const influence = Math.max(0, 1 - Math.pow(distance / pulseWidth, 2));

    // Apply a sine wave to create a smooth pulse that rises and falls
    const pulseFactor = Math.sin(this.pulseProgress * Math.PI) * influence;

    // Add a smooth fade-in for new pulses
    const fadeInFactor = Math.min(1.0, this.pulseProgress * 4); // Fade in during first 25% of pulse

    return pulseFactor * this.config.listeningPulseAmount * fadeInFactor;
  }

  /**
   * Helper method for thinking state pulse influence calculation
   */
  private getThinkingPulseInfluence(
    barIndex: number,
    barCount: number,
  ): number {
    // Create a pulse that travels around the circle
    const normalizedPosition = barIndex / barCount;
    const pulseCenter = (this.animationTime * 0.4) % 1.0;

    // Calculate distance from pulse center (in circular space)
    let distance = Math.abs(normalizedPosition - pulseCenter);
    distance = Math.min(distance, 1 - distance); // Handle wrapping

    // Create pulse shape
    const pulseWidth = 0.12;
    const influence = Math.max(0, 1 - Math.pow(distance / pulseWidth, 2));

    // Use a controlled pulse height
    const pulseHeight = influence * this.config.maxPulseHeight * 0.35;

    return this.limitBarValue(pulseHeight);
  }
}
