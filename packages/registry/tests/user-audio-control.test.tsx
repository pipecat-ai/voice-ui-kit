import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  UserAudioControl,
  UserAudioControlView,
  type UserAudioControlViewProps,
} from "@/components/pipecat/user-audio-control";

const hooks = vi.hoisted(() => ({
  useMediaState: vi.fn(),
  usePipecatClient: vi.fn(),
  usePipecatClientMediaTrack: vi.fn(),
  usePipecatClientMediaDevices: vi.fn(),
  micToggle: { isMicEnabled: false, onClick: vi.fn() },
}));

vi.mock("@pipecat-ai/client-react", () => ({
  PipecatClientMicToggle: (props: {
    children: (args: {
      isMicEnabled: boolean;
      onClick: () => void;
    }) => React.ReactNode;
  }) => props.children(hooks.micToggle),
  useMediaState: hooks.useMediaState,
  usePipecatClient: hooks.usePipecatClient,
  usePipecatClientMediaTrack: hooks.usePipecatClientMediaTrack,
  usePipecatClientMediaDevices: hooks.usePipecatClientMediaDevices,
}));

function device(
  kind: MediaDeviceKind,
  deviceId: string,
  label: string,
): MediaDeviceInfo {
  return { deviceId, groupId: "group-1", kind, label } as MediaDeviceInfo;
}

const mics = [
  device("audioinput", "mic-1", "Built-in Mic"),
  device("audioinput", "mic-2", "AirPods Pro"),
];
const speakers = [device("audiooutput", "spk-1", "Studio Display")];

/** Controlled harness so push-to-talk presses feed back into isMicEnabled. */
function PttHarness(props: Partial<UserAudioControlViewProps>) {
  const [enabled, setEnabled] = useState(false);
  return (
    <UserAudioControlView
      mode="push-to-talk"
      debounceMs={10}
      isMicEnabled={enabled}
      onMicEnabledChange={setEnabled}
      {...props}
    />
  );
}

describe("UserAudioControlView", () => {
  it("renders a muted toggle and a device picker trigger by default", () => {
    const { container } = render(<UserAudioControlView />);
    expect(
      container.querySelector('[data-slot="user-audio-control"]'),
    ).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Unmute microphone" });
    expect(toggle).toHaveAttribute("data-state", "inactive");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Audio devices" }),
    ).toBeInTheDocument();
  });

  it("flips state, labels, and aria-pressed when the mic is live", async () => {
    const user = userEvent.setup();
    const onToggleMic = vi.fn();
    render(
      <UserAudioControlView
        isMicEnabled
        onToggleMic={onToggleMic}
        activeText="Live"
        inactiveText="Muted"
      />,
    );
    const toggle = screen.getByRole("button", { name: "Live" });
    expect(toggle).toHaveAttribute("data-state", "active");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    await user.click(toggle);
    expect(onToggleMic).toHaveBeenCalledTimes(1);
  });

  it("disables into loading and unavailable states, dropping the picker when unavailable", () => {
    const { rerender } = render(
      <UserAudioControlView isLoading loadingText="Starting mic" />,
    );
    const loading = screen.getByRole("button", { name: "Starting mic" });
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("data-state", "loading");
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(
      screen.getByRole("button", { name: "Audio devices" }),
    ).toBeDisabled();

    rerender(<UserAudioControlView unavailableText="Microphone blocked" />);
    const unavailable = screen.getByRole("button", {
      name: "Microphone blocked",
    });
    expect(unavailable).toBeDisabled();
    expect(unavailable).toHaveAttribute("data-state", "unavailable");
    expect(
      screen.queryByRole("button", { name: "Audio devices" }),
    ).not.toBeInTheDocument();
  });

  it("removes the picker via noDevicePicker or hiding both sections", () => {
    const { rerender } = render(<UserAudioControlView noDevicePicker />);
    expect(
      screen.queryByRole("button", { name: "Audio devices" }),
    ).not.toBeInTheDocument();

    rerender(<UserAudioControlView noMicrophones noSpeakers />);
    expect(
      screen.queryByRole("button", { name: "Audio devices" }),
    ).not.toBeInTheDocument();
  });

  it("goes icon-only at icon sizes, hiding label text and the visualizer", () => {
    const { rerender } = render(
      <UserAudioControlView inactiveText="Muted" size="default" />,
    );
    let toggle = screen.getByRole("button", { name: "Muted" });
    expect(toggle.querySelector("canvas")).toBeInTheDocument();

    rerender(<UserAudioControlView inactiveText="Muted" size="icon" />);
    toggle = screen.getByRole("button", { name: "Unmute microphone" });
    expect(toggle).not.toHaveTextContent("Muted");
    expect(toggle.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("hides the visualizer with noVisualizer", () => {
    render(<UserAudioControlView noVisualizer />);
    const toggle = screen.getByRole("button", { name: "Unmute microphone" });
    expect(toggle.querySelector("canvas")).not.toBeInTheDocument();
  });

  it("lists mics and speakers in the picker and reports selections", async () => {
    const user = userEvent.setup();
    const onMicChange = vi.fn();
    const onSpeakerChange = vi.fn();
    render(
      <UserAudioControlView
        mics={mics}
        selectedMic={mics[0]}
        onMicChange={onMicChange}
        speakers={speakers}
        selectedSpeaker={speakers[0]}
        onSpeakerChange={onSpeakerChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Audio devices" }));
    expect(await screen.findByText("Microphones")).toBeInTheDocument();
    expect(screen.getByText("Speakers")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Built-in Mic" }),
    ).toHaveAttribute("aria-checked", "true");

    await user.click(
      screen.getByRole("menuitemcheckbox", { name: "AirPods Pro" }),
    );
    expect(onMicChange).toHaveBeenCalledWith("mic-2");
    expect(onSpeakerChange).not.toHaveBeenCalled();
  });

  it("offers a push-to-talk switch in the picker only when onModeChange is wired", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    const { rerender } = render(
      <UserAudioControlView mics={mics} onModeChange={onModeChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Audio devices" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /Push to talk/ }),
    );
    expect(onModeChange).toHaveBeenCalledWith("push-to-talk");

    rerender(<UserAudioControlView mics={mics} />);
    await user.click(screen.getByRole("button", { name: "Audio devices" }));
    expect(
      screen.queryByRole("menuitem", { name: /Push to talk/ }),
    ).not.toBeInTheDocument();
  });

  it("advertises the push-to-talk hotkey on the toggle", () => {
    render(<UserAudioControlView mode="push-to-talk" />);
    const toggle = screen.getByRole("button", { name: "Hold to talk" });
    expect(toggle).toHaveAttribute("data-mode", "push-to-talk");
    expect(toggle).toHaveAttribute("aria-keyshortcuts", "`");
    expect(toggle).toHaveTextContent("press ` to talk");
  });

  it("opens the mic on pointer hold and re-mutes after the debounced release", async () => {
    const onPttOn = vi.fn();
    const onPttOff = vi.fn();
    render(<PttHarness onPttOn={onPttOn} onPttOff={onPttOff} />);
    const toggle = screen.getByRole("button", { name: "Hold to talk" });

    fireEvent.pointerDown(toggle, { button: 0 });
    expect(toggle).toHaveAttribute("data-state", "active");
    expect(onPttOn).toHaveBeenCalledTimes(1);

    fireEvent.pointerUp(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute("data-state", "inactive");
    });
    expect(onPttOff).toHaveBeenCalledTimes(1);
  });

  it("claims the global hotkey but yields to text fields", async () => {
    render(
      <>
        <PttHarness />
        <input aria-label="Chat" />
      </>,
    );
    const toggle = screen.getByRole("button", { name: "Hold to talk" });

    const input = screen.getByRole("textbox", { name: "Chat" });
    input.focus();
    fireEvent.keyDown(input, { code: "Backquote" });
    expect(toggle).toHaveAttribute("data-state", "inactive");
    fireEvent.keyUp(input, { code: "Backquote" });

    input.blur();
    fireEvent.keyDown(window, { code: "Backquote" });
    expect(toggle).toHaveAttribute("data-state", "active");
    fireEvent.keyUp(window, { code: "Backquote" });
    await waitFor(() => {
      expect(toggle).toHaveAttribute("data-state", "inactive");
    });
  });
});

describe("UserAudioControl", () => {
  const client = { enableMic: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.micToggle.isMicEnabled = false;
    hooks.usePipecatClient.mockReturnValue(client);
    hooks.usePipecatClientMediaTrack.mockReturnValue(null);
    hooks.usePipecatClientMediaDevices.mockReturnValue({
      availableCams: [],
      availableMics: mics,
      availableSpeakers: speakers,
      selectedCam: {},
      selectedMic: mics[0],
      selectedSpeaker: speakers[0],
      updateCam: vi.fn(),
      updateMic: vi.fn(),
      updateSpeaker: vi.fn(),
    });
    hooks.useMediaState.mockReturnValue({
      mic: { state: "granted" },
      cam: { state: "granted" },
    });
  });

  it("reflects the client mic state and toggles through the client", async () => {
    const user = userEvent.setup();
    hooks.micToggle.isMicEnabled = true;
    render(<UserAudioControl />);
    const toggle = screen.getByRole("button", { name: "Mute microphone" });
    expect(toggle).toHaveAttribute("data-state", "active");
    await user.click(toggle);
    expect(hooks.micToggle.onClick).toHaveBeenCalledTimes(1);
  });

  it("derives loading and error states from the client media state", () => {
    hooks.useMediaState.mockReturnValue({
      mic: { state: "initializing" },
      cam: { state: "granted" },
    });
    const { rerender } = render(<UserAudioControl loadingText="Loading" />);
    expect(screen.getByRole("button", { name: "Loading" })).toHaveAttribute(
      "data-state",
      "loading",
    );

    hooks.useMediaState.mockReturnValue({
      mic: { state: "error", reason: "blocked" },
      cam: { state: "granted" },
    });
    rerender(<UserAudioControl loadingText="Loading" />);
    expect(screen.getByText("Microphone blocked")).toBeInTheDocument();
  });

  it("drives client.enableMic for push-to-talk holds", async () => {
    render(<UserAudioControl defaultMode="push-to-talk" debounceMs={10} />);
    const toggle = screen.getByRole("button", { name: "Hold to talk" });

    fireEvent.pointerDown(toggle, { button: 0 });
    expect(client.enableMic).toHaveBeenCalledWith(true);
  });

  it("flips the interaction mode from the device dropdown when uncontrolled", async () => {
    const user = userEvent.setup();
    const onModeChange = vi.fn();
    render(<UserAudioControl onModeChange={onModeChange} />);

    await user.click(screen.getByRole("button", { name: "Audio devices" }));
    await user.click(
      await screen.findByRole("menuitem", { name: /Push to talk/ }),
    );
    expect(onModeChange).toHaveBeenCalledWith("push-to-talk");
    expect(
      screen.getByRole("button", { name: "Hold to talk" }),
    ).toHaveAttribute("data-mode", "push-to-talk");
  });
});
