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
    options: ["sm", "default", "lg"],
    control: { type: "select" },
    defaultValue: "default",
  },
  variant: {
    options: ["default", "secondary", "destructive", "ghost"],
    control: { type: "select" },
    defaultValue: "default",
  },
};

Default.storyName = "Input";
