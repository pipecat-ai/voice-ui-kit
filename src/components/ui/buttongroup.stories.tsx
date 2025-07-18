import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./button";
import { ButtonGroup } from "./buttongroup";
import {
  type ButtonSize,
  buttonSizeOptions,
  type ButtonVariant,
  buttonVariantOptions,
} from "./buttonVariants";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const ButtonGroupDefault: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  orientation: "horizontal" | "vertical";
}> = ({ variant, size, orientation }) => (
  <ButtonGroup orientation={orientation}>
    <Button variant={variant} size={size}>
      Button 1
    </Button>
    <Button variant={variant} size={size}>
      Button 2
    </Button>
    <Button variant={variant} size={size}>
      Button 3
    </Button>
  </ButtonGroup>
);

ButtonGroupDefault.args = {
  variant: "default",
  orientation: "horizontal",
};

ButtonGroupDefault.argTypes = {
  variant: {
    options: buttonVariantOptions,
    control: { type: "select" },
    defaultValue: "default",
  },
  size: {
    options: buttonSizeOptions,
    control: { type: "select" },
    defaultValue: "default",
  },
  orientation: {
    options: ["horizontal", "vertical"],
    control: { type: "select" },
    defaultValue: "horizontal",
  },
};

ButtonGroupDefault.storyName = "Button Group";
