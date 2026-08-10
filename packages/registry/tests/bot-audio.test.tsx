import { RTVIEvent } from "@pipecat-ai/client-js";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  BotAudioControl,
  BotAudioControlView,
  BotAudioOutput,
  BotVolumeSlider,
  BotVolumeSliderView,
  useBotAudio,
} from "@/components/pipecat/bot-audio";

const hooks = vi.hoisted(() => ({
  usePipecatClientMediaTrack: vi.fn(),
  usePipecatClientTransportState: vi.fn(),
  useRTVIClientEvent: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  usePipecatClientMediaTrack: hooks.usePipecatClientMediaTrack,
  usePipecatClientTransportState: hooks.usePipecatClientTransportState,
  useRTVIClientEvent: hooks.useRTVIClientEvent,
}));

const eventHandlers = new Map<string, (payload?: unknown) => void>();

function fakeTrack(id: string): MediaStreamTrack {
  return { kind: "audio", id } as unknown as MediaStreamTrack;
}

beforeEach(() => {
  vi.clearAllMocks();
  eventHandlers.clear();
  // The volume store is module-level; reset it between tests.
  useBotAudio.setState({ volume: 1 });
  hooks.usePipecatClientMediaTrack.mockReturnValue(null);
  hooks.usePipecatClientTransportState.mockReturnValue("ready");
  hooks.useRTVIClientEvent.mockImplementation(
    (event: RTVIEvent, handler: (payload?: unknown) => void) => {
      eventHandlers.set(String(event), handler);
    },
  );
});

describe("BotAudioOutput", () => {
  it("attaches the bot audio track to the audio element via srcObject", () => {
    const track = fakeTrack("t1");
    hooks.usePipecatClientMediaTrack.mockReturnValue(track);

    const { container } = render(<BotAudioOutput />);
    expect(hooks.usePipecatClientMediaTrack).toHaveBeenCalledWith(
      "audio",
      "bot",
    );

    const audio = container.querySelector("audio")!;
    expect(audio).toHaveAttribute("autoplay");
    const stream = audio.srcObject as MediaStream;
    expect(stream).toBeInstanceOf(MediaStream);
    expect(stream.getAudioTracks()).toEqual([track]);
  });

  it("leaves srcObject unset while there is no bot track", () => {
    const { container } = render(<BotAudioOutput />);
    expect(container.querySelector("audio")!.srcObject).toBeNull();
  });

  it("keeps the existing stream when the same track id reappears, replaces it for a new id", () => {
    hooks.usePipecatClientMediaTrack.mockReturnValue(fakeTrack("t1"));
    const { container, rerender } = render(<BotAudioOutput />);
    const audio = container.querySelector("audio")!;
    const firstStream = audio.srcObject;

    hooks.usePipecatClientMediaTrack.mockReturnValue(fakeTrack("t1"));
    rerender(<BotAudioOutput />);
    expect(audio.srcObject).toBe(firstStream);

    hooks.usePipecatClientMediaTrack.mockReturnValue(fakeTrack("t2"));
    rerender(<BotAudioOutput />);
    expect(audio.srcObject).not.toBe(firstStream);
    expect((audio.srcObject as MediaStream).getAudioTracks()[0]?.id).toBe("t2");
  });

  it("drives the element volume from the useBotAudio store", () => {
    const { container } = render(<BotAudioOutput />);
    const audio = container.querySelector("audio")!;
    expect(audio.volume).toBe(1);

    act(() => useBotAudio.getState().setVolume(0.25));
    expect(audio.volume).toBe(0.25);
  });

  it("clamps store volume to the [0, 1] range", () => {
    act(() => useBotAudio.getState().setVolume(1.5));
    expect(useBotAudio.getState().volume).toBe(1);
    act(() => useBotAudio.getState().setVolume(-0.5));
    expect(useBotAudio.getState().volume).toBe(0);
  });

  it("routes output to the updated speaker via setSinkId, swallowing failures", async () => {
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { container } = render(<BotAudioOutput />);
    const audio = container.querySelector("audio") as HTMLAudioElement & {
      setSinkId: (deviceId: string) => Promise<void>;
    };
    const setSinkId = vi.fn(() => Promise.resolve());
    audio.setSinkId = setSinkId;

    act(() => {
      eventHandlers.get(String(RTVIEvent.SpeakerUpdated))?.({
        deviceId: "spk-1",
      } as MediaDeviceInfo);
    });
    expect(setSinkId).toHaveBeenCalledWith("spk-1");

    setSinkId.mockImplementationOnce(() => Promise.reject(new Error("nope")));
    act(() => {
      eventHandlers.get(String(RTVIEvent.SpeakerUpdated))?.({
        deviceId: "spk-2",
      } as MediaDeviceInfo);
    });
    await waitFor(() => expect(consoleWarn).toHaveBeenCalled());
    consoleWarn.mockRestore();
  });
});

describe("BotVolumeSliderView", () => {
  it("renders label, slider, mute toggle, and percent readout", () => {
    render(<BotVolumeSliderView volume={0.5} />);
    expect(screen.getByText("Bot volume")).toBeInTheDocument();
    // Base UI names the slider on its role="group" root, not the thumb input.
    expect(
      screen.getByRole("group", { name: "Bot volume" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Mute bot" }),
    ).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("mutes to zero and restores the last audible volume", async () => {
    const user = userEvent.setup();
    const onVolumeChange = vi.fn();
    const { rerender } = render(
      <BotVolumeSliderView volume={0.6} onVolumeChange={onVolumeChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Mute bot" }));
    expect(onVolumeChange).toHaveBeenCalledWith(0);

    rerender(
      <BotVolumeSliderView volume={0} onVolumeChange={onVolumeChange} />,
    );
    const unmute = screen.getByRole("button", { name: "Unmute bot" });
    expect(unmute).toHaveAttribute("aria-pressed", "true");
    await user.click(unmute);
    expect(onVolumeChange).toHaveBeenLastCalledWith(0.6);
  });

  it("hides the label, percent, and mute button via no* props", () => {
    render(<BotVolumeSliderView volume={0.5} noLabel noPercent noMuteButton />);
    expect(screen.queryByText("Bot volume")).not.toBeInTheDocument();
    expect(screen.queryByText("50%")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Bot volume" }),
    ).toBeInTheDocument();
  });

  it("uses a custom label as the slider's accessible name", () => {
    render(<BotVolumeSliderView label="Agent loudness" />);
    expect(
      screen.getByRole("group", { name: "Agent loudness" }),
    ).toBeInTheDocument();
  });
});

describe("BotVolumeSlider", () => {
  it("is wired to the shared useBotAudio store", async () => {
    const user = userEvent.setup();
    render(<BotVolumeSlider />);
    expect(screen.getByText("100%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mute bot" }));
    expect(useBotAudio.getState().volume).toBe(0);
    expect(screen.getByText("0%")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Unmute bot" }),
    ).toBeInTheDocument();
  });
});

describe("BotAudioControlView", () => {
  it("opens a popover with the volume slider from the trigger", async () => {
    const user = userEvent.setup();
    const onVolumeChange = vi.fn();
    render(
      <BotAudioControlView volume={0.5} onVolumeChange={onVolumeChange} />,
    );

    const trigger = screen.getByRole("button", { name: "Bot volume" });
    expect(trigger).toHaveAttribute("data-slot", "bot-audio-control");
    await user.click(trigger);

    expect(
      await screen.findByRole("group", { name: "Bot volume" }),
    ).toBeInTheDocument();
    expect(screen.getByText("50%")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Mute bot" }));
    expect(onVolumeChange).toHaveBeenCalledWith(0);
  });

  it("shows the label inline at text sizes but only to screen readers at icon sizes", () => {
    const { rerender } = render(<BotAudioControlView label="Volume" />);
    const trigger = screen.getByRole("button", { name: "Volume" });
    expect(trigger).toHaveTextContent("Volume");

    rerender(<BotAudioControlView label="Volume" size="icon" />);
    const iconTrigger = screen.getByRole("button", { name: "Volume" });
    expect(iconTrigger).not.toHaveTextContent("Volume");
  });

  it("respects the disabled prop on the trigger", () => {
    render(<BotAudioControlView disabled />);
    expect(screen.getByRole("button", { name: "Bot volume" })).toBeDisabled();
  });
});

describe("BotAudioControl", () => {
  it("is enabled while connected and disabled while disconnected", () => {
    const { rerender } = render(<BotAudioControl />);
    expect(screen.getByRole("button", { name: "Bot volume" })).toBeEnabled();

    hooks.usePipecatClientTransportState.mockReturnValue("disconnected");
    rerender(<BotAudioControl />);
    expect(screen.getByRole("button", { name: "Bot volume" })).toBeDisabled();
  });

  it("writes volume changes back to the shared store", async () => {
    const user = userEvent.setup();
    render(<BotAudioControl />);
    await user.click(screen.getByRole("button", { name: "Bot volume" }));
    await user.click(await screen.findByRole("button", { name: "Mute bot" }));
    expect(useBotAudio.getState().volume).toBe(0);
  });
});
