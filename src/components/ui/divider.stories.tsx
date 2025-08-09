import type { Story, StoryDefault } from "@ladle/react";
import { Card, CardContent } from "./card";
import { Divider } from "./divider";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<typeof Divider> = ({ ...props }) => (
  <div className="vkui:flex vkui:flex-col vkui:gap-8 vkui:w-full vkui:h-full">
    <Divider {...props} />

    <Divider {...props}>Hello</Divider>

    <Card variant="destructive" background="stripes">
      <CardContent>
        <Divider {...props} />
      </CardContent>
    </Card>
  </div>
);

Default.argTypes = {
  variant: {
    options: ["solid", "dotted", "dashed"],
    control: { type: "select" },
    defaultValue: "solid",
  },
  decoration: {
    options: ["none", "plus"],
    control: { type: "select" },
    defaultValue: "none",
  },
  color: {
    options: [
      "default",
      "secondary",
      "destructive",
      "active",
      "inactive",
      "warning",
    ],
    control: { type: "select" },
    defaultValue: "default",
  },
  thickness: {
    options: ["thin", "medium", "thick"],
    control: { type: "select" },
    defaultValue: "thin",
  },
  orientation: {
    options: ["horizontal", "vertical"],
    control: { type: "radio" },
    defaultValue: "horizontal",
  },
};

Default.storyName = "Divider";
