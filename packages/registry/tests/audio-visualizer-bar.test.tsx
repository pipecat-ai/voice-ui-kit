import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AudioVisualizerBar,
  AudioVisualizerBarView,
} from "@/components/pipecat/audio-visualizer-bar";

const hooks = vi.hoisted(() => ({
  usePipecatClientMediaTrack: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClientMediaTrack: hooks.usePipecatClientMediaTrack,
}));

const fakeTrack = (id: string) =>
  ({ kind: "audio", id }) as unknown as MediaStreamTrack;

const getCanvas = (container: HTMLElement) =>
  container.querySelector<HTMLCanvasElement>(
    '[data-slot="audio-visualizer-bar"]',
  )!;

describe("AudioVisualizerBarView", () => {
  it("renders a silent canvas when there is no track", () => {
    const { container } = render(<AudioVisualizerBarView />);
    const canvas = getCanvas(container);
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas).toHaveAttribute("data-state", "silent");
  });

  it("derives speaking from the track and lets overrides win in order", () => {
    const track = fakeTrack("t1");
    const { rerender, container } = render(
      <AudioVisualizerBarView track={track} />,
    );
    expect(getCanvas(container)).toHaveAttribute("data-state", "speaking");

    rerender(<AudioVisualizerBarView track={track} isThinking />);
    expect(getCanvas(container)).toHaveAttribute("data-state", "thinking");

    rerender(<AudioVisualizerBarView track={track} isThinking isConnecting />);
    expect(getCanvas(container)).toHaveAttribute("data-state", "connecting");
  });

  it("sizes the canvas from the bar geometry", () => {
    const { container } = render(
      <AudioVisualizerBarView
        barCount={4}
        barWidth={10}
        barGap={5}
        barMaxHeight={80}
      />,
    );
    const canvas = getCanvas(container);
    expect(canvas.style.width).toBe("55px");
    expect(canvas.style.height).toBe("80px");
    // The backing store renders at 2x for crispness.
    expect(canvas.width).toBe(110);
    expect(canvas.height).toBe(160);
  });

  it("pads the canvas for peak clearance when peaks are enabled", () => {
    const { container } = render(
      <AudioVisualizerBarView
        barCount={2}
        barWidth={10}
        barGap={10}
        barMaxHeight={100}
        noPeaks={false}
        peakOffset={4}
        peakLineThickness={2}
      />,
    );
    const canvas = getCanvas(container);
    expect(canvas.style.width).toBe("30px");
    expect(canvas.style.height).toBe("112px");
  });

  it("forwards className to the canvas", () => {
    const { container } = render(<AudioVisualizerBarView className="viz" />);
    expect(getCanvas(container)).toHaveClass("viz");
  });

  it("starts the draw loop against the 2d context", async () => {
    const { container } = render(<AudioVisualizerBarView />);
    const ctx = getCanvas(container).getContext("2d")!;
    await vi.waitFor(() => expect(ctx.clearRect).toHaveBeenCalled());
  });

  it("survives track changes and unmount with a live pipeline", () => {
    const { rerender, unmount, container } = render(
      <AudioVisualizerBarView track={fakeTrack("t1")} />,
    );
    rerender(<AudioVisualizerBarView track={fakeTrack("t2")} />);
    rerender(<AudioVisualizerBarView track={null} />);
    expect(getCanvas(container)).toHaveAttribute("data-state", "silent");
    expect(() => unmount()).not.toThrow();
  });
});

describe("AudioVisualizerBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.usePipecatClientMediaTrack.mockReturnValue(null);
  });

  it("visualizes the requested participant's audio track", () => {
    hooks.usePipecatClientMediaTrack.mockReturnValue(fakeTrack("bot-audio"));
    const { container } = render(<AudioVisualizerBar participantType="bot" />);
    expect(hooks.usePipecatClientMediaTrack).toHaveBeenCalledWith(
      "audio",
      "bot",
    );
    expect(getCanvas(container)).toHaveAttribute("data-state", "speaking");
  });

  it("rests silent when the participant has no track", () => {
    const { container } = render(
      <AudioVisualizerBar participantType="local" />,
    );
    expect(hooks.usePipecatClientMediaTrack).toHaveBeenCalledWith(
      "audio",
      "local",
    );
    expect(getCanvas(container)).toHaveAttribute("data-state", "silent");
  });

  it("forwards lifecycle overrides ahead of the live track", () => {
    hooks.usePipecatClientMediaTrack.mockReturnValue(fakeTrack("bot-audio"));
    const { container } = render(
      <AudioVisualizerBar participantType="bot" isThinking />,
    );
    expect(getCanvas(container)).toHaveAttribute("data-state", "thinking");
  });
});
