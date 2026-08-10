import type { ConversationMessage } from "@pipecat-ai/client-react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ConversationView } from "@/components/pipecat/conversation";

const now = Date.now();

function msg(partial: Record<string, unknown>): ConversationMessage {
  return partial as unknown as ConversationMessage;
}

const MESSAGES: ConversationMessage[] = [
  msg({
    role: "user",
    createdAt: new Date(now - 60_000).toISOString(),
    parts: [{ text: "Hey! What's the weather like in Amsterdam?" }],
  }),
  msg({
    role: "function_call",
    createdAt: new Date(now - 55_000).toISOString(),
    functionCall: {
      function_name: "get_weather",
      status: "completed",
      args: { location: "Amsterdam" },
      result: { temperature: 19, conditions: "partly cloudy" },
    },
  }),
  msg({
    role: "assistant",
    createdAt: new Date(now - 50_000).toISOString(),
    parts: [
      {
        text: {
          spoken: "It's about 19 degrees and partly cloudy. ",
          unspoken: "Perfect weather for a canal walk.",
        },
      },
    ],
  }),
  msg({
    role: "assistant",
    createdAt: new Date(now - 5_000).toISOString(),
    parts: [],
  }),
];

const meta = {
  title: "Components/Conversation",
  component: ConversationView,
} satisfies Meta<typeof ConversationView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="h-96 w-120 rounded-xl border">
      <ConversationView messages={MESSAGES} />
    </div>
  ),
};

export const CustomLabels: Story = {
  render: () => (
    <div className="h-96 w-120 rounded-xl border">
      <ConversationView
        messages={MESSAGES}
        assistantLabel="Agent"
        clientLabel="You"
      />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="h-64 w-120 rounded-xl border">
      <ConversationView messages={[]} />
    </div>
  ),
};
