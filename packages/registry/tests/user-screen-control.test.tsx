import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  UserScreenControl,
  UserScreenControlView,
} from "@/components/pipecat/user-screen-control";

const hooks = vi.hoisted(() => ({
  usePipecatClientTransportState: vi.fn(),
  screenToggle: { isScreenShareEnabled: false, onClick: vi.fn() },
}));

vi.mock("@pipecat-ai/client-react", () => ({
  PipecatClientScreenShareToggle: (props: {
    children: (args: {
      isScreenShareEnabled: boolean;
      onClick: () => void;
    }) => React.ReactNode;
  }) => props.children(hooks.screenToggle),
  PipecatClientVideo: (props: { participant?: string; trackType?: string }) => (
    <div
      data-testid="pipecat-video"
      data-participant={props.participant}
      data-track-type={props.trackType}
    />
  ),
  usePipecatClientTransportState: hooks.usePipecatClientTransportState,
}));

describe("UserScreenControlView", () => {
  it("renders a neutral resting toggle without a tile", () => {
    const { container } = render(<UserScreenControlView />);
    const toggle = screen.getByRole("button", {
      name: "Start screen sharing",
    });
    expect(toggle).toHaveAttribute("data-slot", "user-screen-control");
    expect(toggle).toHaveAttribute("data-state", "inactive");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(
      container.querySelector('[data-slot="user-screen-tile"]'),
    ).not.toBeInTheDocument();
  });

  it("grows a preview tile with the video slot while sharing", () => {
    const { container } = render(
      <UserScreenControlView
        isScreenEnabled
        video={<div data-testid="screen-video" />}
      />,
    );
    expect(
      container.querySelector('[data-slot="user-screen-tile"]'),
    ).toBeInTheDocument();
    expect(screen.getByTestId("screen-video")).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Stop screen sharing" });
    expect(toggle).toHaveAttribute("data-state", "active");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("suppresses the tile with noPreview even while sharing", () => {
    const { container } = render(
      <UserScreenControlView
        isScreenEnabled
        noPreview
        video={<div data-testid="screen-video" />}
      />,
    );
    expect(
      container.querySelector('[data-slot="user-screen-tile"]'),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("screen-video")).not.toBeInTheDocument();
  });

  it("fires onToggleScreen on click and respects disabled", async () => {
    const user = userEvent.setup();
    const onToggleScreen = vi.fn();
    const { rerender } = render(
      <UserScreenControlView onToggleScreen={onToggleScreen} />,
    );
    await user.click(screen.getByRole("button"));
    expect(onToggleScreen).toHaveBeenCalledTimes(1);

    rerender(
      <UserScreenControlView onToggleScreen={onToggleScreen} disabled />,
    );
    const toggle = screen.getByRole("button");
    expect(toggle).toBeDisabled();
    await user.click(toggle);
    expect(onToggleScreen).toHaveBeenCalledTimes(1);
  });

  it("prefers visible state labels over the aria-label fallback", () => {
    const { rerender } = render(
      <UserScreenControlView
        activeText="Sharing"
        inactiveText="Share screen"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Share screen" }),
    ).toBeInTheDocument();

    rerender(
      <UserScreenControlView
        isScreenEnabled
        noPreview
        activeText="Sharing"
        inactiveText="Share screen"
      />,
    );
    expect(screen.getByRole("button", { name: "Sharing" })).toBeInTheDocument();
  });

  it("disables into loading and unavailable states, hiding the tile", () => {
    const { container, rerender } = render(
      <UserScreenControlView
        isScreenEnabled
        isLoading
        loadingText="Starting share"
        video={<div data-testid="screen-video" />}
      />,
    );
    const loading = screen.getByRole("button", { name: "Starting share" });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("data-state", "loading");
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(
      container.querySelector('[data-slot="user-screen-tile"]'),
    ).not.toBeInTheDocument();

    rerender(
      <UserScreenControlView
        isScreenEnabled
        unavailableText="Sharing not supported"
        video={<div data-testid="screen-video" />}
      />,
    );
    const unavailable = screen.getByRole("button", {
      name: "Sharing not supported",
    });
    expect(unavailable).toBeDisabled();
    expect(unavailable).toHaveAttribute("data-state", "unavailable");
    expect(
      container.querySelector('[data-slot="user-screen-tile"]'),
    ).not.toBeInTheDocument();
  });

  it("goes icon-only at icon sizes, keeping an aria-label", () => {
    render(<UserScreenControlView size="icon" inactiveText="Share screen" />);
    const toggle = screen.getByRole("button", {
      name: "Start screen sharing",
    });
    expect(toggle).not.toHaveTextContent("Share screen");
  });
});

describe("UserScreenControl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.screenToggle.isScreenShareEnabled = false;
    hooks.usePipecatClientTransportState.mockReturnValue("ready");
  });

  it("toggles sharing through the client while connected", async () => {
    const user = userEvent.setup();
    render(<UserScreenControl />);
    const toggle = screen.getByRole("button", {
      name: "Start screen sharing",
    });
    expect(toggle).toBeEnabled();
    await user.click(toggle);
    expect(hooks.screenToggle.onClick).toHaveBeenCalledTimes(1);
  });

  it("stays disabled until the transport is connected", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("disconnected");
    const { rerender } = render(<UserScreenControl />);
    expect(screen.getByRole("button")).toBeDisabled();

    hooks.usePipecatClientTransportState.mockReturnValue("connected");
    rerender(<UserScreenControl />);
    expect(screen.getByRole("button")).toBeEnabled();
  });

  it("previews the local screenVideo track while sharing", () => {
    hooks.screenToggle.isScreenShareEnabled = true;
    const { container } = render(<UserScreenControl />);
    expect(
      container.querySelector('[data-slot="user-screen-tile"]'),
    ).toBeInTheDocument();
    const video = screen.getByTestId("pipecat-video");
    expect(video).toHaveAttribute("data-participant", "local");
    expect(video).toHaveAttribute("data-track-type", "screenVideo");
    expect(
      screen.getByRole("button", { name: "Stop screen sharing" }),
    ).toBeInTheDocument();
  });
});
