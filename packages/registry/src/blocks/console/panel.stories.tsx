import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  ConsolePanel,
  ConsolePanelActions,
  ConsolePanelContent,
  ConsolePanelHeader,
  ConsolePanelTitle,
} from "@/components/pipecat/console/panel";
import { Button } from "@/components/ui/button";

const meta = {
  title: "Blocks/ConsolePanel",
  component: ConsolePanel,
} satisfies Meta<typeof ConsolePanel>;

export default meta;
type Story = StoryObj<typeof meta>;

function Anatomy({ width }: { width: string }) {
  return (
    <div style={{ width }} className="h-48">
      <ConsolePanel>
        <ConsolePanelHeader>
          <ConsolePanelTitle>Panel title</ConsolePanelTitle>
          <ConsolePanelActions>
            <Button variant="ghost" size="icon-sm" aria-label="Action">
              ⋯
            </Button>
          </ConsolePanelActions>
        </ConsolePanelHeader>
        <ConsolePanelContent>
          <p className="text-muted-foreground text-sm">
            Density is container-driven: padding tightens as the panel narrows (
            {width}).
          </p>
        </ConsolePanelContent>
      </ConsolePanel>
    </div>
  );
}

export const Anatomy_: Story = {
  name: "Anatomy",
  render: () => <Anatomy width="28rem" />,
};

export const DensitySteps: Story = {
  render: () => (
    <div className="flex items-start gap-4">
      <Anatomy width="10rem" />
      <Anatomy width="20rem" />
      <Anatomy width="32rem" />
    </div>
  ),
};
