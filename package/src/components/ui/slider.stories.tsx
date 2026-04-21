import type { Story, StoryDefault } from "@ladle/react";
import { useState } from "react";
import { Slider } from "./slider";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const SliderStory: Story = () => {
  const [horizontal, setHorizontal] = useState<number[]>([50]);
  const [vertical, setVertical] = useState<number[]>([25]);

  return (
    <div className="ladle-section-container">
      <h3 className="ladle-section-header">Horizontal</h3>
      <div className="ladle-section" style={{ width: 320 }}>
        <Slider
          min={0}
          max={100}
          step={1}
          value={horizontal}
          onValueChange={setHorizontal}
        />
        <p className="text-sm text-muted-foreground">Value: {horizontal[0]}</p>
      </div>

      <h3 className="ladle-section-header">Vertical</h3>
      <div className="ladle-section" style={{ height: 160 }}>
        <Slider
          orientation="vertical"
          min={0}
          max={100}
          step={1}
          value={vertical}
          onValueChange={setVertical}
        />
        <p className="text-sm text-muted-foreground">Value: {vertical[0]}</p>
      </div>

      <h3 className="ladle-section-header">Disabled</h3>
      <div className="ladle-section" style={{ width: 320 }}>
        <Slider disabled value={[40]} min={0} max={100} />
      </div>
    </div>
  );
};

SliderStory.storyName = "Slider";
