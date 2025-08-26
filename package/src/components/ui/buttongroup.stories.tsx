import type { Story, StoryDefault } from "@ladle/react";
import { Button } from "./button";
import { ButtonGroup } from "./buttongroup";
import {
  type ButtonRounded,
  buttonRoundedOptions,
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
  rounded: ButtonRounded;
}> = ({ variant, size, orientation, rounded }) => (
  <div className="ladle-section-container">
    <section className="ladle-section">
      <ButtonGroup orientation={orientation}>
        <Button variant={variant} size={size} rounded={rounded}>
          Button 1
        </Button>
        <Button variant={variant} size={size} rounded={rounded}>
          Button 2
        </Button>
        <Button variant={variant} size={size} rounded={rounded}>
          Button 3
        </Button>
      </ButtonGroup>
    </section>

    <section className="ladle-section">
      <ButtonGroup orientation={orientation}>
        <Button variant="outline" size={size} rounded={rounded}>
          Button 1
        </Button>
        <Button variant="outline" size={size} rounded={rounded}>
          Button 2
        </Button>
        <Button variant="outline" size={size} rounded={rounded}>
          Button 3
        </Button>
      </ButtonGroup>
    </section>
  </div>
);

ButtonGroupDefault.args = {
  variant: "primary",
  orientation: "horizontal",
};

ButtonGroupDefault.argTypes = {
  variant: {
    options: buttonVariantOptions,
    control: { type: "select" },
    defaultValue: "primary",
  },
  size: {
    options: buttonSizeOptions,
    control: { type: "select" },
    defaultValue: "md",
  },
  rounded: {
    options: buttonRoundedOptions,
    control: { type: "select" },
    defaultValue: "size",
  },
  orientation: {
    options: ["horizontal", "vertical"],
    control: { type: "select" },
    defaultValue: "horizontal",
  },
};

ButtonGroupDefault.storyName = "Button Group";
