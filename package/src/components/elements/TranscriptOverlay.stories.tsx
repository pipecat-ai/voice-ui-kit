import type { Story, StoryDefault } from "@ladle/react";
import {
  TranscriptOverlayComponent,
  TranscriptOverlayPartComponent,
} from "./TranscriptOverlay";

export default {
  title: "Components",
  args: {
    size: "default",
  },
  argTypes: {
    size: {
      control: { type: "select" },
      options: ["default", "sm", "lg"],
      defaultValue: "default",
    },
  },
} satisfies StoryDefault;

export const TextPart: Story<{ size: "default" | "sm" | "lg" }> = ({
  size,
}) => (
  <TranscriptOverlayComponent size={size} className="max-w-md">
    <TranscriptOverlayPartComponent text="Hello my name is ChatBot. How are you today? Would you like to talk about the weather?" />
  </TranscriptOverlayComponent>
);

TextPart.storyName = "Transcript Overlay";
