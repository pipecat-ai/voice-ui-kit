import type { Story, StoryDefault } from "@ladle/react";
import { Card, CardContent } from "./card";
import { Input } from "./input";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<typeof Input> = ({ ...props }) => (
  <Card className="flex flex-col gap-8 w-full h-full">
    <CardContent>
      <Input {...props} placeholder="Placeholder" />
    </CardContent>
  </Card>
);

Default.argTypes = {
  size: {
    options: ["sm", "md", "lg", "xl"],
    control: { type: "select" },
    defaultValue: "md",
  },
  variant: {
    options: ["default", "secondary", "destructive", "ghost"],
    control: { type: "select" },
    defaultValue: "default",
  },
  disabled: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  rounded: {
    options: ["none", "size", "sm", "md", "lg", "xl", "full"],
    control: { type: "select" },
    defaultValue: "size",
  },
};

Default.storyName = "Input";
