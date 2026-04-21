import { beforeEach, describe, expect, it } from "vitest";
import { useBotAudioStore } from "@/stores/botAudioStore";

function getState() {
  return useBotAudioStore.getState();
}

describe("botAudioStore", () => {
  beforeEach(() => {
    useBotAudioStore.setState({ volume: 1 });
  });

  describe("initial state", () => {
    it("defaults volume to 1", () => {
      expect(getState().volume).toBe(1);
    });
  });

  describe("setVolume", () => {
    it("accepts values inside the [0, 1] range", () => {
      getState().setVolume(0.5);
      expect(getState().volume).toBe(0.5);

      getState().setVolume(0);
      expect(getState().volume).toBe(0);

      getState().setVolume(1);
      expect(getState().volume).toBe(1);
    });

    it("clamps values above 1 down to 1", () => {
      getState().setVolume(1.5);
      expect(getState().volume).toBe(1);

      getState().setVolume(42);
      expect(getState().volume).toBe(1);

      getState().setVolume(Number.POSITIVE_INFINITY);
      expect(getState().volume).toBe(1);
    });

    it("clamps negative values up to 0", () => {
      getState().setVolume(-0.1);
      expect(getState().volume).toBe(0);

      getState().setVolume(-100);
      expect(getState().volume).toBe(0);

      getState().setVolume(Number.NEGATIVE_INFINITY);
      expect(getState().volume).toBe(0);
    });

    it("coerces NaN to 0", () => {
      getState().setVolume(Number.NaN);
      expect(getState().volume).toBe(0);
    });

    it("is idempotent when called repeatedly with the same value", () => {
      getState().setVolume(0.3);
      getState().setVolume(0.3);
      getState().setVolume(0.3);
      expect(getState().volume).toBe(0.3);
    });

    it("lets later calls override earlier ones", () => {
      getState().setVolume(0.25);
      expect(getState().volume).toBe(0.25);
      getState().setVolume(0.75);
      expect(getState().volume).toBe(0.75);
    });
  });
});
