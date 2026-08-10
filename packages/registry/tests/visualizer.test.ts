import { describe, expect, it } from "vitest";

import {
  createVisualizerAnalyser,
  createVoiceBands,
  readBand,
  resolveVisualizerColor,
  type VisualizerBand,
} from "@/lib/visualizer";

const band = (overrides: Partial<VisualizerBand>): VisualizerBand => ({
  startBin: 0,
  endBin: 1,
  tiltBoost: 0,
  ...overrides,
});

describe("createVoiceBands", () => {
  it("produces one band per bar, spanning 200 Hz to 8 kHz", () => {
    const bands = createVoiceBands(8, 48000, 512);
    expect(bands).toHaveLength(8);
    // 200 Hz / 24 kHz nyquist over 511 bins lands on bin 4; 8 kHz on 170.
    expect(bands[0]!.startBin).toBe(4);
    expect(bands[7]!.endBin).toBe(170);
  });

  it("orders bands low to high with no reversed ranges", () => {
    const bands = createVoiceBands(16, 48000, 512);
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i]!.startBin).toBeGreaterThanOrEqual(bands[i - 1]!.startBin);
    }
    for (const b of bands) {
      expect(b.endBin).toBeGreaterThan(b.startBin);
    }
  });

  it("guarantees every band at least one bin at high band counts", () => {
    // 64 bands over only 128 bins would round many bands into zero width.
    const bands = createVoiceBands(64, 48000, 128);
    for (const b of bands) {
      expect(b.endBin).toBeGreaterThanOrEqual(b.startBin + 1);
    }
  });

  it("tilts from zero at the lowest band upward monotonically", () => {
    const bands = createVoiceBands(12, 48000, 512);
    expect(bands[0]!.tiltBoost).toBeCloseTo(0, 10);
    for (let i = 1; i < bands.length; i++) {
      expect(bands[i]!.tiltBoost).toBeGreaterThan(bands[i - 1]!.tiltBoost);
    }
  });
});

describe("readBand", () => {
  it("returns 0 for a silent spectrum, without amplifying the tilt", () => {
    const spectrum = new Uint8Array(8);
    expect(readBand(spectrum, band({ endBin: 4, tiltBoost: 30 }))).toBe(0);
  });

  it("averages the band's bins", () => {
    const spectrum = new Uint8Array([10, 20, 30, 40]);
    expect(readBand(spectrum, band({ endBin: 4 }))).toBe(25);
  });

  it("applies the full tilt boost once the signal clears the noise floor", () => {
    const spectrum = new Uint8Array([40, 40]);
    expect(readBand(spectrum, band({ endBin: 2, tiltBoost: 20 }))).toBe(60);
  });

  it("fades the tilt boost in proportionally below the floor", () => {
    const spectrum = new Uint8Array([16, 16]);
    expect(readBand(spectrum, band({ endBin: 2, tiltBoost: 20 }))).toBe(26);
  });

  it("clamps the boosted value to 255", () => {
    const spectrum = new Uint8Array([250, 250]);
    expect(readBand(spectrum, band({ endBin: 2, tiltBoost: 20 }))).toBe(255);
  });
});

describe("resolveVisualizerColor", () => {
  it("passes concrete colors through untouched", () => {
    expect(resolveVisualizerColor("tomato", null)).toBe("tomato");
    expect(resolveVisualizerColor("#1FD5F9", null)).toBe("#1FD5F9");
  });

  it("falls back to black for an empty color", () => {
    expect(resolveVisualizerColor("", null)).toBe("black");
  });

  it("resolves currentColor from the element, black without one", () => {
    const el = document.createElement("div");
    el.style.color = "rgb(10, 20, 30)";
    document.body.appendChild(el);
    expect(resolveVisualizerColor("currentColor", el)).toBe("rgb(10, 20, 30)");
    expect(resolveVisualizerColor("currentColor", null)).toBe("black");
    el.remove();
  });

  it("resolves --var names from the document root, black when undefined", () => {
    document.documentElement.style.setProperty("--viz-test", "hotpink");
    expect(resolveVisualizerColor("--viz-test", null)).toBe("hotpink");
    expect(resolveVisualizerColor("--viz-undefined", null)).toBe("black");
    document.documentElement.style.removeProperty("--viz-test");
  });
});

describe("createVisualizerAnalyser", () => {
  const track = { kind: "audio", id: "t1" } as unknown as MediaStreamTrack;

  it("configures the analyser for visualizer use", () => {
    const { analyser, dispose } = createVisualizerAnalyser(track);
    expect(analyser.fftSize).toBe(1024);
    expect(analyser.smoothingTimeConstant).toBe(0.6);
    expect(analyser.frequencyBinCount).toBe(512);
    dispose();
  });

  it("disposes without throwing, including when called twice", () => {
    const { dispose } = createVisualizerAnalyser(track);
    expect(() => {
      dispose();
      dispose();
    }).not.toThrow();
  });
});
