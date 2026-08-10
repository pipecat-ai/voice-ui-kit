import type { Meta, StoryObj } from "@storybook/react-vite";

import { Metric } from "@/components/pipecat/metric";

const meta = {
  title: "Components/Metric",
  component: Metric,
} satisfies Meta<typeof Metric>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: { label: "TTFB · tts", value: 231.8, unit: "ms" },
};

export const Grid: Story = {
  args: { label: "TTFB · tts" },
  render: () => (
    <div className="grid w-96 grid-cols-3 gap-4">
      <Metric label="TTFB · tts" value={231.8} unit="ms" />
      <Metric label="TTFB · llm" value={512.4} unit="ms" />
      <Metric label="Processing · stt" value={48.2} unit="ms" />
      <Metric label="Prompt tokens" value={1284} />
      <Metric label="Completion tokens" value={956} />
      <Metric label="Total tokens" value={2240} />
    </div>
  ),
};

export const Empty: Story = {
  args: { label: "TTFB · tts", value: null, unit: "ms" },
};

export const CustomFormat: Story = {
  args: {
    label: "Total cost",
    value: 0.03824,
    format: (value) => `$${value.toFixed(4)}`,
  },
};
