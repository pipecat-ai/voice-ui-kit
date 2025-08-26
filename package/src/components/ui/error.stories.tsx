import { ErrorCard } from "@/components/ui/error";
import type { Story, StoryDefault } from "@ladle/react";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<{
  error: string;
  size: "lg" | "sm" | "md" | "xl";
}> = ({ error, size }) => (
  <ErrorCard shadow="short" size={size}>
    {error}
  </ErrorCard>
);

Default.args = {
  error: "An error occurred",
  size: "lg",
};
Default.storyName = "Error Card";
