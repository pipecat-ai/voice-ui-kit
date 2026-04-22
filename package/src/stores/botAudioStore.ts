import { create } from "zustand";

/**
 * Clamp a volume value to the valid HTMLMediaElement range [0, 1].
 */
const clampVolume = (v: number): number => {
  if (Number.isNaN(v)) return 0;
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
};

interface BotAudioState {
  /** Current bot audio output volume, 0.0 – 1.0. */
  volume: number;
  /** Set the bot audio output volume. Values are clamped to [0, 1]. */
  setVolume: (volume: number) => void;
}

/**
 * Store for bot audio output state.
 *
 * Drives the `<audio>` element rendered by `BotAudioOutput` and is read by
 * `BotAudioControl`. Kept as a module-level store so any number of control
 * instances stay in sync without prop drilling.
 *
 * Mute is intentionally not modeled here yet — see plan notes.
 */
export const useBotAudioStore = create<BotAudioState>()((set) => ({
  volume: 1,
  setVolume: (volume) => set({ volume: clampVolume(volume) }),
}));
