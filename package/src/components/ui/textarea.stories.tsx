import type { Story, StoryDefault } from "@ladle/react";
import { Card, CardContent } from "./card";
import { Textarea } from "./textarea";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<typeof Textarea> = ({ ...props }) => (
  <Card className="flex flex-col gap-8 w-full h-full">
    <CardContent>
      <Textarea {...props} placeholder="Placeholder" />
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

Default.storyName = "Textarea";
