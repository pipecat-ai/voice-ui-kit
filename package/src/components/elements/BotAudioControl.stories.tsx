import type { ButtonSize, ButtonVariant } from "@/components/ui/buttonVariants";
import {
  buttonSizeOptions,
  buttonVariantOptions,
} from "@/components/ui/buttonVariants";
import { Card, CardContent } from "@/components/ui/card";
import type { Story, StoryDefault } from "@ladle/react";
import { useState } from "react";
import { BotAudioComponent } from "./BotAudioControl";

export default {
  title: "Components / Bot Audio Control",
  argTypes: {
    variant: {
      options: buttonVariantOptions,
      control: { type: "select" },
      defaultValue: "secondary",
    },
    size: {
      options: buttonSizeOptions,
      control: { type: "select" },
      defaultValue: "md",
    },
    noIcon: {
      control: { type: "boolean" },
      defaultValue: false,
    },
    label: {
      control: { type: "text" },
      defaultValue: "",
    },
  },
} satisfies StoryDefault;

interface Args {
  variant: ButtonVariant;
  size: ButtonSize;
  noIcon: boolean;
  label: string;
}

export const Headless: Story<Args> = ({ variant, size, noIcon, label }) => {
  const [volume, setVolume] = useState(0.8);

  return (
    <Card>
      <CardContent>
        <BotAudioComponent
          variant={variant}
          size={size}
          noIcon={noIcon}
          label={label || undefined}
          volume={volume}
          onVolumeChange={setVolume}
        />
        <p className="text-sm text-muted-foreground mt-2">
          Volume: {Math.round(volume * 100)}%
        </p>
      </CardContent>
    </Card>
  );
};
Headless.storyName = "Headless (BotAudioComponent)";
