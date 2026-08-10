import type { Meta, StoryObj } from "@storybook/react-vite";

import { DTMFKeypadView } from "@/components/pipecat/dtmf-keypad";

const meta = {
  title: "Components/DTMFKeypad",
  component: DTMFKeypadView,
  args: {
    onSend: (sequence: string) => console.log("send:", sequence),
    onPress: (button: string) => console.log("press:", button),
  },
} satisfies Meta<typeof DTMFKeypadView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Buffered: Story = {
  render: (args) => (
    <div className="w-64">
      <DTMFKeypadView {...args} />
    </div>
  ),
};

export const Immediate: Story = {
  render: (args) => (
    <div className="w-64">
      <DTMFKeypadView {...args} mode="immediate" />
    </div>
  ),
};

export const Disabled: Story = {
  render: (args) => (
    <div className="w-64">
      <DTMFKeypadView {...args} disabled />
    </div>
  ),
};
