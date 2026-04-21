import { useBotAudioStore } from "@/stores/botAudioStore";
import { RTVIEvent } from "@pipecat-ai/client-js";
import {
  usePipecatClientMediaTrack,
  useRTVIClientEvent,
} from "@pipecat-ai/client-react";
import { useCallback, useEffect, useRef } from "react";

/**
 * Renders the bot's audio output and binds its volume to
 * {@link useBotAudioStore}.
 *
 * Functionally equivalent to `PipecatClientAudio` from
 * `@pipecat-ai/client-react` (attaches the bot's audio MediaStreamTrack to an
 * `<audio>` element and responds to `SpeakerUpdated` via `setSinkId`), with
 * the addition that `audio.volume` is driven by the bot audio store so it
 * can be controlled via `BotAudioControl` / `useBotAudioOutput`.
 *
 * Rendered by `PipecatAppBase` in place of `PipecatClientAudio` unless
 * `noAudioOutput` is set.
 */
export const BotAudioOutput: React.FC = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const botAudioTrack = usePipecatClientMediaTrack("audio", "bot");
  const volume = useBotAudioStore((s) => s.volume);

  // Attach the bot's audio track to the <audio> element, de-duping on track id
  // so we don't tear down an already-playing stream.
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !botAudioTrack) return;
    const existing = el.srcObject as MediaStream | null;
    if (existing) {
      const oldTrack = existing.getAudioTracks()[0];
      if (oldTrack && oldTrack.id === botAudioTrack.id) return;
    }
    el.srcObject = new MediaStream([botAudioTrack]);
  }, [botAudioTrack]);

  // Bind store volume to the media element.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  // Mirror PipecatClientAudio's speaker routing behavior. `setSinkId` returns
  // a Promise that can reject (unsupported deviceId, permission denied, etc.);
  // swallow and log so failures stay non-fatal and observable.
  useRTVIClientEvent(
    RTVIEvent.SpeakerUpdated,
    useCallback((speaker: MediaDeviceInfo) => {
      const el = audioRef.current;
      if (!el) return;
      if (typeof el.setSinkId !== "function") return;
      el.setSinkId(speaker.deviceId).catch((err: unknown) => {
        console.warn("BotAudioOutput: setSinkId failed", err);
      });
    }, []),
  );

  return <audio ref={audioRef} autoPlay />;
};

BotAudioOutput.displayName = "BotAudioOutput";

export default BotAudioOutput;
