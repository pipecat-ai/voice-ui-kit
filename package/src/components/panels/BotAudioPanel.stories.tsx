import type { Story, StoryDefault } from "@ladle/react";
import { BotAudioPanel } from "./BotAudioPanel";

export default {
  title: "Panels",
} satisfies StoryDefault;

export const BotAudioPanelPrimary: Story<{
  isMuted: boolean;
}> = ({ isMuted }) => <BotAudioPanel isMuted={isMuted} />;

BotAudioPanelPrimary.args = {
  isMuted: false,
};
BotAudioPanelPrimary.argTypes = {
  isMuted: {
    control: { type: "boolean" },
    defaultValue: false,
  },
};
BotAudioPanelPrimary.storyName = "Bot Audio Panel";
