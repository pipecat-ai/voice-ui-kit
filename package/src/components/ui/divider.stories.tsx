import type { Story, StoryDefault } from "@ladle/react";
import { Card, CardContent } from "./card";
import { Divider, type DividerProps } from "./divider";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<DividerProps> = ({ ...props }) => {
  return (
    <div
      className={
        props.orientation === "horizontal"
          ? "flex flex-col gap-8 w-full"
          : "flex flex-row gap-8 h-full"
      }
    >
      <Divider {...props} />

      <Divider {...props}>Hello</Divider>

      <Card>
        <CardContent className="h-full">
          <Divider {...props} />
        </CardContent>
      </Card>
    </div>
  );
};

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
      "primary",
      "secondary",
      "destructive",
      "active",
      "inactive",
      "warning",
    ],
    control: { type: "select" },
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
  size: {
    options: ["none", "sm", "md", "lg", "xl"],
    control: { type: "select" },
    defaultValue: "none",
  },
};

Default.storyName = "Divider";
