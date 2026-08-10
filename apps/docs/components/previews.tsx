"use client";

import { type TransportState, TransportStateEnum } from "@pipecat-ai/client-js";
import type { ConversationMessage } from "@pipecat-ai/client-react";
import {
  MaximizeIcon,
  MicIcon,
  PhoneIcon,
  PhoneOffIcon,
  VideoIcon,
  Volume2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import {
  BotAudioControlView,
  BotVolumeSliderView,
} from "@/components/pipecat/bot-audio";
import { ClientStatusValue } from "@/components/pipecat/client-status";
import {
  type ConnectButtonStateMap,
  ConnectButtonView,
} from "@/components/pipecat/connect-button";
import { ConversationView } from "@/components/pipecat/conversation";
import {
  DeviceDropdown,
  DeviceDropdownContent,
  DeviceDropdownTrigger,
  DeviceDropdownView,
  DeviceSelect,
  DeviceSelectView,
} from "@/components/pipecat/device-select";
import { DTMFKeypadView } from "@/components/pipecat/dtmf-keypad";
import { SessionInfoView } from "@/components/pipecat/session-info";
import { TextInputView } from "@/components/pipecat/text-input";
import { TranscriptOverlayView } from "@/components/pipecat/transcript-overlay";
import {
  UserAudioControl,
  UserAudioControlView,
} from "@/components/pipecat/user-audio-control";
import {
  UserScreenControl,
  UserScreenControlView,
} from "@/components/pipecat/user-screen-control";
import {
  UserVideoControl,
  UserVideoControlView,
} from "@/components/pipecat/user-video-control";
import {
  AudioVisualizerBar,
  AudioVisualizerBarView,
} from "@/components/pipecat/audio-visualizer-bar";
import {
  AudioVisualizerRadial,
  AudioVisualizerRadialView,
} from "@/components/pipecat/audio-visualizer-radial";
import {
  AudioVisualizerWave,
  AudioVisualizerWaveView,
} from "@/components/pipecat/audio-visualizer-wave";
import { Metric } from "@/components/pipecat/metric";
import { Console } from "@/components/pipecat/console/console";
import { MetricsView } from "@/components/pipecat/metrics/metrics";
import type {
  MetricCategory,
  MetricSeries,
  TokenTotals,
} from "@/hooks/use-pipecat-metrics";
import { Button } from "@/components/ui/button";

import { PipecatSandbox } from "./pipecat-sandbox";
import {
  BooleanControl,
  ColorControl,
  NumberControl,
  PreviewShell,
  SelectControl,
  TextControl,
} from "./preview-controls";

function mockDevice(
  kind: MediaDeviceKind,
  label: string,
  deviceId: string,
): MediaDeviceInfo {
  return {
    deviceId,
    groupId: "mock",
    kind,
    label,
    toJSON: () => ({ deviceId, kind, label }),
  } as MediaDeviceInfo;
}

const MICS = [
  mockDevice("audioinput", "MacBook Pro Microphone", "mic-1"),
  mockDevice("audioinput", "AirPods Pro", "mic-2"),
  mockDevice("audioinput", "Shure MV7", "mic-3"),
];
const SPEAKERS = [
  mockDevice("audiooutput", "MacBook Pro Speakers", "spk-1"),
  mockDevice("audiooutput", "AirPods Pro", "spk-2"),
];
const CAMERAS = [
  mockDevice("videoinput", "FaceTime HD Camera", "cam-1"),
  mockDevice("videoinput", "Logitech Brio", "cam-2"),
];

function FakeVideo({ label }: { label: string }) {
  return (
    <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center font-mono text-xs">
      {label}
    </div>
  );
}

const CONTROL_VARIANTS = ["outline", "default", "secondary", "ghost"] as const;
const CONTROL_SIZES = [
  "sm",
  "default",
  "lg",
  "icon-sm",
  "icon",
  "icon-lg",
] as const;

const TRANSPORT_STATES = Object.values(TransportStateEnum) as TransportState[];

export function ConnectButtonPreview() {
  const [state, setState] = useState<TransportState>("disconnected");
  const [size, setSize] = useState<(typeof CONTROL_SIZES)[number]>("default");
  const [connectLabel, setConnectLabel] = useState("Connect");
  const [disconnectLabel, setDisconnectLabel] = useState("Disconnect");
  const [customIcons, setCustomIcons] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const jumpTo = (next: TransportState) => {
    if (timer.current) clearTimeout(timer.current);
    setState(next);
  };

  const transition = (next: TransportState, final: TransportState) => {
    if (timer.current) clearTimeout(timer.current);
    setState(next);
    timer.current = setTimeout(() => setState(final), 1200);
  };

  const stateProps: ConnectButtonStateMap = {
    disconnected: {
      children: connectLabel,
      icon: customIcons ? <PhoneIcon /> : undefined,
    },
    initialized: {
      children: connectLabel,
      icon: customIcons ? <PhoneIcon /> : undefined,
    },
    connected: {
      children: disconnectLabel,
      icon: customIcons ? <PhoneOffIcon /> : undefined,
    },
    ready: {
      children: disconnectLabel,
      icon: customIcons ? <PhoneOffIcon /> : undefined,
    },
  };

  return (
    <PreviewShell
      controls={
        <>
          <SelectControl
            label="state"
            value={state}
            onValueChange={jumpTo}
            options={TRANSPORT_STATES}
          />
          <SelectControl
            label="size"
            value={size}
            onValueChange={setSize}
            options={CONTROL_SIZES}
          />
          <TextControl
            label="connect label"
            value={connectLabel}
            onChange={setConnectLabel}
          />
          <TextControl
            label="disconnect label"
            value={disconnectLabel}
            onChange={setDisconnectLabel}
          />
          <BooleanControl
            label="custom icons"
            checked={customIcons}
            onCheckedChange={setCustomIcons}
          />
        </>
      }
    >
      <div className="flex flex-col items-center gap-3">
        <ConnectButtonView
          transportState={state}
          size={size}
          stateProps={stateProps}
          onConnect={() => transition("connecting", "ready")}
          onDisconnect={() => transition("disconnecting", "disconnected")}
        />
        <span className="text-muted-foreground font-mono text-xs">{state}</span>
      </div>
    </PreviewShell>
  );
}

const AUDIO_MODES = ["toggle", "push-to-talk"] as const;

export function UserAudioControlPreview() {
  const [enabled, setEnabled] = useState(true);
  const [micId, setMicId] = useState(MICS[0]!.deviceId);
  const [speakerId, setSpeakerId] = useState(SPEAKERS[0]!.deviceId);
  const [mode, setMode] = useState<(typeof AUDIO_MODES)[number]>("toggle");
  const [pttKey, setPttKey] = useState("Backquote");
  const [pttKeyLabel, setPttKeyLabel] = useState("press [key] to talk");
  const [pttActiveOutline, setPttActiveOutline] = useState(true);
  const [activeText, setActiveText] = useState("Microphone on");
  const [inactiveText, setInactiveText] = useState("Muted");
  const [variant, setVariant] =
    useState<(typeof CONTROL_VARIANTS)[number]>("outline");
  const [size, setSize] = useState<(typeof CONTROL_SIZES)[number]>("default");
  const [noIcon, setNoIcon] = useState(false);
  const [noVisualizer, setNoVisualizer] = useState(false);
  const [noDevicePicker, setNoDevicePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const sharedProps = {
    mode,
    onModeChange: setMode,
    pttKey: pttKey || null,
    pttKeyLabel,
    pttActiveOutline,
    activeText,
    inactiveText,
    loadingText: loadingText || undefined,
    variant,
    size,
    noIcon,
    noVisualizer,
    noDevicePicker,
  };

  return (
    <PreviewShell
      connected={
        <PipecatSandbox>
          <UserAudioControl {...sharedProps} />
        </PipecatSandbox>
      }
      controls={
        <>
          <SelectControl
            label="mode"
            value={mode}
            onValueChange={setMode}
            options={AUDIO_MODES}
          />
          <TextControl
            label="pttKey"
            value={pttKey}
            onChange={setPttKey}
            placeholder="Backquote"
          />
          <TextControl
            label="pttKeyLabel"
            value={pttKeyLabel}
            onChange={setPttKeyLabel}
            placeholder="press [key] to talk"
          />
          <BooleanControl
            label="pttActiveOutline"
            checked={pttActiveOutline}
            onCheckedChange={setPttActiveOutline}
          />
          <TextControl
            label="activeText"
            value={activeText}
            onChange={setActiveText}
          />
          <TextControl
            label="inactiveText"
            value={inactiveText}
            onChange={setInactiveText}
          />
          <SelectControl
            label="variant"
            value={variant}
            onValueChange={setVariant}
            options={CONTROL_VARIANTS}
          />
          <SelectControl
            label="size"
            value={size}
            onValueChange={setSize}
            options={CONTROL_SIZES}
          />
          <BooleanControl
            label="noIcon"
            checked={noIcon}
            onCheckedChange={setNoIcon}
          />
          <BooleanControl
            label="noVisualizer"
            checked={noVisualizer}
            onCheckedChange={setNoVisualizer}
          />
          <BooleanControl
            label="noDevicePicker"
            checked={noDevicePicker}
            onCheckedChange={setNoDevicePicker}
          />
          <BooleanControl
            label="isLoading"
            checked={isLoading}
            onCheckedChange={setIsLoading}
          />
          <TextControl
            label="loadingText"
            value={loadingText}
            onChange={setLoadingText}
            placeholder="spinner only"
          />
        </>
      }
    >
      <UserAudioControlView
        isMicEnabled={enabled}
        onToggleMic={() => setEnabled((v) => !v)}
        onMicEnabledChange={setEnabled}
        isLoading={isLoading}
        {...sharedProps}
        mics={MICS}
        selectedMic={MICS.find((d) => d.deviceId === micId)}
        onMicChange={setMicId}
        speakers={SPEAKERS}
        selectedSpeaker={SPEAKERS.find((d) => d.deviceId === speakerId)}
        onSpeakerChange={setSpeakerId}
      />
    </PreviewShell>
  );
}

export function UserVideoControlPreview() {
  const [enabled, setEnabled] = useState(false);
  const [camId, setCamId] = useState(CAMERAS[0]!.deviceId);
  const [activeText, setActiveText] = useState("Camera on");
  const [inactiveText, setInactiveText] = useState("Camera off");
  const [variant, setVariant] =
    useState<(typeof CONTROL_VARIANTS)[number]>("outline");
  const [size, setSize] = useState<(typeof CONTROL_SIZES)[number]>("default");
  const [noIcon, setNoIcon] = useState(false);
  const [noVideo, setNoVideo] = useState(false);
  const [noDevicePicker, setNoDevicePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const sharedProps = {
    activeText,
    inactiveText,
    loadingText: loadingText || undefined,
    variant,
    size,
    noIcon,
    noVideo,
    noDevicePicker,
  };

  return (
    <PreviewShell
      tall
      connected={
        <PipecatSandbox enableCam>
          <div className={noVideo ? undefined : "w-96 max-w-full"}>
            <UserVideoControl {...sharedProps} />
          </div>
        </PipecatSandbox>
      }
      controls={
        <>
          <TextControl
            label="activeText"
            value={activeText}
            onChange={setActiveText}
          />
          <TextControl
            label="inactiveText"
            value={inactiveText}
            onChange={setInactiveText}
          />
          <SelectControl
            label="variant"
            value={variant}
            onValueChange={setVariant}
            options={CONTROL_VARIANTS}
          />
          <SelectControl
            label="size"
            value={size}
            onValueChange={setSize}
            options={CONTROL_SIZES}
          />
          <BooleanControl
            label="noIcon"
            checked={noIcon}
            onCheckedChange={setNoIcon}
          />
          <BooleanControl
            label="noVideo"
            checked={noVideo}
            onCheckedChange={setNoVideo}
          />
          <BooleanControl
            label="noDevicePicker"
            checked={noDevicePicker}
            onCheckedChange={setNoDevicePicker}
          />
          <BooleanControl
            label="isLoading"
            checked={isLoading}
            onCheckedChange={setIsLoading}
          />
          <TextControl
            label="loadingText"
            value={loadingText}
            onChange={setLoadingText}
            placeholder="spinner only"
          />
        </>
      }
    >
      <div className={noVideo ? undefined : "w-96 max-w-full"}>
        <UserVideoControlView
          isCamEnabled={enabled}
          onToggleCam={() => setEnabled((v) => !v)}
          isLoading={isLoading}
          {...sharedProps}
          cams={CAMERAS}
          selectedCam={CAMERAS.find((d) => d.deviceId === camId)}
          onCamChange={setCamId}
          video={<FakeVideo label="camera preview" />}
        />
      </div>
    </PreviewShell>
  );
}

export function UserScreenControlPreview() {
  const [sharing, setSharing] = useState(false);
  const [activeText, setActiveText] = useState("Stop sharing");
  const [inactiveText, setInactiveText] = useState("Share screen");
  const [variant, setVariant] =
    useState<(typeof CONTROL_VARIANTS)[number]>("outline");
  const [size, setSize] = useState<(typeof CONTROL_SIZES)[number]>("default");
  const [noIcon, setNoIcon] = useState(false);
  const [noPreview, setNoPreview] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const sharedProps = {
    activeText,
    inactiveText,
    loadingText: loadingText || undefined,
    variant,
    size,
    noIcon,
    noPreview,
  };

  return (
    <PreviewShell
      tall
      connected={
        <PipecatSandbox>
          <div className="w-96 max-w-full">
            <UserScreenControl {...sharedProps} />
          </div>
        </PipecatSandbox>
      }
      controls={
        <>
          <TextControl
            label="activeText"
            value={activeText}
            onChange={setActiveText}
          />
          <TextControl
            label="inactiveText"
            value={inactiveText}
            onChange={setInactiveText}
          />
          <SelectControl
            label="variant"
            value={variant}
            onValueChange={setVariant}
            options={CONTROL_VARIANTS}
          />
          <SelectControl
            label="size"
            value={size}
            onValueChange={setSize}
            options={CONTROL_SIZES}
          />
          <BooleanControl
            label="noIcon"
            checked={noIcon}
            onCheckedChange={setNoIcon}
          />
          <BooleanControl
            label="noPreview"
            checked={noPreview}
            onCheckedChange={setNoPreview}
          />
          <BooleanControl
            label="disabled"
            checked={disabled}
            onCheckedChange={setDisabled}
          />
          <BooleanControl
            label="isLoading"
            checked={isLoading}
            onCheckedChange={setIsLoading}
          />
          <TextControl
            label="loadingText"
            value={loadingText}
            onChange={setLoadingText}
            placeholder="spinner only"
          />
        </>
      }
    >
      <div className={sharing && !noPreview ? "w-96 max-w-full" : undefined}>
        <UserScreenControlView
          isScreenEnabled={sharing}
          onToggleScreen={() => setSharing((v) => !v)}
          disabled={disabled}
          isLoading={isLoading}
          {...sharedProps}
          video={<FakeVideo label="screen preview" />}
        />
      </div>
    </PreviewShell>
  );
}

const DEVICE_KINDS = ["audioinput", "audiooutput", "videoinput"] as const;
const KIND_DEVICES = {
  audioinput: MICS,
  audiooutput: SPEAKERS,
  videoinput: CAMERAS,
};
const KIND_GUIDE = {
  audioinput: MicIcon,
  audiooutput: Volume2Icon,
  videoinput: VideoIcon,
};

export function DeviceSelectPreview() {
  const [kind, setKind] = useState<(typeof DEVICE_KINDS)[number]>("audioinput");
  const [selectedId, setSelectedId] = useState<string>();
  const [placeholder, setPlaceholder] = useState("");
  const [guide, setGuide] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [noDevices, setNoDevices] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [blocked, setBlocked] = useState(false);

  const devices = noDevices ? [] : KIND_DEVICES[kind];
  const unavailableText = blocked
    ? `${kind === "videoinput" ? "Camera" : kind === "audiooutput" ? "Speaker" : "Microphone"} access blocked`
    : undefined;
  const selected = devices.find((d) => d.deviceId === selectedId) ?? devices[0];
  const GuideIcon = KIND_GUIDE[kind];

  return (
    <PreviewShell
      connected={
        <PipecatSandbox enableCam>
          <div className="flex w-80 max-w-full flex-col gap-3">
            <DeviceSelect kind="audioinput" className="w-full" />
            <DeviceSelect kind="audiooutput" className="w-full" />
            <DeviceSelect kind="videoinput" className="w-full" />
            <DeviceDropdown kind="audioinput">
              <DeviceDropdownTrigger
                render={
                  <Button variant="outline" className="w-full">
                    Trigger mode
                  </Button>
                }
              />
              <DeviceDropdownContent />
            </DeviceDropdown>
          </div>
        </PipecatSandbox>
      }
      controls={
        <>
          <SelectControl
            label="kind"
            value={kind}
            onValueChange={(next) => {
              setKind(next);
              setSelectedId(undefined);
            }}
            options={DEVICE_KINDS}
          />
          <TextControl
            label="placeholder"
            value={placeholder}
            onChange={setPlaceholder}
            placeholder="kind default"
          />
          <BooleanControl
            label="guide"
            checked={guide}
            onCheckedChange={setGuide}
          />
          <BooleanControl
            label="disabled"
            checked={disabled}
            onCheckedChange={setDisabled}
          />
          <BooleanControl
            label="no devices"
            checked={noDevices}
            onCheckedChange={setNoDevices}
          />
          <BooleanControl
            label="isLoading"
            checked={isLoading}
            onCheckedChange={setIsLoading}
          />
          <TextControl
            label="loadingText"
            value={loadingText}
            onChange={setLoadingText}
            placeholder="spinner only"
          />
          <BooleanControl
            label="blocked"
            checked={blocked}
            onCheckedChange={setBlocked}
          />
        </>
      }
    >
      <div className="flex flex-wrap items-center justify-center gap-4">
        <DeviceSelectView
          kind={kind}
          devices={devices}
          selectedDevice={selected}
          onDeviceChange={setSelectedId}
          placeholder={placeholder || undefined}
          guide={guide ? <GuideIcon className="size-4" /> : undefined}
          disabled={disabled}
          isLoading={isLoading}
          loadingText={loadingText || undefined}
          unavailableText={unavailableText}
        />
        <DeviceDropdownView
          kind={kind}
          devices={devices}
          selectedDevice={selected}
          onDeviceChange={setSelectedId}
          isLoading={isLoading}
          loadingText={loadingText || undefined}
          unavailableText={unavailableText}
        >
          <DeviceDropdownTrigger
            render={
              <Button variant="outline" disabled={disabled}>
                Trigger mode
              </Button>
            }
          />
          <DeviceDropdownContent />
        </DeviceDropdownView>
      </div>
    </PreviewShell>
  );
}

const BAR_ORIGINS = ["center", "bottom", "top"] as const;
const BAR_LINE_CAPS = ["round", "square"] as const;
const VIZ_STATES = ["silent", "connecting", "speaking", "thinking"] as const;

/**
 * Synthesizes a speech-like track so visualizer "speaking" demos dance
 * without needing mic permission: looped noise through a walking formant
 * bandpass (a moving energy hotspot across the bands) with a syllable
 * envelope — bursts, decays, and phrase pauses — plus occasional sibilant
 * bursts ("s" / "sh") that light the upper bands the way real speech does.
 */
function useSpeechDemoTrack(active: boolean) {
  const [track, setTrack] = useState<MediaStreamTrack | null>(null);

  useEffect(() => {
    if (!active) return;
    const ctx = new AudioContext();

    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) channel[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const formant = ctx.createBiquadFilter();
    formant.type = "bandpass";
    formant.frequency.value = 500;
    formant.Q.value = 2;
    const tilt = ctx.createBiquadFilter();
    tilt.type = "lowpass";
    tilt.frequency.value = 3200;
    const gain = ctx.createGain();
    gain.gain.value = 0;

    const sibilance = ctx.createBiquadFilter();
    sibilance.type = "bandpass";
    sibilance.frequency.value = 6000;
    sibilance.Q.value = 0.8;
    const sibGain = ctx.createGain();
    sibGain.gain.value = 0;

    const dest = ctx.createMediaStreamDestination();
    noise.connect(formant);
    formant.connect(tilt);
    tilt.connect(gain);
    gain.connect(dest);
    noise.connect(sibilance);
    sibilance.connect(sibGain);
    sibGain.connect(dest);
    noise.start();

    let stopped = false;
    let syllables = 0;
    let timer = 0;
    const speak = () => {
      if (stopped) return;
      const t = ctx.currentTime;
      formant.frequency.setTargetAtTime(250 + Math.random() * 2000, t, 0.02);
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(0.5 + Math.random() * 0.5, t + 0.04);
      gain.gain.linearRampToValueAtTime(0.05, t + 0.16 + Math.random() * 0.12);
      if (Math.random() < 0.35) {
        const st = t + 0.08 + Math.random() * 0.06;
        sibGain.gain.cancelScheduledValues(t);
        sibGain.gain.setValueAtTime(0, st);
        sibGain.gain.linearRampToValueAtTime(
          0.18 + Math.random() * 0.12,
          st + 0.03,
        );
        sibGain.gain.linearRampToValueAtTime(0, st + 0.12);
      }
      const pause = ++syllables % 7 === 0 ? 450 + Math.random() * 300 : 0;
      timer = window.setTimeout(speak, 130 + Math.random() * 120 + pause);
    };
    speak();

    setTrack(dest.stream.getAudioTracks()[0] ?? null);
    return () => {
      stopped = true;
      clearTimeout(timer);
      setTrack(null);
      noise.stop();
      void ctx.close();
    };
  }, [active]);

  return track;
}

function VizStateButtons({
  value,
  onChange,
}: {
  value: (typeof VIZ_STATES)[number];
  onChange: (state: (typeof VIZ_STATES)[number]) => void;
}) {
  return (
    <div className="flex gap-2" role="group" aria-label="Visualizer state">
      {VIZ_STATES.map((state) => (
        <Button
          key={state}
          size="sm"
          variant={value === state ? "default" : "outline"}
          aria-pressed={value === state}
          onClick={() => onChange(state)}
        >
          {state}
        </Button>
      ))}
    </div>
  );
}

export function AudioVisualizerBarPreview() {
  const [vizState, setVizState] =
    useState<(typeof VIZ_STATES)[number]>("silent");
  const demoTrack = useSpeechDemoTrack(vizState === "speaking");
  const [barCount, setBarCount] = useState(5);
  const [barWidth, setBarWidth] = useState(12);
  const [barGap, setBarGap] = useState(8);
  const [barMaxHeight, setBarMaxHeight] = useState(96);
  const [barOrigin, setBarOrigin] =
    useState<(typeof BAR_ORIGINS)[number]>("center");
  const [barLineCap, setBarLineCap] =
    useState<(typeof BAR_LINE_CAPS)[number]>("round");
  const [barSpeed, setBarSpeed] = useState(0.5);
  const [barColor, setBarColor] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");
  const [noPeaks, setNoPeaks] = useState(true);
  const [peakLineColor, setPeakLineColor] = useState("");
  const [peakLineSpeed, setPeakLineSpeed] = useState(0.2);
  const [peakLineThickness, setPeakLineThickness] = useState(2);
  const [peakOffset, setPeakOffset] = useState(0);
  const [peakFadeDuration, setPeakFadeDuration] = useState(0.8);
  const [connectingSpeed, setConnectingSpeed] = useState(3);
  const [thinkingSpeed, setThinkingSpeed] = useState(5);
  const [thinkingWaveWidth, setThinkingWaveWidth] = useState(1.5);
  const [thinkingHeight, setThinkingHeight] = useState(0.25);
  const [thinkingAlpha, setThinkingAlpha] = useState(0.5);

  const sharedProps = {
    barCount,
    barWidth,
    barGap,
    barMaxHeight,
    barOrigin,
    barLineCap,
    barSpeed,
    barColor: barColor || undefined,
    backgroundColor: backgroundColor || undefined,
    noPeaks,
    peakLineColor: peakLineColor || undefined,
    peakLineSpeed,
    peakLineThickness,
    peakOffset,
    peakFadeDuration,
    connectingSpeed,
    thinkingSpeed,
    thinkingWaveWidth,
    thinkingHeight,
    thinkingAlpha,
  };

  return (
    <PreviewShell
      tall
      connected={
        <PipecatSandbox>
          <AudioVisualizerBar participantType="local" {...sharedProps} />
        </PipecatSandbox>
      }
      controls={
        <>
          <NumberControl
            label="barCount"
            value={barCount}
            onChange={setBarCount}
            min={1}
            max={64}
          />
          <NumberControl
            label="barWidth"
            value={barWidth}
            onChange={setBarWidth}
            min={1}
            max={80}
          />
          <NumberControl
            label="barGap"
            value={barGap}
            onChange={setBarGap}
            min={0}
            max={64}
          />
          <NumberControl
            label="barMaxHeight"
            value={barMaxHeight}
            onChange={setBarMaxHeight}
            min={8}
            max={240}
          />
          <SelectControl
            label="barOrigin"
            value={barOrigin}
            onValueChange={setBarOrigin}
            options={BAR_ORIGINS}
          />
          <SelectControl
            label="barLineCap"
            value={barLineCap}
            onValueChange={setBarLineCap}
            options={BAR_LINE_CAPS}
          />
          <NumberControl
            label="barSpeed"
            value={barSpeed}
            onChange={setBarSpeed}
            min={0.05}
            max={1}
            step={0.05}
          />
          <ColorControl
            label="barColor"
            value={barColor}
            onChange={setBarColor}
            placeholder="currentColor or --var"
          />
          <ColorControl
            label="backgroundColor"
            value={backgroundColor}
            onChange={setBackgroundColor}
            placeholder="transparent"
          />
          <BooleanControl
            label="noPeaks"
            checked={noPeaks}
            onCheckedChange={setNoPeaks}
          />
          <ColorControl
            label="peakLineColor"
            value={peakLineColor}
            onChange={setPeakLineColor}
            placeholder="currentColor or --var"
          />
          <NumberControl
            label="peakLineSpeed"
            value={peakLineSpeed}
            onChange={setPeakLineSpeed}
            min={0}
            max={2}
            step={0.05}
          />
          <NumberControl
            label="peakLineThickness"
            value={peakLineThickness}
            onChange={setPeakLineThickness}
            min={1}
            max={12}
          />
          <NumberControl
            label="peakOffset"
            value={peakOffset}
            onChange={setPeakOffset}
            min={0}
            max={32}
          />
          <NumberControl
            label="peakFadeDuration"
            value={peakFadeDuration}
            onChange={setPeakFadeDuration}
            min={0}
            max={4}
            step={0.1}
          />
          <NumberControl
            label="connectingSpeed"
            value={connectingSpeed}
            onChange={setConnectingSpeed}
            min={0.5}
            max={10}
            step={0.5}
          />
          <NumberControl
            label="thinkingSpeed"
            value={thinkingSpeed}
            onChange={setThinkingSpeed}
            min={0.2}
            max={10}
            step={0.2}
          />
          <NumberControl
            label="thinkingWaveWidth"
            value={thinkingWaveWidth}
            onChange={setThinkingWaveWidth}
            min={0.2}
            max={4}
            step={0.2}
          />
          <NumberControl
            label="thinkingHeight"
            value={thinkingHeight}
            onChange={setThinkingHeight}
            min={0.1}
            max={1}
            step={0.05}
          />
          <NumberControl
            label="thinkingAlpha"
            value={thinkingAlpha}
            onChange={setThinkingAlpha}
            min={0}
            max={1}
            step={0.05}
          />
        </>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <AudioVisualizerBarView
          track={demoTrack}
          isConnecting={vizState === "connecting"}
          isThinking={vizState === "thinking"}
          {...sharedProps}
        />
        <VizStateButtons value={vizState} onChange={setVizState} />
      </div>
    </PreviewShell>
  );
}

const SLIDER_ORIENTATIONS = ["horizontal", "vertical"] as const;

export function AudioVisualizerRadialPreview() {
  const [vizState, setVizState] =
    useState<(typeof VIZ_STATES)[number]>("silent");
  const demoTrack = useSpeechDemoTrack(vizState === "speaking");
  const [barCount, setBarCount] = useState(24);
  const [barWidth, setBarWidth] = useState(0);
  const [barMaxLength, setBarMaxLength] = useState(24);
  const [radius, setRadius] = useState(32);
  const [barLineCap, setBarLineCap] =
    useState<(typeof BAR_LINE_CAPS)[number]>("round");
  const [barSpeed, setBarSpeed] = useState(0.5);
  const [restingOpacity, setRestingOpacity] = useState(0.1);
  const [rotationSpeed, setRotationSpeed] = useState(1);
  const [breathingSpeed, setBreathingSpeed] = useState(0.2);
  const [barColor, setBarColor] = useState("");
  const [accentColor, setAccentColor] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("");

  const sharedProps = {
    barCount,
    // 0 falls back to the component's circumference-based auto width.
    barWidth: barWidth || undefined,
    barMaxLength,
    radius,
    barLineCap,
    barSpeed,
    restingOpacity,
    rotationSpeed,
    breathingSpeed,
    barColor: barColor || undefined,
    accentColor: accentColor || undefined,
    backgroundColor: backgroundColor || undefined,
  };

  return (
    <PreviewShell
      tall
      connected={
        <PipecatSandbox>
          <AudioVisualizerRadial participantType="local" {...sharedProps} />
        </PipecatSandbox>
      }
      controls={
        <>
          <NumberControl
            label="barCount"
            value={barCount}
            onChange={setBarCount}
            min={4}
            max={96}
          />
          <NumberControl
            label="barWidth (0 = auto)"
            value={barWidth}
            onChange={setBarWidth}
            min={0}
            max={24}
          />
          <NumberControl
            label="barMaxLength"
            value={barMaxLength}
            onChange={setBarMaxLength}
            min={4}
            max={96}
          />
          <NumberControl
            label="radius"
            value={radius}
            onChange={setRadius}
            min={8}
            max={96}
          />
          <SelectControl
            label="barLineCap"
            value={barLineCap}
            onValueChange={setBarLineCap}
            options={BAR_LINE_CAPS}
          />
          <NumberControl
            label="barSpeed"
            value={barSpeed}
            onChange={setBarSpeed}
            min={0.05}
            max={1}
            step={0.05}
          />
          <ColorControl
            label="barColor"
            value={barColor}
            onChange={setBarColor}
            placeholder="currentColor or --var"
          />
          <ColorControl
            label="backgroundColor"
            value={backgroundColor}
            onChange={setBackgroundColor}
            placeholder="transparent"
          />
          <NumberControl
            label="restingOpacity"
            value={restingOpacity}
            onChange={setRestingOpacity}
            min={0}
            max={1}
            step={0.05}
          />
          <NumberControl
            label="rotationSpeed"
            value={rotationSpeed}
            onChange={setRotationSpeed}
            min={0.1}
            max={4}
            step={0.1}
          />
          <NumberControl
            label="breathingSpeed"
            value={breathingSpeed}
            onChange={setBreathingSpeed}
            min={0}
            max={1}
            step={0.05}
          />
          <ColorControl
            label="accentColor"
            value={accentColor}
            onChange={setAccentColor}
            placeholder="defaults to barColor"
          />
        </>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <AudioVisualizerRadialView
          track={demoTrack}
          isConnecting={vizState === "connecting"}
          isThinking={vizState === "thinking"}
          {...sharedProps}
        />
        <VizStateButtons value={vizState} onChange={setVizState} />
      </div>
    </PreviewShell>
  );
}

export function AudioVisualizerWavePreview() {
  const [vizState, setVizState] =
    useState<(typeof VIZ_STATES)[number]>("silent");
  const demoTrack = useSpeechDemoTrack(vizState === "speaking");
  const [size, setSize] = useState(224);
  const [colorShift, setColorShift] = useState(0.05);
  const [speed, setSpeed] = useState(1);
  const [amplitude, setAmplitude] = useState(1);
  const [glow, setGlow] = useState(1);
  const [softness, setSoftness] = useState(0.2);
  const [color, setColor] = useState("");

  const sharedProps = {
    size,
    colorShift,
    speed,
    amplitude,
    glow,
    softness,
    color: color || undefined,
  };

  return (
    <PreviewShell
      tall
      connected={
        <PipecatSandbox>
          <AudioVisualizerWave participantType="local" {...sharedProps} />
        </PipecatSandbox>
      }
      controls={
        <>
          <NumberControl
            label="size"
            value={size}
            onChange={setSize}
            min={96}
            max={448}
          />
          <NumberControl
            label="colorShift"
            value={colorShift}
            onChange={setColorShift}
            min={0}
            max={1}
            step={0.05}
          />
          <NumberControl
            label="speed"
            value={speed}
            onChange={setSpeed}
            min={0.1}
            max={3}
            step={0.1}
          />
          <NumberControl
            label="amplitude"
            value={amplitude}
            onChange={setAmplitude}
            min={0}
            max={2.5}
            step={0.1}
          />
          <NumberControl
            label="glow"
            value={glow}
            onChange={setGlow}
            min={0.2}
            max={3}
            step={0.1}
          />
          <NumberControl
            label="softness"
            value={softness}
            onChange={setSoftness}
            min={0.05}
            max={1}
            step={0.05}
          />
          <ColorControl
            label="color"
            value={color}
            onChange={setColor}
            placeholder="#1FD5F9 or --var"
          />
        </>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <AudioVisualizerWaveView
          track={demoTrack}
          isConnecting={vizState === "connecting"}
          isThinking={vizState === "thinking"}
          {...sharedProps}
        />
        <VizStateButtons value={vizState} onChange={setVizState} />
      </div>
    </PreviewShell>
  );
}

export function BotAudioPreview() {
  const [volume, setVolume] = useState(0.8);
  const [orientation, setOrientation] =
    useState<(typeof SLIDER_ORIENTATIONS)[number]>("horizontal");
  const [label, setLabel] = useState("Bot volume");
  const [variant, setVariant] =
    useState<(typeof CONTROL_VARIANTS)[number]>("outline");
  const [size, setSize] = useState<(typeof CONTROL_SIZES)[number]>("default");
  const [noLabel, setNoLabel] = useState(false);
  const [noPercent, setNoPercent] = useState(false);
  const [noMuteButton, setNoMuteButton] = useState(false);

  return (
    <PreviewShell
      controls={
        <>
          <SelectControl
            label="orientation"
            value={orientation}
            onValueChange={setOrientation}
            options={SLIDER_ORIENTATIONS}
          />
          <SelectControl
            label="variant"
            value={variant}
            onValueChange={setVariant}
            options={CONTROL_VARIANTS}
          />
          <SelectControl
            label="size"
            value={size}
            onValueChange={setSize}
            options={CONTROL_SIZES}
          />
          <TextControl label="label" value={label} onChange={setLabel} />
          <BooleanControl
            label="noLabel"
            checked={noLabel}
            onCheckedChange={setNoLabel}
          />
          <BooleanControl
            label="noPercent"
            checked={noPercent}
            onCheckedChange={setNoPercent}
          />
          <BooleanControl
            label="noMuteButton"
            checked={noMuteButton}
            onCheckedChange={setNoMuteButton}
          />
        </>
      }
    >
      <div className="flex flex-col items-center gap-6">
        <BotAudioControlView
          volume={volume}
          onVolumeChange={setVolume}
          label={label || undefined}
          variant={variant}
          size={size}
          sliderProps={{ orientation, noPercent, noMuteButton }}
        />
        <div className={orientation === "vertical" ? undefined : "w-64"}>
          <BotVolumeSliderView
            volume={volume}
            onVolumeChange={setVolume}
            label={label || undefined}
            orientation={orientation}
            noLabel={noLabel}
            noPercent={noPercent}
            noMuteButton={noMuteButton}
          />
        </div>
      </div>
    </PreviewShell>
  );
}

const now = Date.now();
const MESSAGES = [
  {
    role: "user",
    createdAt: new Date(now - 60_000).toISOString(),
    parts: [{ text: "Hey! What's the weather like in Amsterdam?" }],
  },
  {
    role: "function_call",
    createdAt: new Date(now - 55_000).toISOString(),
    functionCall: {
      function_name: "get_weather",
      status: "completed",
      args: { location: "Amsterdam" },
      result: { temperature: 19, conditions: "partly cloudy" },
    },
  },
  {
    role: "assistant",
    createdAt: new Date(now - 50_000).toISOString(),
    parts: [
      {
        text: {
          spoken: "It's about 19 degrees and partly cloudy. ",
          unspoken: "Perfect weather for a canal walk.",
        },
      },
    ],
  },
  {
    role: "assistant",
    createdAt: new Date(now - 5_000).toISOString(),
    parts: [],
  },
] as unknown as ConversationMessage[];

export function ConversationPreview() {
  return (
    <PreviewShell tall>
      <div className="h-80 w-full max-w-lg rounded-xl border">
        <ConversationView messages={MESSAGES} />
      </div>
    </PreviewShell>
  );
}

const BUTTON_POSITIONS = ["right", "left"] as const;

export function TextInputPreview() {
  const [multiline, setMultiline] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [placeholder, setPlaceholder] = useState("Type message…");
  const [buttonLabel, setButtonLabel] = useState("");
  const [buttonPosition, setButtonPosition] =
    useState<(typeof BUTTON_POSITIONS)[number]>("right");
  const [sent, setSent] = useState<string | null>(null);

  return (
    <PreviewShell
      controls={
        <>
          <TextControl
            label="placeholder"
            value={placeholder}
            onChange={setPlaceholder}
          />
          <TextControl
            label="buttonContent"
            value={buttonLabel}
            onChange={setButtonLabel}
            placeholder="icon"
          />
          <SelectControl
            label="buttonPosition"
            value={buttonPosition}
            onValueChange={setButtonPosition}
            options={BUTTON_POSITIONS}
          />
          <BooleanControl
            label="multiline"
            checked={multiline}
            onCheckedChange={setMultiline}
          />
          <BooleanControl
            label="disabled"
            checked={disabled}
            onCheckedChange={setDisabled}
          />
        </>
      }
    >
      <div className="flex w-96 max-w-full flex-col gap-3">
        <TextInputView
          multiline={multiline}
          disabled={disabled}
          placeholder={placeholder || undefined}
          buttonContent={buttonLabel || undefined}
          buttonPosition={buttonPosition}
          onSend={async (message) => {
            await new Promise((r) => setTimeout(r, 600));
            setSent(message);
          }}
        />
        {sent && (
          <span className="text-muted-foreground truncate font-mono text-xs">
            sent: {sent}
          </span>
        )}
      </div>
    </PreviewShell>
  );
}

const SENTENCE =
  "Hi there! I'm your voice agent — ask me anything about your account.".split(
    " ",
  );

export function TranscriptOverlayPreview() {
  const [count, setCount] = useState(1);
  const [turnEnd, setTurnEnd] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => {
        if (c >= SENTENCE.length) {
          setTurnEnd(true);
          setTimeout(() => {
            setTurnEnd(false);
            setCount(1);
          }, 2500);
          clearInterval(interval);
          return c;
        }
        return c + 1;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [turnEnd]);

  return (
    <PreviewShell>
      <div className="w-96 max-w-full">
        <TranscriptOverlayView
          words={SENTENCE.slice(0, count)}
          turnEnd={turnEnd}
        />
      </div>
    </PreviewShell>
  );
}

const STATUS_STATES = [
  "disconnected",
  "connecting",
  "connected",
  "ready",
  "error",
];

export function ClientStatusPreview() {
  return (
    <PreviewShell>
      <dl className="grid w-72 grid-cols-[1fr_2fr] items-center gap-2 text-sm">
        {STATUS_STATES.map((state) => (
          <div
            key={state}
            className="col-span-2 grid grid-cols-subgrid items-center"
          >
            <dt className="text-muted-foreground">{state}</dt>
            <dd>
              <ClientStatusValue state={state} />
            </dd>
          </div>
        ))}
      </dl>
    </PreviewShell>
  );
}

export function SessionInfoPreview() {
  return (
    <PreviewShell>
      <div className="w-96 max-w-full">
        <SessionInfoView
          transportName="Daily"
          sessionId="d3adb33f-1234-5678-9abc-def012345678"
          participantId="a1b2c3d4-5678-90ab-cdef-1234567890ab"
          clientVersion="1.13.0"
          serverVersion="1.1.0"
        />
      </div>
    </PreviewShell>
  );
}

export function DTMFKeypadPreview() {
  return (
    <PreviewShell tall>
      <div className="w-64">
        <DTMFKeypadView onSend={(seq) => console.log("send:", seq)} />
      </div>
    </PreviewShell>
  );
}

const METRIC_START = new Date("2026-01-01T10:00:00Z").getTime();

function makeMetricSeries(
  category: MetricCategory,
  processor: string,
  base: number,
  spread: number,
  count = 24,
): MetricSeries {
  const points = Array.from({ length: count }, (_, i) => ({
    time: METRIC_START + i * 4000,
    value: base + Math.abs(Math.sin(i * 1.7)) * spread,
  }));
  return {
    category,
    processor,
    latest: points[points.length - 1]!.value,
    points,
  };
}

function makeCumulativeMetricSeries(
  category: MetricCategory,
  processor: string,
  delta: number,
  count = 24,
): MetricSeries {
  let total = 0;
  const points = Array.from({ length: count }, (_, i) => {
    total += delta * (0.5 + Math.abs(Math.sin(i * 2.3)));
    return { time: METRIC_START + i * 4000, value: total };
  });
  return {
    category,
    processor,
    latest: points[points.length - 1]!.value,
    points,
  };
}

const METRICS_FIXTURE: MetricSeries[] = [
  makeMetricSeries("ttfb", "GoogleLLMService#0", 0.35, 0.4),
  makeMetricSeries("ttfb", "CartesiaTTSService#0", 0.12, 0.15),
  makeMetricSeries("ttfa", "CartesiaTTSService#0", 0.18, 0.2),
  makeMetricSeries("processing", "GoogleLLMService#0", 0.02, 0.03),
  makeMetricSeries("processing", "CartesiaTTSService#0", 0.01, 0.02),
  makeCumulativeMetricSeries("characters", "CartesiaTTSService#0", 42),
  makeCumulativeMetricSeries("stt_usage", "DeepgramSTTService#0", 3.2),
];

const METRICS_TOKENS: TokenTotals = {
  prompt: 12840,
  completion: 3956,
  total: 16796,
  cacheRead: 2048,
  reasoning: 512,
};

export function MetricPreview() {
  return (
    <PreviewShell>
      <div className="grid w-96 max-w-full grid-cols-3 gap-6">
        <Metric label="TTFB · tts" value={231.8} unit="ms" />
        <Metric label="TTFB · llm" value={512.4} unit="ms" />
        <Metric label="Processing · stt" value={48.2} unit="ms" />
        <Metric label="Prompt tokens" value={12840} />
        <Metric label="Completion tokens" value={3956} />
        <Metric label="TTFB · smart-turn" value={null} unit="ms" />
      </div>
    </PreviewShell>
  );
}

export function MetricsPreview() {
  const [allPerformance, setAllPerformance] = useState(false);
  const [noCharts, setNoCharts] = useState(false);

  const sectionProps = { noCharts };

  return (
    <PreviewShell
      tall
      controls={
        <>
          <BooleanControl
            label="all performance categories"
            checked={allPerformance}
            onCheckedChange={setAllPerformance}
          />
          <BooleanControl
            label="noCharts"
            checked={noCharts}
            onCheckedChange={setNoCharts}
          />
        </>
      }
    >
      <div className="w-2xl max-w-full">
        <MetricsView
          series={METRICS_FIXTURE}
          tokens={METRICS_TOKENS}
          performanceProps={{
            ...sectionProps,
            categories: allPerformance
              ? ["ttfb", "ttfa", "processing"]
              : ["ttfb"],
          }}
          usageProps={sectionProps}
        />
      </div>
    </PreviewShell>
  );
}

export function ConsolePreview() {
  const [open, setOpen] = useState(false);

  // The console is a full-page block, so the preview escapes the docs
  // column entirely: a portal to body with the console filling the
  // viewport, closed via a headerSlot button or Escape.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <PreviewShell tall>
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="text-muted-foreground max-w-sm text-sm">
          Opens the live console block in a fullscreen overlay. No bot is
          required — connecting without one demos the real-message error banner.
        </p>
        <Button onClick={() => setOpen(true)}>
          <MaximizeIcon /> Launch console
        </Button>
      </div>
      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Console preview"
            className="fixed inset-0 z-50 flex flex-col bg-black/50 p-3 pt-14 backdrop-blur-sm sm:p-5 sm:pt-14"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-3 right-3 shadow-md sm:right-5"
              onClick={() => setOpen(false)}
            >
              <XIcon /> Close
            </Button>
            <div className="bg-background min-h-0 flex-1 overflow-hidden rounded-xl border shadow-2xl">
              <Console
                connectParams={{ webrtcUrl: "http://localhost:7860/api/offer" }}
                initDevicesOnMount={false}
                layoutPersistenceKey="docs-console"
              />
            </div>
          </div>,
          document.body,
        )}
    </PreviewShell>
  );
}
