import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TextInput, TextInputView } from "@/components/pipecat/text-input";

const hooks = vi.hoisted(() => ({
  useConversationContext: vi.fn(),
  usePipecatClient: vi.fn(),
  usePipecatClientTransportState: vi.fn(),
}));

vi.mock("@pipecat-ai/client-react", () => ({
  useConversationContext: hooks.useConversationContext,
  usePipecatClient: hooks.usePipecatClient,
  usePipecatClientTransportState: hooks.usePipecatClientTransportState,
}));

describe("TextInputView", () => {
  it("renders the composer with a disabled send button while empty", () => {
    render(<TextInputView />);
    const input = screen.getByRole("textbox", { name: "Message" });
    expect(input).toHaveAttribute("placeholder", "Type message…");
    expect(input).toBeEnabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("sends the trimmed message on click and clears the field", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn(() => Promise.resolve());
    render(<TextInputView onSend={onSend} />);

    const input = screen.getByRole("textbox", { name: "Message" });
    await user.type(input, "  hello bot  ");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).toHaveBeenCalledWith("hello bot");
    await waitFor(() => expect(input).toHaveValue(""));
  });

  it("sends on Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<TextInputView onSend={onSend} />);

    await user.type(screen.getByRole("textbox"), "quick note{Enter}");
    expect(onSend).toHaveBeenCalledWith("quick note");
  });

  it("keeps whitespace-only drafts unsendable", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<TextInputView onSend={onSend} />);

    await user.type(screen.getByRole("textbox"), "   {Enter}");
    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("inserts a newline on Shift+Enter in multiline mode, then sends on Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<TextInputView multiline onSend={onSend} />);

    const textarea = screen.getByRole("textbox", { name: "Message" });
    await user.type(textarea, "line one{Shift>}{Enter}{/Shift}line two");
    expect(onSend).not.toHaveBeenCalled();
    expect(textarea).toHaveValue("line one\nline two");

    await user.type(textarea, "{Enter}");
    expect(onSend).toHaveBeenCalledWith("line one\nline two");
  });

  it("keeps the draft and refocuses when the send fails", async () => {
    const user = userEvent.setup();
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const onSend = vi.fn(() => Promise.reject(new Error("offline")));
    render(<TextInputView onSend={onSend} />);

    const input = screen.getByRole("textbox", { name: "Message" });
    await user.type(input, "draft{Enter}");

    await waitFor(() => expect(input).toBeEnabled());
    expect(input).toHaveValue("draft");
    expect(input).toHaveFocus();
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("disables the whole composer via the disabled prop", () => {
    render(<TextInputView disabled />);
    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("renders custom send button content", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    render(<TextInputView onSend={onSend} buttonContent="Go" />);

    const button = screen.getByRole("button", { name: "Send message" });
    expect(button).toHaveTextContent("Go");

    await user.type(screen.getByRole("textbox"), "hi");
    await user.click(button);
    expect(onSend).toHaveBeenCalledWith("hi");
  });
});

describe("TextInput", () => {
  const client = { sendText: vi.fn(() => Promise.resolve()) };
  const injectMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    hooks.usePipecatClient.mockReturnValue(client);
    hooks.usePipecatClientTransportState.mockReturnValue("ready");
    hooks.useConversationContext.mockReturnValue({
      injectMessage,
      botOutputSupported: true,
    });
  });

  it("injects the user message locally and sends it via client.sendText", async () => {
    const user = userEvent.setup();
    const onSent = vi.fn();
    render(<TextInput onSent={onSent} />);

    await user.type(screen.getByRole("textbox"), "hello agent{Enter}");

    expect(injectMessage).toHaveBeenCalledWith({
      role: "user",
      parts: [expect.objectContaining({ text: "hello agent", final: true })],
    });
    expect(client.sendText).toHaveBeenCalledWith("hello agent", undefined);
    await waitFor(() => expect(onSent).toHaveBeenCalledWith("hello agent"));
  });

  it("forwards sendTextOptions to client.sendText", async () => {
    const user = userEvent.setup();
    const options = { run_immediately: true };
    render(<TextInput sendTextOptions={options} />);

    await user.type(screen.getByRole("textbox"), "with options{Enter}");
    expect(client.sendText).toHaveBeenCalledWith("with options", options);
  });

  it("skips local injection with noInject", async () => {
    const user = userEvent.setup();
    render(<TextInput noInject />);

    await user.type(screen.getByRole("textbox"), "no echo{Enter}");
    expect(injectMessage).not.toHaveBeenCalled();
    expect(client.sendText).toHaveBeenCalledWith("no echo", undefined);
  });

  it("disables the composer and swaps the placeholder while disconnected", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("disconnected");
    render(<TextInput />);

    const input = screen.getByRole("textbox", { name: "Message" });
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("placeholder", "Connect to send");
  });

  it("stays disabled when the consumer forces disabled while connected", () => {
    render(<TextInput disabled />);
    expect(screen.getByRole("textbox", { name: "Message" })).toBeDisabled();
  });
});
