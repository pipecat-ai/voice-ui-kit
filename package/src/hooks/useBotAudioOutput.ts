import { useBotAudioStore } from "@/stores/botAudioStore";

/**
 * Return shape of {@link useBotAudioOutput}.
 */
export interface UseBotAudioOutputReturn {
  /** Current bot audio output volume, 0.0 – 1.0. */
  volume: number;
  /** Set the bot audio output volume. Values are clamped to [0, 1]. */
  setVolume: (volume: number) => void;
}

/**
 * Access and update the bot's audio output state.
 *
 * Pairs with the `BotAudioOutput` component (rendered by `PipecatAppBase`)
 * and the `BotAudioControl` component. Returns the current volume and a
 * setter; any consumer can read or drive the volume without prop drilling.
 *
 * ```tsx
 * const { volume, setVolume } = useBotAudioOutput();
 * ```
 */
export const useBotAudioOutput = (): UseBotAudioOutputReturn => {
  const volume = useBotAudioStore((s) => s.volume);
  const setVolume = useBotAudioStore((s) => s.setVolume);
  return { volume, setVolume };
};
