import { PipecatClient } from "@pipecat-ai/client-js";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Console } from "@/components/pipecat/console/console";
import { StubTransport } from "./helpers/stub-transport";

const transports = vi.hoisted(() => ({
  createTransport: vi.fn(),
  loadTransport: vi.fn(),
}));

vi.mock("@/lib/transports", () => ({
  createTransport: transports.createTransport,
  loadTransport: transports.loadTransport,
}));

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
  window.localStorage.clear();
  setViewportWidth(1024);
  transports.createTransport.mockImplementation(
    async () => new StubTransport(),
  );
  transports.loadTransport.mockResolvedValue(StubTransport);
  // The real connect awaits a bot-ready handshake that never comes in jsdom.
  vi.spyOn(PipecatClient.prototype, "connect").mockResolvedValue(
    undefined as never,
  );
  vi.spyOn(PipecatClient.prototype, "disconnect").mockResolvedValue(
    undefined as never,
  );
  vi.spyOn(PipecatClient.prototype, "initDevices").mockResolvedValue(undefined);
});

async function renderConsole(ui: React.ReactElement) {
  const utils = render(ui);
  await waitFor(() =>
    expect(
      document.querySelector("[data-slot=console][data-state=ready]"),
    ).not.toBeNull(),
  );
  return utils;
}

describe("Console", () => {
  it("shows a spinner while the client boots, then the console", async () => {
    render(<Console />);
    expect(document.querySelector("[data-slot=spinner]")).not.toBeNull();
    await waitFor(() =>
      expect(
        document.querySelector("[data-slot=console][data-state=ready]"),
      ).not.toBeNull(),
    );
    expect(document.querySelector("[data-slot=connect-button]")).not.toBeNull();
    expect(screen.getByText("Pipecat Console")).toBeInTheDocument();
  });

  it("surfaces transport load failures instead of spinning forever", async () => {
    transports.createTransport.mockRejectedValueOnce(
      new Error(
        'Failed to load transport "daily". Make sure the package is installed: npm install @pipecat-ai/daily-transport.',
      ),
    );
    render(<Console transportType="daily" />);
    await waitFor(() =>
      expect(
        screen.getByText(/npm install @pipecat-ai\/daily-transport/),
      ).toBeInTheDocument(),
    );
    expect(document.querySelector("[data-slot=spinner]")).toBeNull();
  });

  it("hides bot video by default and renders bot audio", async () => {
    await renderConsole(<Console />);
    expect(
      document.querySelector("[data-slot=console-bot-audio-panel]"),
    ).not.toBeNull();
    expect(
      document.querySelector("[data-slot=console-bot-video-panel]"),
    ).toBeNull();
  });

  it("removes regions per no* props and drops the collapse toggle without an info panel", async () => {
    await renderConsole(
      <Console
        noEvents
        noStatusInfo
        noSessionInfo
        noUserAudio
        noUserVideo
        noScreenControl
      />,
    );
    expect(
      document.querySelector("[data-slot=console-events-panel]"),
    ).toBeNull();
    expect(document.querySelector("[data-slot=console-info-panel]")).toBeNull();
    expect(screen.queryByLabelText(/info panel/i)).toBeNull();
  });

  it("renders the headerSlot when provided", async () => {
    await renderConsole(
      <Console headerSlot={<button type="button">Theme</button>} />,
    );
    expect(screen.getByRole("button", { name: "Theme" })).toBeInTheDocument();
  });

  it("shows the real session error and dismisses it", async () => {
    vi.spyOn(PipecatClient.prototype, "connect").mockRejectedValueOnce(
      new Error("bot exploded") as never,
    );
    const user = userEvent.setup();
    await renderConsole(<Console />);
    await user.click(
      document.querySelector("[data-slot=connect-button]") as HTMLElement,
    );
    await waitFor(() =>
      expect(
        screen.getByText("Failed to start session: bot exploded"),
      ).toBeInTheDocument(),
    );
    await user.click(screen.getByLabelText("Dismiss error"));
    expect(
      screen.queryByText("Failed to start session: bot exploded"),
    ).toBeNull();
  });

  it("switches to the tab layout on narrow viewports without doubling panels", async () => {
    setViewportWidth(500);
    await renderConsole(<Console />);
    expect(screen.getAllByRole("tab").length).toBeGreaterThanOrEqual(3);
    // Default tab (bot media) is mounted exactly once; inactive tabs are
    // unmounted entirely — the opposite of the old CSS-hidden double tree.
    expect(
      document.querySelectorAll("[data-slot=console-bot-audio-panel]"),
    ).toHaveLength(1);
    expect(
      document.querySelectorAll("[data-slot=console-events-panel]"),
    ).toHaveLength(0);
  });

  it("mounts the codec setter only for smallwebrtc", async () => {
    await renderConsole(<Console audioCodec="opus" />);
    await waitFor(() =>
      expect(transports.loadTransport).toHaveBeenCalledWith("smallwebrtc"),
    );

    transports.loadTransport.mockClear();
    await renderConsole(<Console transportType="websocket" />);
    expect(transports.loadTransport).not.toHaveBeenCalled();
  });
});
