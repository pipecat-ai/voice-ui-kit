import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  UserVideoControl,
  UserVideoControlView,
} from "@/components/pipecat/user-video-control";

const hooks = vi.hoisted(() => ({
  useMediaState: vi.fn(),
  usePipecatClientMediaDevices: vi.fn(),
  camToggle: { isCamEnabled: false, onClick: vi.fn() },
}));

vi.mock("@pipecat-ai/client-react", () => ({
  PipecatClientCamToggle: (props: {
    children: (args: {
      isCamEnabled: boolean;
      onClick: () => void;
    }) => React.ReactNode;
  }) => props.children(hooks.camToggle),
  PipecatClientVideo: (props: { participant?: string; trackType?: string }) => (
    <div
      data-testid="pipecat-video"
      data-participant={props.participant}
      data-track-type={props.trackType}
    />
  ),
  useMediaState: hooks.useMediaState,
  usePipecatClientMediaDevices: hooks.usePipecatClientMediaDevices,
}));

function device(
  kind: MediaDeviceKind,
  deviceId: string,
  label: string,
): MediaDeviceInfo {
  return { deviceId, groupId: "group-1", kind, label } as MediaDeviceInfo;
}

const cams = [
  device("videoinput", "cam-1", "FaceTime HD"),
  device("videoinput", "cam-2", "Logitech Brio"),
];

describe("UserVideoControlView", () => {
  it("renders a preview tile with the toggle overlaid and the video slot hidden while off", () => {
    const { container } = render(
      <UserVideoControlView video={<div data-testid="cam-video" />} />,
    );
    expect(
      container.querySelector('[data-slot="user-video-tile"]'),
    ).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Turn on camera" });
    expect(toggle).toHaveAttribute("data-state", "inactive");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByTestId("cam-video").parentElement).toHaveClass("hidden");
  });

  it("shows the video slot and flips state while the camera is on", async () => {
    const user = userEvent.setup();
    const onToggleCam = vi.fn();
    render(
      <UserVideoControlView
        isCamEnabled
        onToggleCam={onToggleCam}
        video={<div data-testid="cam-video" />}
      />,
    );
    const toggle = screen.getByRole("button", { name: "Turn off camera" });
    expect(toggle).toHaveAttribute("data-state", "active");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("cam-video").parentElement).not.toHaveClass(
      "hidden",
    );
    await user.click(toggle);
    expect(onToggleCam).toHaveBeenCalledTimes(1);
  });

  it("drops the tile with noVideo, keeping the split button", () => {
    const { container } = render(<UserVideoControlView noVideo />);
    expect(
      container.querySelector('[data-slot="user-video-tile"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="user-video-control"]'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Camera devices" }),
    ).toBeInTheDocument();
  });

  it("prefers visible state labels over the aria-label fallback", () => {
    const { rerender } = render(
      <UserVideoControlView activeText="Camera on" inactiveText="Camera off" />,
    );
    expect(
      screen.getByRole("button", { name: "Camera off" }),
    ).toBeInTheDocument();

    rerender(
      <UserVideoControlView
        isCamEnabled
        activeText="Camera on"
        inactiveText="Camera off"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Camera on" }),
    ).toBeInTheDocument();
  });

  it("disables into loading and unavailable states, dropping the picker when unavailable", () => {
    const { rerender } = render(
      <UserVideoControlView isLoading loadingText="Starting camera" />,
    );
    const loading = screen.getByRole("button", { name: "Starting camera" });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("data-state", "loading");
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("button", { name: "Camera devices" }),
    ).toBeDisabled();

    rerender(<UserVideoControlView unavailableText="Camera blocked" />);
    const unavailable = screen.getByRole("button", { name: "Camera blocked" });
    expect(unavailable).toBeDisabled();
    expect(unavailable).toHaveAttribute("data-state", "unavailable");
    expect(
      screen.queryByRole("button", { name: "Camera devices" }),
    ).not.toBeInTheDocument();
  });

  it("removes the picker with noDevicePicker", () => {
    render(<UserVideoControlView noDevicePicker />);
    expect(
      screen.queryByRole("button", { name: "Camera devices" }),
    ).not.toBeInTheDocument();
  });

  it("goes icon-only at icon sizes, promoting the label to aria-label", () => {
    render(<UserVideoControlView size="icon-sm" inactiveText="Camera off" />);
    const toggle = screen.getByRole("button", { name: "Turn on camera" });
    expect(toggle).not.toHaveTextContent("Camera off");
  });

  it("lists cameras in the picker and reports selections", async () => {
    const user = userEvent.setup();
    const onCamChange = vi.fn();
    render(
      <UserVideoControlView
        cams={cams}
        selectedCam={cams[0]}
        onCamChange={onCamChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Camera devices" }));
    expect(await screen.findByText("Cameras")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "FaceTime HD" }),
    ).toHaveAttribute("aria-checked", "true");

    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "Logitech Brio" }),
    );
    expect(onCamChange).toHaveBeenCalledWith("cam-2");
  });
});

describe("UserVideoControl", () => {
  const media = {
    availableCams: cams,
    availableMics: [],
    availableSpeakers: [],
    selectedCam: cams[0],
    selectedMic: {},
    selectedSpeaker: {},
    updateCam: vi.fn(),
    updateMic: vi.fn(),
    updateSpeaker: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.camToggle.isCamEnabled = false;
    hooks.usePipecatClientMediaDevices.mockReturnValue(media);
    hooks.useMediaState.mockReturnValue({
      mic: { state: "granted" },
      cam: { state: "granted" },
    });
  });

  it("reflects the client camera state and renders the local video preview", async () => {
    const user = userEvent.setup();
    hooks.camToggle.isCamEnabled = true;
    render(<UserVideoControl />);
    const toggle = screen.getByRole("button", { name: "Turn off camera" });
    expect(toggle).toHaveAttribute("data-state", "active");
    expect(screen.getByTestId("pipecat-video")).toHaveAttribute(
      "data-participant",
      "local",
    );
    await user.click(toggle);
    expect(hooks.camToggle.onClick).toHaveBeenCalledTimes(1);
  });

  it("wires the client camera list into the picker", async () => {
    const user = userEvent.setup();
    render(<UserVideoControl />);
    await user.click(screen.getByRole("button", { name: "Camera devices" }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "Logitech Brio" }),
    );
    expect(media.updateCam).toHaveBeenCalledWith("cam-2");
  });

  it("derives loading and error states from the client media state", () => {
    hooks.useMediaState.mockReturnValue({
      mic: { state: "granted" },
      cam: { state: "initializing" },
    });
    const { rerender } = render(<UserVideoControl loadingText="Loading" />);
    expect(screen.getByRole("button", { name: "Loading" })).toHaveAttribute(
      "data-state",
      "loading",
    );

    hooks.useMediaState.mockReturnValue({
      mic: { state: "granted" },
      cam: { state: "error", reason: "already-in-use" },
    });
    rerender(<UserVideoControl loadingText="Loading" />);
    expect(screen.getByText("Camera in use")).toBeInTheDocument();
  });

  it("lets a consumer unavailableText replace the derived message", () => {
    hooks.useMediaState.mockReturnValue({
      mic: { state: "granted" },
      cam: { state: "error", reason: "unknown" },
    });
    render(<UserVideoControl unavailableText="Check your camera" />);
    expect(screen.getByText("Check your camera")).toBeInTheDocument();
  });
});
