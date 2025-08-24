import { Button, type ButtonProps } from "@/components/ui/button";
import type { Story, StoryDefault } from "@ladle/react";
import { TerminalIcon, TriangleAlertIcon } from "lucide-react";
import {
  buttonRoundedOptions,
  buttonSizeOptions,
  buttonStateOptions,
  buttonVariantOptions,
} from "./buttonVariants";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const ButtonPrimary: Story<ButtonProps> = ({ ...props }) => (
  <div className="ladle-section-container">
    <section className="ladle-section">
      <Button {...props}>Normal Button</Button>
    </section>
    <Button isFullWidth {...props}>
      Full Width Button
    </Button>
    <h2 className="ladle-section-header">Sizes</h2>
    <section className="ladle-section">
      <Button size="sm">SM</Button>
      <Button size="md">MD</Button>
      <Button size="lg">LG</Button>
      <Button size="xl">XL</Button>
    </section>
    <section className="ladle-section">
      <Button size="sm">
        <TriangleAlertIcon />
        SM With Icon
      </Button>
      <Button size="md">
        <TriangleAlertIcon />
        MD With Icon
      </Button>
      <Button size="lg">
        <TriangleAlertIcon />
        LG With Icon
      </Button>
      <Button size="xl">
        <TriangleAlertIcon />
        XL With Icon
      </Button>
    </section>

    <h2 className="ladle-section-header">With Icon</h2>
    <section className="ladle-section">
      <Button size="sm" uppercase={props.uppercase}>
        <TerminalIcon />
        SM
      </Button>
      <Button size="md" uppercase={props.uppercase}>
        <TerminalIcon />
        MD
      </Button>
      <Button size="lg" uppercase={props.uppercase}>
        <TerminalIcon />
        LG
      </Button>
      <Button size="xl" uppercase={props.uppercase}>
        <TerminalIcon />
        XL
      </Button>
    </section>

    <h2 className="ladle-section-header">Icon Sizing</h2>
    <section className="ladle-section">
      <Button size="sm" isIcon>
        <TerminalIcon />
      </Button>
      <Button size="md" isIcon>
        <TerminalIcon />
      </Button>
      <Button size="lg" isIcon>
        <TerminalIcon />
      </Button>
      <Button size="xl" isIcon>
        <TerminalIcon />
      </Button>
    </section>

    <h2 className="ladle-section-header">Rounded</h2>
    <section className="ladle-section">
      <Button rounded="size">Size (matches size prop)</Button>
      <Button rounded="sm">SM</Button>
      <Button rounded="lg">LG</Button>
      <Button rounded="xl">XL</Button>
      <Button rounded="full">Full</Button>
      <Button rounded="none">None</Button>
    </section>

    <h2 className="ladle-section-header">Variant</h2>
    <section className="ladle-section">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="link">Link</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="active">Active</Button>
      <Button variant="inactive">Inactive</Button>
    </section>

    <h2 className="ladle-section-header">Loader</h2>
    <section className="ladle-section">
      <Button loader="icon" isLoading>
        Icon
      </Button>
      <Button loader="stripes" isLoading>
        Stripes
      </Button>
      <Button loader="stripes" isLoading variant="secondary">
        Stripes
      </Button>
      <Button loader="stripes" isLoading variant="outline">
        Stripes
      </Button>
      <Button loader="stripes" isLoading variant="destructive">
        Stripes
      </Button>
      <Button loader="stripes" isLoading variant="active">
        Stripes
      </Button>
      <Button loader="stripes" isLoading variant="inactive">
        Stripes
      </Button>
    </section>

    <h2 className="ladle-section-header">State</h2>
    <p>
      Buttons can accept a <code>state</code> prop that overrides the variant
      colors. This is useful when working with devices and mute states, where
      you want to keep a particular variant but change the color to match the
      state.
    </p>
    <section className="ladle-section">
      <Button variant="primary" state="default">
        Primary / Default
      </Button>
      <Button variant="primary" state="inactive">
        Primary / Inactive
      </Button>
      <Button variant="primary" state="active">
        Secondary / Default
      </Button>
      <Button variant="outline" state="active">
        Outline / Active
      </Button>
      <Button variant="outline" state="inactive">
        Outline / Inactive
      </Button>
    </section>
  </div>
);

ButtonPrimary.args = {
  state: "default",
  disabled: false,
  isLoading: false,
  rounded: "size",
};

ButtonPrimary.argTypes = {
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
  uppercase: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  noContainerQueries: {
    control: { type: "boolean" },
    defaultValue: false,
  },
};

ButtonPrimary.storyName = "Button";
