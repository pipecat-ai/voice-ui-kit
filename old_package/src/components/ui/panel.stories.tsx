import {
  Panel,
  PanelContent,
  PanelHeader,
  PanelTitle,
} from "@/components/ui/panel";
import type { Story, StoryDefault } from "@ladle/react";
import { ChevronLeftIcon } from "lucide-react";
import { Button } from "./button";
import ButtonGroup from "./buttongroup";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const PanelHeaderDefault: Story<{
  label: string;
  variant: "default" | "inline";
}> = ({ label, variant }) => (
  <Panel>
    <PanelHeader variant={variant}>
      <PanelTitle>{label}</PanelTitle>
    </PanelHeader>
    <PanelContent>
      My Panel
      <Button size="lg">I shrink</Button>
      <Button size="xl" isIcon>
        <ChevronLeftIcon />
      </Button>
    </PanelContent>
    <PanelContent>
      <ButtonGroup>
        <Button size="lg" variant="outline">
          A
        </Button>
        <Button size="lg" variant="outline">
          B
        </Button>
        <Button size="lg" variant="outline">
          C
        </Button>
      </ButtonGroup>
    </PanelContent>
  </Panel>
);

PanelHeaderDefault.args = {
  label: "Hello world",
};
PanelHeaderDefault.argTypes = {
  variant: {
    options: ["default", "inline"],
    control: { type: "radio" },
    defaultValue: "default",
  },
};

PanelHeaderDefault.storyName = "Panel";
