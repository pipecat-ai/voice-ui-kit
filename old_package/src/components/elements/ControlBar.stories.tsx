import type { Story, StoryDefault } from "@ladle/react";
import { Button, type CardProps, FullScreenContainer } from "../ui";
import { ControlBar, ControlBarDivider } from "./ControlBar";
import { UserAudioControl } from "./UserAudioControl";

export default {
  title: "Components",
  args: {
    withGradientBorder: true,
    shadow: "xlong",
    size: "lg",
  },
} satisfies StoryDefault;

export const Default: Story = ({ ...props }: CardProps) => (
  <FullScreenContainer>
    <ControlBar {...props}>
      <UserAudioControl size="lg" variant="outline" />
      <ControlBarDivider />
      <Button size="lg">Disconnect</Button>
    </ControlBar>
  </FullScreenContainer>
);

Default.storyName = "Control Bar";
