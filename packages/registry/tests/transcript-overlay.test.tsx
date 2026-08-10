import type { BotOutputData, BotReadyData } from "@pipecat-ai/client-js";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  TranscriptOverlay,
  TranscriptOverlayView,
} from "@/components/pipecat/transcript-overlay";

const hooks = vi.hoisted(() => ({
  usePipecatClientTransportState: vi.fn(),
  useRTVIClientEvent: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClientTransportState: hooks.usePipecatClientTransportState,
  useRTVIClientEvent: hooks.useRTVIClientEvent,
}));

// The mock re-registers on every render, so the map always holds the
// handler with the freshest closure.
const eventHandlers = new Map<string, (payload?: unknown) => void>();

function emit(event: RTVIEvent, payload?: unknown) {
  act(() => {
    eventHandlers.get(String(event))?.(payload);
  });
}

const botReady = (version: string): BotReadyData => ({ version });
const spoken = (text: string): BotOutputData => ({ text, spoken: true });

beforeEach(() => {
  vi.clearAllMocks();
  eventHandlers.clear();
  hooks.usePipecatClientTransportState.mockReturnValue("ready");
  hooks.useRTVIClientEvent.mockImplementation(
    (event: RTVIEvent, handler: (payload?: unknown) => void) => {
      eventHandlers.set(String(event), handler);
    },
  );
});

describe("TranscriptOverlayView", () => {
  it("renders each word in its own animated span", () => {
    const { container } = render(
      <TranscriptOverlayView words={["hello", "brave", "world"]} />,
    );
    const overlay = container.querySelector('[data-slot="transcript-overlay"]');
    expect(overlay).toHaveTextContent("hello brave world");
    const spans = overlay!.querySelectorAll("span");
    expect(spans).toHaveLength(3);
    expect(spans[0]).toHaveClass("animate-in", "fade-in");
  });

  it("applies the per-word fade-in duration", () => {
    const { container } = render(
      <TranscriptOverlayView words={["hi"]} fadeInDuration={150} />,
    );
    const span = container.querySelector("span");
    expect(span).toHaveStyle({ animationDuration: "150ms" });
  });

  it("fades the whole overlay out when the turn ends", () => {
    const { container } = render(
      <TranscriptOverlayView words={["bye"]} turnEnd fadeOutDuration={500} />,
    );
    const overlay = container.querySelector('[data-slot="transcript-overlay"]');
    expect(overlay).toHaveClass("animate-out", "fade-out");
    expect(overlay).toHaveStyle({ animationDuration: "500ms" });
  });
});

describe("TranscriptOverlay", () => {
  it("renders nothing until bot speech arrives", () => {
    const { container } = render(<TranscriptOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("accumulates spoken BotOutput chunks into a caption once the bot is ready", () => {
    const { container } = render(<TranscriptOverlay />);
    emit(RTVIEvent.BotReady, botReady("1.1.0"));
    emit(RTVIEvent.BotOutput, spoken("Hello"));
    emit(RTVIEvent.BotOutput, spoken("there"));

    const overlay = container.querySelector('[data-slot="transcript-overlay"]');
    expect(overlay).toHaveTextContent("Hello there");
    expect(overlay).not.toHaveClass("animate-out");
  });

  it("ignores unspoken BotOutput", () => {
    const { container } = render(<TranscriptOverlay />);
    emit(RTVIEvent.BotReady, botReady("1.1.0"));
    emit(RTVIEvent.BotOutput, { text: "internal", spoken: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("stays hidden when the bot predates BotOutput support", () => {
    const { container } = render(<TranscriptOverlay />);
    emit(RTVIEvent.BotReady, botReady("1.0.9"));
    emit(RTVIEvent.BotOutput, spoken("Hello"));
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing while the transport is not ready", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("connected");
    const { container } = render(<TranscriptOverlay />);
    emit(RTVIEvent.BotReady, botReady("1.1.0"));
    emit(RTVIEvent.BotOutput, spoken("Hello"));
    expect(container).toBeEmptyDOMElement();
  });

  it("fades out when the bot stops speaking", () => {
    const { container } = render(<TranscriptOverlay />);
    emit(RTVIEvent.BotReady, botReady("1.1.0"));
    emit(RTVIEvent.BotOutput, spoken("Done"));
    emit(RTVIEvent.BotStoppedSpeaking);

    const overlay = container.querySelector('[data-slot="transcript-overlay"]');
    expect(overlay).toHaveClass("animate-out", "fade-out");
  });

  it("starts a fresh caption when speech resumes after a turn end", () => {
    const { container } = render(<TranscriptOverlay />);
    emit(RTVIEvent.BotReady, botReady("1.1.0"));
    emit(RTVIEvent.BotOutput, spoken("First"));
    emit(RTVIEvent.BotStoppedSpeaking);
    emit(RTVIEvent.BotOutput, spoken("Second"));

    const overlay = container.querySelector('[data-slot="transcript-overlay"]');
    expect(overlay).toHaveTextContent(/^Second$/);
    expect(overlay).not.toHaveClass("animate-out");
  });

  it("renders nothing for the local participant", () => {
    const { container } = render(<TranscriptOverlay participant="local" />);
    emit(RTVIEvent.BotReady, botReady("1.1.0"));
    emit(RTVIEvent.BotOutput, spoken("Hello"));
    expect(container).toBeEmptyDOMElement();
  });

  it("forwards view props like size to the overlay", () => {
    render(<TranscriptOverlay size="lg" className="custom-overlay" />);
    emit(RTVIEvent.BotReady, botReady("1.1.0"));
    emit(RTVIEvent.BotOutput, spoken("Hello"));
    const overlay = screen
      .getByText("Hello")
      .closest('[data-slot="transcript-overlay"]');
    expect(overlay).toHaveClass("custom-overlay");
  });
});
