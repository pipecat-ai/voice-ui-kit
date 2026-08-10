import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ConnectButton,
  ConnectButtonView,
} from "@/components/pipecat/connect-button";

const hooks = vi.hoisted(() => ({
  usePipecatClient: vi.fn(),
  usePipecatClientTransportState: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClient: hooks.usePipecatClient,
  usePipecatClientTransportState: hooks.usePipecatClientTransportState,
}));

describe("ConnectButtonView", () => {
  it("renders the default connect affordance when disconnected", () => {
    render(<ConnectButtonView />);
    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toHaveAttribute("data-slot", "connect-button");
    expect(button).toHaveAttribute("data-state", "disconnected");
    expect(button).toBeEnabled();
  });

  it("fires onConnect from idle states and onDisconnect from connected states", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    const onDisconnect = vi.fn();

    const { rerender } = render(
      <ConnectButtonView onConnect={onConnect} onDisconnect={onDisconnect} />,
    );
    await user.click(screen.getByRole("button"));
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(onDisconnect).not.toHaveBeenCalled();

    rerender(
      <ConnectButtonView
        transportState="ready"
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });

  it("disables and marks transitional states busy", () => {
    render(<ConnectButtonView transportState="connecting" />);
    const button = screen.getByRole("button", { name: "Connecting…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("offers a retry action in the error state", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<ConnectButtonView transportState="error" onConnect={onConnect} />);
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onConnect).toHaveBeenCalledTimes(1);
  });

  it("lets per-state overrides beat top-level children and default actions", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    const stateClick = vi.fn();

    render(
      <ConnectButtonView
        onConnect={onConnect}
        stateProps={{
          disconnected: { children: "Start call", onClick: stateClick },
        }}
      >
        Everywhere
      </ConnectButtonView>,
    );

    const button = screen.getByRole("button", { name: "Start call" });
    await user.click(button);
    expect(stateClick).toHaveBeenCalledTimes(1);
    expect(onConnect).not.toHaveBeenCalled();
  });

  it("uses top-level children for states without an override", () => {
    render(<ConnectButtonView>Everywhere</ConnectButtonView>);
    expect(
      screen.getByRole("button", { name: "Everywhere" }),
    ).toBeInTheDocument();
  });

  it("goes icon-only at icon sizes, promoting the label to aria-label", () => {
    render(<ConnectButtonView size="icon" />);
    const button = screen.getByRole("button", { name: "Connect" });
    expect(button).toHaveAttribute("aria-label", "Connect");
    expect(button).not.toHaveTextContent("Connect");
  });
});

describe("ConnectButton", () => {
  const client = {
    connect: vi.fn(() => Promise.resolve()),
    disconnect: vi.fn(() => Promise.resolve()),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.usePipecatClient.mockReturnValue(client);
    hooks.usePipecatClientTransportState.mockReturnValue("disconnected");
  });

  it("reflects the transport state from context", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("ready");
    render(<ConnectButton />);
    expect(screen.getByRole("button", { name: "Disconnect" })).toHaveAttribute(
      "data-state",
      "ready",
    );
  });

  it("falls back to client.connect()/client.disconnect()", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<ConnectButton />);
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(client.connect).toHaveBeenCalledTimes(1);

    hooks.usePipecatClientTransportState.mockReturnValue("connected");
    rerender(<ConnectButton />);
    await user.click(screen.getByRole("button", { name: "Disconnect" }));
    expect(client.disconnect).toHaveBeenCalledTimes(1);
  });

  it("prefers a consumer onConnect over the client fallback", async () => {
    const user = userEvent.setup();
    const onConnect = vi.fn();
    render(<ConnectButton onConnect={onConnect} />);
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(client.connect).not.toHaveBeenCalled();
  });

  it("survives a client whose connect() throws synchronously", async () => {
    const user = userEvent.setup();
    client.connect.mockImplementationOnce(() => {
      throw new Error("missing connection params");
    });
    render(<ConnectButton />);
    await user.click(screen.getByRole("button", { name: "Connect" }));
    expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
  });
});
