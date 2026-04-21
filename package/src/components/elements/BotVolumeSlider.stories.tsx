import { Card, CardContent } from "@/components/ui/card";
import type { Story, StoryDefault } from "@ladle/react";
import { useState } from "react";
import { BotVolumeSliderComponent } from "./BotVolumeSlider";

export default {
  title: "Components / Bot Volume Slider",
  argTypes: {
    noLabel: {
      control: { type: "boolean" },
      defaultValue: false,
    },
    noPercent: {
      control: { type: "boolean" },
      defaultValue: false,
    },
    orientation: {
      options: ["horizontal", "vertical"],
      control: { type: "select" },
      defaultValue: "horizontal",
    },
    label: {
      control: { type: "text" },
      defaultValue: "Bot volume",
    },
  },
} satisfies StoryDefault;

interface Args {
  noLabel: boolean;
  noPercent: boolean;
  orientation: "horizontal" | "vertical";
  label: string;
}

export const Headless: Story<Args> = ({
  noLabel,
  noPercent,
  orientation,
  label,
}) => {
  const [volume, setVolume] = useState(0.8);

  return (
    <Card>
      <CardContent>
        <div
          style={orientation === "vertical" ? { height: 200 } : { width: 280 }}
        >
          <BotVolumeSliderComponent
            volume={volume}
            onVolumeChange={setVolume}
            noLabel={noLabel}
            noPercent={noPercent}
            orientation={orientation}
            label={label}
          />
        </div>
      </CardContent>
    </Card>
  );
};

Headless.storyName = "Headless (BotVolumeSliderComponent)";
