import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { UserScreenControlView } from "@/components/pipecat/user-screen-control";

const meta = {
  title: "Components/UserScreenControl",
  component: UserScreenControlView,
} satisfies Meta<typeof UserScreenControlView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: function ScreenStory() {
    const [sharing, setSharing] = useState(false);
    return (
      <div className={sharing ? "w-96" : undefined}>
        <UserScreenControlView
          isScreenEnabled={sharing}
          onToggleScreen={() => setSharing((v) => !v)}
          activeText="Stop sharing"
          inactiveText="Share screen"
          video={
            <div className="bg-primary text-primary-foreground flex h-full w-full items-center justify-center font-mono text-xs">
              screen preview
            </div>
          }
        />
      </div>
    );
  },
};

export const Disabled: Story = {
  args: { disabled: true, inactiveText: "Share screen" },
};
