import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DTMFKeypad, DTMFKeypadView } from "@/components/pipecat/dtmf-keypad";

const hooks = vi.hoisted(() => ({
  useDTMF: vi.fn(),
  usePipecatClientTransportState: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  useDTMF: hooks.useDTMF,
  usePipecatClientTransportState: hooks.usePipecatClientTransportState,
}));

const key = (name: string) =>
  screen.getByRole("button", { name: `DTMF ${name}` });
const sequenceInput = () =>
  screen.getByRole("textbox", { name: "DTMF sequence" });

describe("DTMFKeypadView", () => {
  it("renders all twelve keys plus the buffered controls", () => {
    const { container } = render(<DTMFKeypadView />);
    expect(
      container.querySelector('[data-slot="dtmf-keypad"]'),
    ).toBeInTheDocument();
    for (const value of "123456789*0#") {
      expect(key(value)).toBeInTheDocument();
    }
    expect(sequenceInput()).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Delete last digit" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
  });

  it("renders only the grid in immediate mode", () => {
    render(<DTMFKeypadView mode="immediate" />);
    expect(key("5")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Send" })).toBeNull();
  });

  it("accumulates presses into the field and sends the sequence once", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const onSend = vi.fn();
    render(<DTMFKeypadView onPress={onPress} onSend={onSend} />);

    await user.click(key("1"));
    await user.click(key("2"));
    await user.click(key("#"));
    expect(sequenceInput()).toHaveValue("12#");
    expect(onPress.mock.calls.map(([k]) => k)).toEqual(["1", "2", "#"]);
    expect(onSend).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSend).toHaveBeenCalledExactlyOnceWith("12#");
    expect(sequenceInput()).toHaveValue("");
  });

  it("sends on Enter and disables Send while the buffer is empty", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<DTMFKeypadView onSend={onSend} />);

    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();

    await user.type(sequenceInput(), "42{Enter}");
    expect(onSend).toHaveBeenCalledExactlyOnceWith("42");
  });

  it("sanitizes typed input and backspaces via the delete button", async () => {
    const user = userEvent.setup();
    render(<DTMFKeypadView />);

    await user.type(sequenceInput(), "1a2b#z");
    expect(sequenceInput()).toHaveValue("12#");

    await user.click(screen.getByRole("button", { name: "Delete last digit" }));
    expect(sequenceInput()).toHaveValue("12");
  });

  it("supports a controlled buffer and sanitizes it at send time", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onSend = vi.fn();
    render(
      <DTMFKeypadView
        value="12ab3"
        onValueChange={onValueChange}
        onSend={onSend}
      />,
    );

    expect(sequenceInput()).toHaveValue("12ab3");

    await user.click(key("4"));
    expect(onValueChange).toHaveBeenCalledWith("12ab34");
    // The value is controlled, so the field itself does not advance.
    expect(sequenceInput()).toHaveValue("12ab3");

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(onSend).toHaveBeenCalledExactlyOnceWith("123");
    expect(onValueChange).toHaveBeenLastCalledWith("");
  });

  it("hides the printed letters with noSubLabels", () => {
    const { rerender } = render(<DTMFKeypadView />);
    expect(screen.getByText("ABC")).toBeInTheDocument();
    rerender(<DTMFKeypadView noSubLabels />);
    expect(screen.queryByText("ABC")).toBeNull();
  });

  it("disables every control when disabled", () => {
    render(<DTMFKeypadView disabled />);
    expect(key("1")).toBeDisabled();
    expect(sequenceInput()).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Delete last digit" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});

describe("DTMFKeypad", () => {
  const sendTone = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.useDTMF.mockReturnValue({ sendTone });
    hooks.usePipecatClientTransportState.mockReturnValue("ready");
  });

  it("stays disabled until the transport is ready", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("disconnected");
    render(<DTMFKeypad />);
    expect(key("1")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });

  it("sends each press through the client in immediate mode", async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const onToneSent = vi.fn();
    render(
      <DTMFKeypad mode="immediate" onPress={onPress} onToneSent={onToneSent} />,
    );

    await user.click(key("5"));
    await user.click(key("*"));
    expect(sendTone.mock.calls).toEqual([["5"], ["*"]]);
    expect(onToneSent.mock.calls).toEqual([["5"], ["*"]]);
    expect(onPress.mock.calls).toEqual([["5"], ["*"]]);
  });

  it("sends the whole sequence in one call in buffered mode", async () => {
    const user = userEvent.setup();
    const onToneSent = vi.fn();
    render(<DTMFKeypad onToneSent={onToneSent} />);

    await user.click(key("1"));
    await user.click(key("2"));
    await user.click(key("3"));
    expect(sendTone).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Send" }));
    expect(sendTone).toHaveBeenCalledExactlyOnceWith("123");
    expect(onToneSent).toHaveBeenCalledExactlyOnceWith("123");
    expect(sequenceInput()).toHaveValue("");
  });

  it("routes a sendTone failure to onError instead of onToneSent", async () => {
    const user = userEvent.setup();
    const error = new Error("DTMF not supported");
    sendTone.mockImplementationOnce(() => {
      throw error;
    });
    const onToneSent = vi.fn();
    const onError = vi.fn();
    render(
      <DTMFKeypad mode="immediate" onToneSent={onToneSent} onError={onError} />,
    );

    await user.click(key("9"));
    expect(onError).toHaveBeenCalledExactlyOnceWith(error);
    expect(onToneSent).not.toHaveBeenCalled();
  });
});
