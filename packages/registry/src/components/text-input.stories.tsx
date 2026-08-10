import type { Meta, StoryObj } from "@storybook/react-vite";

import { TextInputView } from "@/components/pipecat/text-input";

const meta = {
  title: "Components/TextInput",
  component: TextInputView,
  args: {
    onSend: async (message: string) => {
      await new Promise((r) => setTimeout(r, 600));
      console.log("sent:", message);
    },
  },
} satisfies Meta<typeof TextInputView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <div className="w-96">
      <TextInputView {...args} />
    </div>
  ),
};

export const Multiline: Story = {
  render: (args) => (
    <div className="w-96">
      <TextInputView {...args} multiline />
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div className="w-96">
      <TextInputView {...args} disabled placeholder="Connect to send" />
    </div>
  ),
};
