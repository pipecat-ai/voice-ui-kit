import type { Story, StoryDefault } from "@ladle/react";

export default {
  title: "Documentation",
} satisfies StoryDefault;

export const Welcome: Story = () => (
  <div className="flex flex-col gap-6">
    <p>Welcome to the VKUI storybook.</p>
  </div>
);
