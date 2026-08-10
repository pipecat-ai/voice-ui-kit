import type { Meta, StoryObj } from "@storybook/react-vite";

import { ClientStatusValue } from "@/components/pipecat/client-status";

const meta = {
  title: "Components/ClientStatus",
  component: ClientStatusValue,
} satisfies Meta<typeof ClientStatusValue>;

export default meta;
type Story = StoryObj<typeof meta>;

const STATES = [
  "disconnected",
  "initializing",
  "connecting",
  "connected",
  "ready",
  "error",
  null,
];

export const AllStates: Story = {
  render: () => (
    <dl className="grid w-72 grid-cols-[1fr_2fr] items-center gap-2 text-sm">
      {STATES.map((state) => (
        <div
          key={String(state)}
          className="col-span-2 grid grid-cols-subgrid items-center"
        >
          <dt className="text-muted-foreground">{String(state)}</dt>
          <dd>
            <ClientStatusValue state={state} />
          </dd>
        </div>
      ))}
    </dl>
  ),
};
