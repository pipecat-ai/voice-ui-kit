import type { Story, StoryDefault } from "@ladle/react";
import * as React from "react";
import { Button } from "./button";
import { LED, type LEDProps } from "./led";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<LEDProps> = ({ ...props }) => {
  const [watchedCount, setWatchedCount] = React.useState(0);
  const [isOn, setIsOn] = React.useState(false);
  const [isBlinking, setIsBlinking] = React.useState(false);

  return (
    <div className="ladle-section-container">
      <h2 className="ladle-section-header">Basic</h2>
      <section className="ladle-section items-center gap-6">
        <LED {...props} />
        <LED {...props} on />
        <LED {...props} blinking />
        <LED {...props} on blinking />
      </section>

      <h2 className="ladle-section-header">Custom classes</h2>
      <section className="ladle-section items-center gap-6">
        <LED
          {...props}
          classNames={{ on: "bg-emerald-500", off: "bg-neutral-500" }}
        />
        <LED
          {...props}
          className="size-10"
          classNames={{ on: "bg-red-500", off: "bg-blue-500" }}
        />
      </section>

      <h2 className="ladle-section-header">Interactive</h2>
      <section className="ladle-section items-center gap-4">
        <LED {...props} on={isOn} blinking={isBlinking} />
        <Button onClick={() => setIsOn((v) => !v)}>
          Toggle On ({String(isOn)})
        </Button>
        <Button variant="outline" onClick={() => setIsBlinking((v) => !v)}>
          Toggle Blinking ({String(isBlinking)})
        </Button>
      </section>

      <h2 className="ladle-section-header">Watch demo</h2>
      <section className="ladle-section items-center gap-6">
        <LED {...props} watch={watchedCount} />
        <LED
          {...props}
          watch={watchedCount}
          classNames={{ on: "bg-yellow-400", off: "bg-zinc-600" }}
        />
        <div className="flex items-center gap-2">
          <Button onClick={() => setWatchedCount((c) => c + 1)}>Ping</Button>
          <Button
            variant="outline"
            onClick={() => {
              // burst 5 quick pings
              for (let i = 0; i < 5; i++) {
                setTimeout(() => setWatchedCount((c) => c + 1), i * 60);
              }
            }}
          >
            Burst (5x)
          </Button>
          <span className="text-sm opacity-70">count: {watchedCount}</span>
        </div>
      </section>
    </div>
  );
};

Default.argTypes = {
  on: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  blinking: {
    control: { type: "boolean" },
    defaultValue: false,
  },
};

Default.storyName = "LED";
