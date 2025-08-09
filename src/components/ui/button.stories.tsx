import { Button } from "@/components/ui/button";
import { LoaderIcon, VolumeOffIcon } from "@/icons";
import type { Story, StoryDefault } from "@ladle/react";
import {
  type ButtonSize,
  buttonSizeOptions,
  type ButtonState,
  buttonStateOptions,
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
  state: ButtonState;
  isDisabled: boolean;
  isLoading: boolean;
  withIcon: boolean;
  loader: "icon" | "stripes";
}> = ({
  label,
  variant,
  size,
  state,
  isDisabled,
  isLoading,
  withIcon,
  loader,
}) => (
  <Button
    variant={variant}
    size={size}
    state={state}
    disabled={isDisabled}
    isLoading={isLoading}
    loader={loader}
  >
    {withIcon && !isLoading && <VolumeOffIcon />}
    {label}
  </Button>
);

ButtonPrimary.args = {
  label: "My Button",
  variant: "default",
  state: "default",
  isDisabled: false,
  isLoading: false,
  withIcon: false,
  loader: "icon",
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
  state: {
    options: buttonStateOptions,
    control: { type: "select" },
    defaultValue: "default",
  },
  loader: {
    options: ["icon", "stripes"],
    control: { type: "select" },
    defaultValue: "icon",
  },
};

ButtonPrimary.storyName = "Button";

export const ButtonIcon: Story<{
  variant: ButtonVariant;
  size: ButtonSize;
  state: ButtonState;
  isDisabled: boolean;
  isLoading: boolean;
  loader: "icon" | "stripes";
}> = ({ variant, size, state, isDisabled, isLoading, loader }) => (
  <Button
    isIcon
    variant={variant}
    size={size}
    state={state}
    disabled={isDisabled || isLoading}
    loader={loader}
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
  state: "default",
  isDisabled: false,
  isLoading: false,
  loader: "icon",
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
  state: {
    options: buttonStateOptions,
    control: { type: "select" },
    defaultValue: "default",
  },
  loader: {
    options: ["icon", "stripes"],
    control: { type: "select" },
    defaultValue: "icon",
  },
};

ButtonIcon.storyName = "Icon Button";
