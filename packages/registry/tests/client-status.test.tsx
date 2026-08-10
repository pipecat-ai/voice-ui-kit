import { RTVIEvent } from "@pipecat-ai/client-js";
import { act, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ClientStatus,
  ClientStatusValue,
} from "@/components/pipecat/client-status";

const hooks = vi.hoisted(() => ({
  usePipecatClientTransportState: vi.fn(),
  useRTVIClientEvent: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClientTransportState: hooks.usePipecatClientTransportState,
  useRTVIClientEvent: hooks.useRTVIClientEvent,
}));

const eventHandlers = new Map<string, (payload?: unknown) => void>();

/** Reads the dd value that follows the given dt label. */
function rowValue(label: string) {
  const dt = screen.getByText(label);
  return within(dt.nextElementSibling as HTMLElement).getByText(
    (content) => content.length > 0,
  );
}

describe("ClientStatusValue", () => {
  it("renders an em dash placeholder when there is no state", () => {
    render(<ClientStatusValue />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("highlights connected and ready states as active", () => {
    const { rerender } = render(<ClientStatusValue state="connected" />);
    expect(screen.getByText("connected")).toHaveClass("text-active");
    rerender(<ClientStatusValue state="ready" />);
    expect(screen.getByText("ready")).toHaveClass("text-active");
  });

  it("marks the error state destructive", () => {
    render(<ClientStatusValue state="error" />);
    expect(screen.getByText("error")).toHaveClass("text-destructive");
  });

  it("pulses and spins through the connecting lifecycle", () => {
    render(<ClientStatusValue state="connecting" />);
    const value = screen.getByText("connecting");
    expect(value).toHaveClass("animate-pulse");
    expect(value.querySelector("svg")).toHaveClass("animate-spin");
  });

  it("pulses without a spinner while initializing", () => {
    render(<ClientStatusValue state="initializing" />);
    const value = screen.getByText("initializing");
    expect(value).toHaveClass("animate-pulse");
    expect(value.querySelector("svg")).toBeNull();
  });
});

describe("ClientStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers.clear();
    hooks.usePipecatClientTransportState.mockReturnValue("disconnected");
    hooks.useRTVIClientEvent.mockImplementation(
      (event: string, handler: (payload?: unknown) => void) => {
        eventHandlers.set(String(event), handler);
      },
    );
  });

  it("renders client and agent rows from context", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("ready");
    const { container } = render(<ClientStatus />);
    expect(
      container.querySelector('[data-slot="client-status"]'),
    ).toBeInTheDocument();
    expect(rowValue("Client")).toHaveTextContent("ready");
    expect(rowValue("Agent")).toHaveTextContent("—");
  });

  it("shows the agent as connecting while the transport connects", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("connecting");
    render(<ClientStatus />);
    expect(rowValue("Client")).toHaveTextContent("connecting");
    expect(rowValue("Agent")).toHaveTextContent("connecting");
  });

  it("walks the agent through bot lifecycle events", () => {
    render(<ClientStatus />);

    act(() => eventHandlers.get(String(RTVIEvent.BotConnected))?.());
    expect(rowValue("Agent")).toHaveTextContent("connected");

    act(() => eventHandlers.get(String(RTVIEvent.BotReady))?.());
    expect(rowValue("Agent")).toHaveTextContent("ready");

    act(() => eventHandlers.get(String(RTVIEvent.BotDisconnected))?.());
    expect(rowValue("Agent")).toHaveTextContent("disconnected");
  });

  it("marks the agent disconnected when the client disconnects", () => {
    render(<ClientStatus />);
    act(() => eventHandlers.get(String(RTVIEvent.BotReady))?.());
    act(() => eventHandlers.get(String(RTVIEvent.Disconnected))?.());
    expect(rowValue("Agent")).toHaveTextContent("disconnected");
  });

  it("hides individual rows via no* props", () => {
    const { rerender } = render(<ClientStatus noAgentState />);
    expect(screen.getByText("Client")).toBeInTheDocument();
    expect(screen.queryByText("Agent")).toBeNull();

    rerender(<ClientStatus noClientState />);
    expect(screen.queryByText("Client")).toBeNull();
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });

  it("renders nothing when both rows are hidden", () => {
    const { container } = render(<ClientStatus noAgentState noClientState />);
    expect(container).toBeEmptyDOMElement();
  });
});
