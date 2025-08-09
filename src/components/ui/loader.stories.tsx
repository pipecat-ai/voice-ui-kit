import type { Story, StoryDefault } from "@ladle/react";
import { SpinLoader, StripeLoader } from "./loader";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story = () => (
  <div className="flex flex-col gap-4">
    <SpinLoader />
    <StripeLoader />
  </div>
);

Default.storyName = "Loader";
