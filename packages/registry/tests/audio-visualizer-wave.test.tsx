import { render } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  AudioVisualizerWave,
  AudioVisualizerWaveView,
} from "@/components/pipecat/audio-visualizer-wave";

const hooks = vi.hoisted(() => ({
  usePipecatClientMediaTrack: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClientMediaTrack: hooks.usePipecatClientMediaTrack,
}));

const fakeTrack = (id: string) =>
  ({ kind: "audio", id }) as unknown as MediaStreamTrack;

const getRoot = (container: HTMLElement) =>
  container.querySelector<HTMLDivElement>(
    '[data-slot="audio-visualizer-wave"]',
  )!;

// Motion drives infinite pulse animations through rAF; fake timers keep
// those loops parked so tests stay deterministic and leak-free.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("AudioVisualizerWaveView", () => {
  it("renders a silent aura with the shader canvas inside", () => {
    const { container } = render(<AudioVisualizerWaveView />);
    const root = getRoot(container);
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("data-state", "silent");
    expect(root.querySelector("canvas")).toBeInTheDocument();
  });

  it("sizes itself square from the size prop, 224 by default", () => {
    const { rerender, container } = render(<AudioVisualizerWaveView />);
    let root = getRoot(container);
    expect(root.style.width).toBe("224px");
    expect(root.style.height).toBe("224px");

    rerender(<AudioVisualizerWaveView size={96} />);
    root = getRoot(container);
    expect(root.style.width).toBe("96px");
    expect(root.style.height).toBe("96px");
  });

  it("derives speaking from the track and lets overrides win in order", () => {
    const track = fakeTrack("t1");
    const { rerender, container } = render(
      <AudioVisualizerWaveView track={track} />,
    );
    expect(getRoot(container)).toHaveAttribute("data-state", "speaking");

    rerender(<AudioVisualizerWaveView track={track} isThinking />);
    expect(getRoot(container)).toHaveAttribute("data-state", "thinking");

    rerender(<AudioVisualizerWaveView track={track} isThinking isConnecting />);
    expect(getRoot(container)).toHaveAttribute("data-state", "connecting");
  });

  it("forwards className to the root", () => {
    const { container } = render(<AudioVisualizerWaveView className="viz" />);
    expect(getRoot(container)).toHaveClass("viz");
  });

  it("tolerates jsdom's null WebGL context once the shader initializes", () => {
    const { container, unmount } = render(
      <AudioVisualizerWaveView isThinking />,
    );
    // The shader defers its WebGL init to a frame; run it (getContext
    // returns null here) plus a few animation ticks.
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(getRoot(container)).toHaveAttribute("data-state", "thinking");
    expect(() => unmount()).not.toThrow();
  });

  it("survives track changes back to silence", () => {
    const { rerender, container } = render(
      <AudioVisualizerWaveView track={fakeTrack("t1")} />,
    );
    rerender(<AudioVisualizerWaveView track={fakeTrack("t2")} />);
    rerender(<AudioVisualizerWaveView track={null} />);
    expect(getRoot(container)).toHaveAttribute("data-state", "silent");
  });
});

describe("AudioVisualizerWave", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.usePipecatClientMediaTrack.mockReturnValue(null);
  });

  it("visualizes the requested participant's audio track", () => {
    hooks.usePipecatClientMediaTrack.mockReturnValue(fakeTrack("bot-audio"));
    const { container } = render(<AudioVisualizerWave participantType="bot" />);
    expect(hooks.usePipecatClientMediaTrack).toHaveBeenCalledWith(
      "audio",
      "bot",
    );
    expect(getRoot(container)).toHaveAttribute("data-state", "speaking");
  });

  it("rests silent when the participant has no track", () => {
    const { container } = render(
      <AudioVisualizerWave participantType="local" />,
    );
    expect(hooks.usePipecatClientMediaTrack).toHaveBeenCalledWith(
      "audio",
      "local",
    );
    expect(getRoot(container)).toHaveAttribute("data-state", "silent");
  });

  it("forwards lifecycle overrides ahead of the live track", () => {
    hooks.usePipecatClientMediaTrack.mockReturnValue(fakeTrack("bot-audio"));
    const { container } = render(
      <AudioVisualizerWave participantType="bot" isConnecting />,
    );
    expect(getRoot(container)).toHaveAttribute("data-state", "connecting");
  });
});
