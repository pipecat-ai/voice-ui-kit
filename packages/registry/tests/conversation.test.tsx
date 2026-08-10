import type { ConversationMessage } from "@pipecat-ai/client-react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  Conversation,
  ConversationView,
} from "@/components/pipecat/conversation";

const hooks = vi.hoisted(() => ({
  useConversationContext: vi.fn(),
  usePipecatClientTransportState: vi.fn(),
  usePipecatConversation: vi.fn(),
}));

// conversation-message.tsx uses real helpers (isMessageEmpty) from the same
// module, so spread the original and override only the hooks.
vi.mock("@pipecat-ai/client-react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@pipecat-ai/client-react")>()),
  useConversationContext: hooks.useConversationContext,
  usePipecatClientTransportState: hooks.usePipecatClientTransportState,
  usePipecatConversation: hooks.usePipecatConversation,
}));

let tick = 0;
function message(
  overrides: Partial<ConversationMessage> = {},
): ConversationMessage {
  const createdAt = new Date(Date.UTC(2026, 0, 1, 12, 0, tick++)).toISOString();
  return {
    role: "user",
    parts: [{ text: "Hello there", final: true, createdAt }],
    createdAt,
    ...overrides,
  };
}

function botMessage(spoken: string, unspoken = ""): ConversationMessage {
  const base = message({ role: "assistant" });
  return {
    ...base,
    parts: [
      {
        text: { spoken, unspoken },
        final: false,
        createdAt: base.createdAt,
      },
    ],
  };
}

describe("ConversationView", () => {
  it("shows the default waiting state when there are no messages", () => {
    const { container } = render(<ConversationView />);
    expect(
      container.querySelector('[data-slot="conversation"]'),
    ).toBeInTheDocument();
    expect(screen.getByText("Waiting for messages…")).toBeInTheDocument();
  });

  it("renders a custom empty node", () => {
    render(<ConversationView empty={<div>Nothing yet</div>} />);
    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
    expect(screen.queryByText("Waiting for messages…")).not.toBeInTheDocument();
  });

  it("renders role labels and text for user and assistant messages", () => {
    render(
      <ConversationView
        messages={[message(), botMessage("Hi from the bot.")]}
      />,
    );
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByText("assistant")).toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("Hi from the bot.")).toBeInTheDocument();
  });

  it("supports custom participant labels", () => {
    render(
      <ConversationView
        messages={[message(), botMessage("Yes?")]}
        clientLabel="You"
        assistantLabel="Agent"
      />,
    );
    expect(screen.getByText("You")).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument();
    expect(screen.queryByText("user")).not.toBeInTheDocument();
  });

  it("renders newest first with reverseOrder", () => {
    const first = message();
    const second = message({
      parts: [{ text: "Second", final: true, createdAt: first.createdAt }],
    });
    render(<ConversationView messages={[first, second]} reverseOrder />);

    const texts = screen.getAllByText(/Hello there|Second/);
    expect(texts[0]).toHaveTextContent("Second");
    expect(texts[1]).toHaveTextContent("Hello there");
  });

  it("dims unspoken bot text by default but not in instant mode", () => {
    const { rerender } = render(
      <ConversationView messages={[botMessage("Spoken part ", "pending")]} />,
    );
    expect(screen.getByText("pending")).toHaveClass("text-muted-foreground");

    rerender(
      <ConversationView
        messages={[botMessage("Spoken part ", "pending")]}
        textRenderMode="instant"
      />,
    );
    expect(screen.getByText("Spoken part pending")).toBeInTheDocument();
  });

  it("shows the thinking indicator for an empty message", () => {
    const empty = message({ role: "assistant" });
    empty.parts = [{ text: "", final: false, createdAt: empty.createdAt }];
    render(<ConversationView messages={[empty]} />);
    expect(screen.getByLabelText("Thinking")).toBeInTheDocument();
  });

  it("renders function calls as a collapsible with args and result", async () => {
    const user = userEvent.setup();
    const fn = message({
      role: "function_call",
      parts: [],
      functionCall: {
        function_name: "get_weather",
        tool_call_id: "call-1",
        args: { city: "Boston" },
        result: { temp: 72 },
        status: "completed",
      },
    });
    render(<ConversationView messages={[fn]} />);

    const trigger = screen.getByRole("button", { name: /Function call/ });
    expect(trigger).toHaveTextContent("(get_weather)");
    expect(screen.queryByText("Arguments")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(screen.getByText("Arguments")).toBeInTheDocument();
    expect(screen.getByText(/"city": "Boston"/)).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.getByText(/"temp": 72/)).toBeInTheDocument();
  });
});

describe("Conversation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hooks.usePipecatClientTransportState.mockReturnValue("ready");
    hooks.usePipecatConversation.mockReturnValue({
      messages: [],
      injectMessage: vi.fn(),
    });
    hooks.useConversationContext.mockReturnValue({
      injectMessage: vi.fn(),
      botOutputSupported: true,
    });
  });

  it("shows a connecting empty state", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("connecting");
    render(<Conversation />);
    expect(screen.getByText("Connecting to agent…")).toBeInTheDocument();
  });

  it("shows a not-connected empty state while disconnected", () => {
    hooks.usePipecatClientTransportState.mockReturnValue("disconnected");
    render(<Conversation />);
    expect(screen.getByText("Not connected to agent")).toBeInTheDocument();
  });

  it("warns when the server lacks BotOutput support", () => {
    hooks.useConversationContext.mockReturnValue({
      injectMessage: vi.fn(),
      botOutputSupported: false,
    });
    render(<Conversation />);
    expect(
      screen.getByText("BotOutput events not supported"),
    ).toBeInTheDocument();
  });

  it("renders messages from the conversation store", () => {
    hooks.usePipecatConversation.mockReturnValue({
      messages: [message(), botMessage("From the store.")],
      injectMessage: vi.fn(),
    });
    render(<Conversation />);
    expect(screen.getByText("Hello there")).toBeInTheDocument();
    expect(screen.getByText("From the store.")).toBeInTheDocument();
  });

  it("hides function-call messages with noFunctionCalls", () => {
    const fn = message({
      role: "function_call",
      parts: [],
      functionCall: { tool_call_id: "call-1", status: "completed" },
    });
    hooks.usePipecatConversation.mockReturnValue({
      messages: [message(), fn],
      injectMessage: vi.fn(),
    });

    const { rerender } = render(<Conversation />);
    expect(
      screen.getByRole("button", { name: /Function call/ }),
    ).toBeInTheDocument();

    rerender(<Conversation noFunctionCalls />);
    expect(
      screen.queryByRole("button", { name: /Function call/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Hello there")).toBeInTheDocument();
  });

  it("requests spoken-only bot output in captions mode", () => {
    render(<Conversation textRenderMode="captions" />);
    expect(hooks.usePipecatConversation).toHaveBeenLastCalledWith(
      expect.objectContaining({ botOutputFilter: { unspoken: false } }),
    );

    render(<Conversation textRenderMode="karaoke" />);
    expect(hooks.usePipecatConversation).toHaveBeenLastCalledWith(
      expect.objectContaining({ botOutputFilter: undefined }),
    );
  });
});
