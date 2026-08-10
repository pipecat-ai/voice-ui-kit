import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  DeviceDropdownContent,
  DeviceDropdownTrigger,
  DeviceDropdownView,
  DeviceSelect,
  DeviceSelectView,
} from "@/components/pipecat/device-select";
import { Button } from "@/components/ui/button";

const hooks = vi.hoisted(() => ({
  useMediaState: vi.fn(),
  usePipecatClientMediaDevices: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
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

const mics = [
  device("audioinput", "mic-1", "Built-in Mic"),
  device("audioinput", "mic-2", "AirPods Pro"),
];

describe("DeviceSelectView", () => {
  it("renders a labelled trigger with the kind placeholder", () => {
    render(<DeviceSelectView devices={mics} />);
    const trigger = screen.getByRole("combobox", {
      name: "Select a microphone",
    });
    expect(trigger).toHaveAttribute("data-slot", "device-select");
    expect(trigger).toHaveTextContent("Select a microphone");
    expect(trigger).toBeEnabled();
  });

  it("shows the selected device label, with a fallback for unlabelled devices", () => {
    const { rerender } = render(
      <DeviceSelectView devices={mics} selectedDevice={mics[1]} />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("AirPods Pro");

    rerender(
      <DeviceSelectView
        devices={mics}
        selectedDevice={device("audioinput", "abcdef123", "")}
      />,
    );
    expect(screen.getByRole("combobox")).toHaveTextContent("Microphone abcde");
  });

  it("adapts placeholder and aria-label to the device kind", () => {
    render(<DeviceSelectView kind="videoinput" />);
    expect(
      screen.getByRole("combobox", { name: "Select a camera" }),
    ).toHaveTextContent("Select a camera");
  });

  it("marks the loading state busy and lets it beat unavailableText", () => {
    render(
      <DeviceSelectView
        isLoading
        loadingText="Warming up"
        unavailableText="Mic blocked"
      />,
    );
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("data-state", "loading");
    expect(trigger).toHaveAttribute("aria-busy", "true");
    expect(trigger).toHaveTextContent("Warming up");
    expect(trigger).not.toHaveTextContent("Mic blocked");
  });

  it("renders unavailableText disabled with its own data-state", () => {
    render(<DeviceSelectView unavailableText="Microphone access blocked" />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveAttribute("data-state", "unavailable");
    expect(trigger).toHaveTextContent("Microphone access blocked");
  });

  it("reports the picked deviceId through onDeviceChange", async () => {
    const user = userEvent.setup();
    const onDeviceChange = vi.fn();
    render(
      <DeviceSelectView
        devices={mics}
        selectedDevice={mics[0]}
        onDeviceChange={onDeviceChange}
      />,
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(
      await screen.findByRole("option", { name: "AirPods Pro" }),
    );
    expect(onDeviceChange).toHaveBeenCalledWith("mic-2");
  });

  it("shows a disabled empty row when there are no devices", async () => {
    const user = userEvent.setup();
    render(<DeviceSelectView devices={[]} />);
    await user.click(screen.getByRole("combobox"));
    const empty = await screen.findByRole("option", {
      name: "No devices found",
    });
    expect(empty).toHaveAttribute("aria-disabled", "true");
  });
});

describe("DeviceDropdownView", () => {
  it("lists devices under the kind label with the selection checked", async () => {
    const user = userEvent.setup();
    render(
      <DeviceDropdownView devices={mics} selectedDevice={mics[1]}>
        <DeviceDropdownTrigger render={<Button>Microphone</Button>} />
        <DeviceDropdownContent />
      </DeviceDropdownView>,
    );

    await user.click(screen.getByRole("button", { name: "Microphone" }));
    expect(await screen.findByText("Microphones")).toBeInTheDocument();
    expect(
      screen.getByRole("menuitemcheckbox", { name: "AirPods Pro" }),
    ).toHaveAttribute("aria-checked", "true");
    expect(
      screen.getByRole("menuitemcheckbox", { name: "Built-in Mic" }),
    ).toHaveAttribute("aria-checked", "false");
  });

  it("reports the picked deviceId through onDeviceChange", async () => {
    const user = userEvent.setup();
    const onDeviceChange = vi.fn();
    render(
      <DeviceDropdownView
        devices={mics}
        selectedDevice={mics[0]}
        onDeviceChange={onDeviceChange}
      >
        <DeviceDropdownTrigger render={<Button>Microphone</Button>} />
        <DeviceDropdownContent />
      </DeviceDropdownView>,
    );

    await user.click(screen.getByRole("button", { name: "Microphone" }));
    await user.click(
      await screen.findByRole("menuitemcheckbox", { name: "AirPods Pro" }),
    );
    expect(onDeviceChange).toHaveBeenCalledWith("mic-2");
  });

  it("swaps the device list for loading and unavailable rows", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <DeviceDropdownView devices={mics} isLoading>
        <DeviceDropdownTrigger render={<Button>Microphone</Button>} />
        <DeviceDropdownContent />
      </DeviceDropdownView>,
    );

    await user.click(screen.getByRole("button", { name: "Microphone" }));
    expect(await screen.findByText("Loading devices…")).toBeInTheDocument();
    expect(screen.queryByRole("menuitemcheckbox")).not.toBeInTheDocument();

    rerender(
      <DeviceDropdownView devices={mics} unavailableText="Mic in use">
        <DeviceDropdownTrigger render={<Button>Microphone</Button>} />
        <DeviceDropdownContent />
      </DeviceDropdownView>,
    );
    expect(await screen.findByText("Mic in use")).toBeInTheDocument();
    expect(screen.queryByRole("menuitemcheckbox")).not.toBeInTheDocument();
  });
});

describe("DeviceSelect", () => {
  const media = {
    availableCams: [device("videoinput", "cam-1", "FaceTime HD")],
    availableMics: mics,
    availableSpeakers: [device("audiooutput", "spk-1", "Studio Display")],
    selectedCam: {},
    selectedMic: mics[0],
    selectedSpeaker: {},
    updateCam: vi.fn(),
    updateMic: vi.fn(),
    updateSpeaker: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.usePipecatClientMediaDevices.mockReturnValue(media);
    hooks.useMediaState.mockReturnValue({
      mic: { state: "granted" },
      cam: { state: "granted" },
    });
  });

  it("wires the client's device list, selection, and updater", async () => {
    const user = userEvent.setup();
    render(<DeviceSelect />);
    const trigger = screen.getByRole("combobox", {
      name: "Select a microphone",
    });
    expect(trigger).toHaveTextContent("Built-in Mic");

    await user.click(trigger);
    await user.click(
      await screen.findByRole("option", { name: "AirPods Pro" }),
    );
    expect(media.updateMic).toHaveBeenCalledWith("mic-2");
  });

  it("derives the loading state, with speakers riding on mic permission", () => {
    hooks.useMediaState.mockReturnValue({
      mic: { state: "initializing" },
      cam: { state: "granted" },
    });
    const { rerender } = render(<DeviceSelect kind="audiooutput" />);
    expect(screen.getByRole("combobox")).toHaveAttribute(
      "data-state",
      "loading",
    );

    // The camera kind reads cam state, which is already granted.
    rerender(<DeviceSelect kind="videoinput" />);
    expect(screen.getByRole("combobox")).not.toHaveAttribute("data-state");
  });

  it("derives a kind-specific unavailable message from device errors", () => {
    hooks.useMediaState.mockReturnValue({
      mic: { state: "granted" },
      cam: { state: "error", reason: "blocked" },
    });
    render(<DeviceSelect kind="videoinput" />);
    const trigger = screen.getByRole("combobox");
    expect(trigger).toHaveAttribute("data-state", "unavailable");
    expect(trigger).toHaveTextContent("Camera access blocked");
  });

  it("lets a consumer unavailableText replace the derived message", () => {
    hooks.useMediaState.mockReturnValue({
      mic: { state: "error", reason: "not-found" },
      cam: { state: "granted" },
    });
    render(<DeviceSelect unavailableText="Plug in a mic" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Plug in a mic");
  });
});
