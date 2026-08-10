import type { BotReadyData } from "@pipecat-ai/client-js";
import { RTVIEvent } from "@pipecat-ai/client-js";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SessionInfo,
  SessionInfoView,
} from "@/components/pipecat/session-info";
import { TooltipProvider } from "@/components/ui/tooltip";

const hooks = vi.hoisted(() => ({
  usePipecatClient: vi.fn(),
  useRTVIClientEvent: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClient: hooks.usePipecatClient,
  useRTVIClientEvent: hooks.useRTVIClientEvent,
}));

const eventHandlers = new Map<string, (payload?: unknown) => void>();

/** Reads the dd value that follows the given dt label. */
function rowValue(label: string) {
  const dt = screen.getByText(label);
  return dt.nextElementSibling as HTMLElement;
}

describe("SessionInfoView", () => {
  it("renders all rows with populated values", () => {
    const { container } = render(
      <TooltipProvider>
        <SessionInfoView
          transportName="Daily"
          sessionId="session-123"
          participantId="participant-456"
          clientVersion="1.13.0"
          serverVersion="1.1.0"
        />
      </TooltipProvider>,
    );

    expect(
      container.querySelector('[data-slot="session-info"]'),
    ).toBeInTheDocument();
    expect(rowValue("Transport")).toHaveTextContent("Daily");
    expect(rowValue("Session ID")).toHaveTextContent("session-123");
    expect(rowValue("Participant ID")).toHaveTextContent("participant-456");
    expect(rowValue("RTVI Client")).toHaveTextContent("v1.13.0");
    expect(rowValue("RTVI Server")).toHaveTextContent("v1.1.0");
  });

  it("blanks missing values and defaults the transport to Unknown", () => {
    render(<SessionInfoView />);
    expect(rowValue("Transport")).toHaveTextContent("Unknown");
    expect(rowValue("Session ID")).toHaveTextContent("—");
    expect(rowValue("Participant ID")).toHaveTextContent("—");
    expect(rowValue("RTVI Client")).toHaveTextContent("—");
    expect(rowValue("RTVI Server")).toHaveTextContent("—");
  });

  it("hides rows via no* props", () => {
    render(
      <SessionInfoView
        noTransportType
        noSessionId
        noParticipantId
        noRTVIVersion
      />,
    );
    expect(screen.queryByText("Transport")).toBeNull();
    expect(screen.queryByText("Session ID")).toBeNull();
    expect(screen.queryByText("Participant ID")).toBeNull();
    expect(screen.queryByText("RTVI Client")).toBeNull();
    expect(screen.queryByText("RTVI Server")).toBeNull();
  });

  it("copies an id to the clipboard and shows the copied icon", async () => {
    const user = userEvent.setup();
    render(
      <TooltipProvider>
        <SessionInfoView sessionId="session-123" noParticipantId />
      </TooltipProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Copy to clipboard" }));
    await expect(navigator.clipboard.readText()).resolves.toBe("session-123");
  });
});

describe("SessionInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eventHandlers.clear();
    hooks.usePipecatClient.mockReturnValue(undefined);
    hooks.useRTVIClientEvent.mockImplementation(
      (event: string, handler: (payload?: unknown) => void) => {
        eventHandlers.set(String(event), handler);
      },
    );
  });

  it("shows Unknown transport and no versions without a client", () => {
    render(<SessionInfo />);
    expect(rowValue("Transport")).toHaveTextContent("Unknown");
    expect(rowValue("RTVI Client")).toHaveTextContent("—");
    expect(rowValue("RTVI Server")).toHaveTextContent("—");
  });

  it("detects a Daily transport and reports the client version", () => {
    hooks.usePipecatClient.mockReturnValue({
      transport: { dailyCallClient: {} },
      version: "1.13.0",
    });
    render(<SessionInfo />);
    expect(rowValue("Transport")).toHaveTextContent("Daily");
    expect(rowValue("RTVI Client")).toHaveTextContent("v1.13.0");
  });

  it("maps known transport service names to friendly labels", () => {
    class SmallWebRTCTransport {
      static SERVICE_NAME = "small-webrtc-transport";
    }
    hooks.usePipecatClient.mockReturnValue({
      transport: new SmallWebRTCTransport(),
      version: "1.13.0",
    });
    render(<SessionInfo />);
    expect(rowValue("Transport")).toHaveTextContent("Small WebRTC");
  });

  it("falls back to the raw service name for unknown transports", () => {
    class CustomTransport {
      static SERVICE_NAME = "my-transport";
    }
    hooks.usePipecatClient.mockReturnValue({
      transport: new CustomTransport(),
      version: "1.13.0",
    });
    render(<SessionInfo />);
    expect(rowValue("Transport")).toHaveTextContent("my-transport");
  });

  it("picks up the server version from BotReady and clears it on disconnect", () => {
    render(<SessionInfo />);

    act(() =>
      eventHandlers.get(String(RTVIEvent.BotReady))?.({
        version: "2.1.0",
      } satisfies BotReadyData),
    );
    expect(rowValue("RTVI Server")).toHaveTextContent("v2.1.0");

    act(() => eventHandlers.get(String(RTVIEvent.Disconnected))?.());
    expect(rowValue("RTVI Server")).toHaveTextContent("—");
  });

  it("forwards ids and no* props to the view", () => {
    render(
      <TooltipProvider>
        <SessionInfo sessionId="session-123" noParticipantId noRTVIVersion />
      </TooltipProvider>,
    );
    const value = rowValue("Session ID");
    expect(within(value).getByText("session-123")).toBeInTheDocument();
    expect(screen.queryByText("Participant ID")).toBeNull();
    expect(screen.queryByText("RTVI Client")).toBeNull();
  });
});
