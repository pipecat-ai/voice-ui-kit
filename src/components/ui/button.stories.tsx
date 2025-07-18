import { Button } from "@/components/ui/button";
import { LoaderIcon, VolumeOffIcon } from "@/icons";
import type { Story, StoryDefault } from "@ladle/react";
import {
  type ButtonSize,
  buttonSizeOptions,
  type ButtonVariant,
  buttonVariantOptions,
} from "./buttonVariants";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const ButtonPrimary: Story<{
  label: string;
  variant: ButtonVariant;
  size: ButtonSize;
  isDisabled: boolean;
  isLoading: boolean;
  withIcon: boolean;
}> = ({ label, variant, size, isDisabled, isLoading, withIcon }) => (
  <Button
    variant={variant}
    size={size}
    disabled={isDisabled}
    isLoading={isLoading}
  >
    {withIcon && !isLoading && <VolumeOffIcon />}
    {label}
  </Button>
);

ButtonPrimary.args = {
  label: "My Button",
  variant: "default",
  isDisabled: false,
  isLoading: false,
  withIcon: false,
};

ButtonPrimary.argTypes = {
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
};

ButtonPrimary.storyName = "Button";

export const ButtonIcon: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  isDisabled: boolean;
  isLoading: boolean;
}> = ({ variant, size, isDisabled, isLoading }) => (
  <Button
    isIcon
    variant={variant}
    size={size}
    disabled={isDisabled || isLoading}
  >
    {isLoading ? (
      <LoaderIcon className="size-4 animate-spin" />
    ) : (
      <VolumeOffIcon />
    )}
  </Button>
);

ButtonIcon.args = {
  variant: "default",
  size: "default",
  isDisabled: false,
  isLoading: false,
};

ButtonIcon.argTypes = {
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
};

ButtonIcon.storyName = "Icon Button";
