import type { Story, StoryDefault } from "@ladle/react";
import { Badge } from "./badge";
import { Progress } from "./progress";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<typeof Progress> = ({ ...props }) => (
  <div className="ladle-section-container">
    <h3 className="ladle-section-header">Progress</h3>
    <div className="ladle-section">
      <Progress {...props} className="h-4" />
      <Progress {...props} percent={50} className="h-4" />
      <Progress {...props} percent={100} className="h-4" />
    </div>
    <h3 className="ladle-section-header">Size</h3>
    <p>
      Convenience sizes. Can also be set with <code>className="w-*"</code>
    </p>
    <div className="ladle-section">
      <Progress {...props} percent={50} size="sm" className="h-4" />
      <Progress {...props} percent={50} size="lg" className="h-4" />
      <Progress {...props} percent={50} size="xl" className="h-4" />
      <Progress {...props} percent={50} size="half" className="h-4" />
    </div>
    <h3 className="ladle-section-header">Colors</h3>
    <div className="ladle-section">
      <Progress {...props} percent={50} color="secondary" />
      <Progress {...props} percent={50} color="destructive" />
      <Progress {...props} percent={50} color="warning" />
      <Progress {...props} percent={50} color="active" />
      <Progress {...props} percent={50} color="inactive" />
      <Progress {...props} percent={50} color="agent" />
      <Progress {...props} percent={50} color="client" />
    </div>
    <h3 className="ladle-section-header">Rounded</h3>
    <div className="ladle-section">
      <Progress {...props} percent={50} rounded className="h-4 w-full" />
    </div>
    <h3 className="ladle-section-header">Badge</h3>
    <div className="ladle-section">
      <Badge buttonSizing>
        <Progress {...props} percent={50} size="lg" className="h-[2px]" />
        Some Badge
      </Badge>
    </div>
  </div>
);

Default.argTypes = {
  size: {
    options: ["default", "half", "xs", "sm", "lg", "xl"],
    control: { type: "select" },
    defaultValue: "default",
  },
};

Default.storyName = "Progress";
