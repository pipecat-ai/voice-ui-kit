import type { Story, StoryDefault } from "@ladle/react";
import { SpinLoader, StripeLoader } from "./loader";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story = () => (
  <div className="ladle-section-container">
    <h3 className="ladle-section-header">Spin Loader</h3>
    <div className="ladle-section">
      <SpinLoader />
    </div>
    <h3 className="ladle-section-header">Stripe Loader</h3>
    <div className="ladle-section">
      <StripeLoader />
    </div>
    <p>
      Can be colored with <code>text-*</code> currentColor directives:
    </p>
    <div className="ladle-section">
      <StripeLoader className="text-destructive" />
    </div>
  </div>
);

Default.storyName = "Loader";
