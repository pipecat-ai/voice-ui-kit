import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  AudioVisualizerRadial,
  AudioVisualizerRadialView,
} from "@/components/pipecat/audio-visualizer-radial";

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
    '[data-slot="audio-visualizer-radial"]',
  )!;

describe("AudioVisualizerRadialView", () => {
  it("renders a silent canvas when there is no track", () => {
    const { container } = render(<AudioVisualizerRadialView />);
    const canvas = getCanvas(container);
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe("CANVAS");
    expect(canvas).toHaveAttribute("data-state", "silent");
  });

  it("derives speaking from the track and lets overrides win in order", () => {
    const track = fakeTrack("t1");
    const { rerender, container } = render(
      <AudioVisualizerRadialView track={track} />,
    );
    expect(getCanvas(container)).toHaveAttribute("data-state", "speaking");

    rerender(<AudioVisualizerRadialView track={track} isThinking />);
    expect(getCanvas(container)).toHaveAttribute("data-state", "thinking");

    rerender(
      <AudioVisualizerRadialView track={track} isThinking isConnecting />,
    );
    expect(getCanvas(container)).toHaveAttribute("data-state", "connecting");
  });

  it("sizes a square canvas from radius, bar growth, and cap", () => {
    // side = 2 * (radius + max(barMaxLength, 0.1 * radius) + barWidth / 2).
    const { container } = render(
      <AudioVisualizerRadialView radius={40} barMaxLength={20} barWidth={8} />,
    );
    const canvas = getCanvas(container);
    expect(canvas.style.width).toBe("128px");
    expect(canvas.style.height).toBe("128px");
    // The backing store renders at 2x for crispness.
    expect(canvas.width).toBe(256);
    expect(canvas.height).toBe(256);
  });

  it("reserves room for the thinking breath when it outgrows the bars", () => {
    // growth = max(barMaxLength = 5, 10% of radius = 10), so side = 230.
    const { container } = render(
      <AudioVisualizerRadialView radius={100} barMaxLength={5} barWidth={10} />,
    );
    const canvas = getCanvas(container);
    expect(canvas.style.width).toBe("230px");
    expect(canvas.style.height).toBe("230px");
  });

  it("forwards className to the canvas", () => {
    const { container } = render(<AudioVisualizerRadialView className="viz" />);
    expect(getCanvas(container)).toHaveClass("viz");
  });

  it("starts the draw loop against the 2d context", async () => {
    const { container } = render(<AudioVisualizerRadialView />);
    const ctx = getCanvas(container).getContext("2d")!;
    await vi.waitFor(() => expect(ctx.clearRect).toHaveBeenCalled());
  });

  it("survives track changes and unmount with a live pipeline", () => {
    const { rerender, unmount, container } = render(
      <AudioVisualizerRadialView track={fakeTrack("t1")} />,
    );
    rerender(<AudioVisualizerRadialView track={fakeTrack("t2")} />);
    rerender(<AudioVisualizerRadialView track={null} />);
    expect(getCanvas(container)).toHaveAttribute("data-state", "silent");
    expect(() => unmount()).not.toThrow();
  });
});

describe("AudioVisualizerRadial", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.usePipecatClientMediaTrack.mockReturnValue(null);
  });

  it("visualizes the requested participant's audio track", () => {
    hooks.usePipecatClientMediaTrack.mockReturnValue(fakeTrack("bot-audio"));
    const { container } = render(
      <AudioVisualizerRadial participantType="bot" />,
    );
    expect(hooks.usePipecatClientMediaTrack).toHaveBeenCalledWith(
      "audio",
      "bot",
    );
    expect(getCanvas(container)).toHaveAttribute("data-state", "speaking");
  });

  it("rests silent when the participant has no track", () => {
    const { container } = render(
      <AudioVisualizerRadial participantType="local" />,
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
      <AudioVisualizerRadial participantType="bot" isConnecting />,
    );
    expect(getCanvas(container)).toHaveAttribute("data-state", "connecting");
  });
});
