import type { Story, StoryDefault } from "@ladle/react";
import { TriangleAlertIcon } from "lucide-react";
import { Badge, type BadgeProps } from "./badge";
import { Button } from "./button";
import { Progress } from "./progress";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<BadgeProps> = ({ ...props }) => (
  <div className="ladle-section-container">
    <Badge {...props}>Badge</Badge>
    <Badge {...props} className="w-full">
      full width
    </Badge>
    <h2 className="ladle-section-header">Sizes</h2>
    <section className="ladle-section">
      <Badge {...props} color="secondary" size="sm">
        SM
      </Badge>
      <Badge {...props} color="secondary" size="md">
        MD
      </Badge>
      <Badge {...props} color="secondary" size="lg">
        LG
      </Badge>
    </section>
    <h2 className="ladle-section-header">Rounded</h2>
    <section className="ladle-section">
      <Badge {...props} color="secondary" rounded="size">
        Size (matches size prop)
      </Badge>
      <Badge {...props} color="secondary" rounded="sm">
        SM
      </Badge>
      <Badge {...props} color="secondary" rounded="md">
        MD
      </Badge>
      <Badge {...props} color="secondary" rounded="lg">
        LG
      </Badge>
      <Badge {...props} color="secondary" rounded="full">
        Full
      </Badge>
      <Badge {...props} color="secondary" rounded="none">
        None
      </Badge>
    </section>
    <h2 className="ladle-section-header">Colors</h2>
    <section className="ladle-section">
      <Badge {...props} color="primary">
        Primary
      </Badge>
      <Badge {...props} color="secondary">
        Secondary
      </Badge>
      <Badge {...props} color="destructive">
        Destructive
      </Badge>
      <Badge {...props} color="warning">
        Warning
      </Badge>
      <Badge {...props} color="active">
        Active
      </Badge>
      <Badge {...props} color="inactive">
        Inactive
      </Badge>
      <Badge {...props} color="agent">
        Agent
      </Badge>
      <Badge {...props} color="client">
        Client
      </Badge>
    </section>
    <section className="ladle-section">
      <Badge {...props} color="primary" variant="filled">
        Primary
      </Badge>
      <Badge {...props} color="secondary" variant="filled">
        Secondary
      </Badge>
      <Badge {...props} color="destructive" variant="filled">
        Destructive
      </Badge>
      <Badge {...props} color="warning" variant="filled">
        Warning
      </Badge>
      <Badge {...props} color="active" variant="filled">
        Active
      </Badge>
      <Badge {...props} color="inactive" variant="filled">
        Inactive
      </Badge>
      <Badge {...props} color="agent" variant="filled">
        Agent
      </Badge>
      <Badge {...props} color="client" variant="filled">
        Client
      </Badge>
    </section>
    <section className="ladle-section">
      <Badge {...props} color="primary" variant="outline">
        Primary
      </Badge>
      <Badge {...props} color="secondary" variant="outline">
        Secondary
      </Badge>
      <Badge {...props} color="destructive" variant="outline">
        Destructive
      </Badge>
      <Badge {...props} color="warning" variant="outline">
        Warning
      </Badge>
      <Badge {...props} color="active" variant="outline">
        Active
      </Badge>
      <Badge {...props} color="inactive" variant="outline">
        Inactive
      </Badge>
      <Badge {...props} color="agent" variant="outline">
        Agent
      </Badge>
      <Badge {...props} color="client" variant="outline">
        Client
      </Badge>
    </section>
    <h2 className="ladle-section-header">Variants</h2>
    <section className="ladle-section">
      <Badge {...props} variant="outline">
        Outline
      </Badge>
      <Badge {...props} variant="filled">
        Filled
      </Badge>
      <Badge {...props} variant="elbow">
        Elbow Variant
      </Badge>
      <Badge {...props} variant="elbow" color="active">
        Elbow Variant with Color
      </Badge>
      <Badge {...props} variant="bracket">
        Bracket Variant
      </Badge>
      <Badge {...props} variant="bracket" color="active">
        Bracket Variant with Color
      </Badge>
    </section>
    <h2 className="ladle-section-header">With Progress and Icon</h2>
    <section className="ladle-section">
      <Badge {...props}>
        <Progress percent={50} className="h-[3px]" color={props.color} />
        Badge with progress
      </Badge>
      <Badge {...props}>
        <TriangleAlertIcon />
        Badge with icon
      </Badge>
    </section>
    <section className="ladle-section">
      <Badge {...props} size="sm">
        <Progress percent={50} className="h-[3px]" color={props.color} />
        Badge with progress
      </Badge>
      <Badge {...props} size="sm">
        <TriangleAlertIcon />
        Badge with icon
      </Badge>
    </section>
    <section className="ladle-section">
      <Badge {...props} size="lg">
        <Progress percent={50} className="h-[3px]" color={props.color} />
        Badge with progress
      </Badge>
      <Badge {...props} size="lg">
        <TriangleAlertIcon />
        Badge with icon
      </Badge>
    </section>
    <h2 className="ladle-section-header">Button Sizing</h2>
    <section className="ladle-section">
      <Badge {...props} buttonSizing>
        Sized to button
      </Badge>
      <Button variant="outline">Button for reference</Button>
    </section>
    <section className="ladle-section">
      <Badge {...props} buttonSizing size="sm">
        Sized to button
      </Badge>
      <Button variant="outline" size="sm">
        Button for reference
      </Button>
    </section>
    <section className="ladle-section">
      <Badge {...props} buttonSizing size="md">
        <TriangleAlertIcon />
        Sized to button
      </Badge>
      <Button variant="outline" size="md">
        <TriangleAlertIcon />
        Button for reference
      </Button>
    </section>
    <section className="ladle-section">
      <Badge {...props} buttonSizing size="sm">
        <TriangleAlertIcon />
        Sized to button
      </Badge>
      <Button variant="outline" size="sm">
        <TriangleAlertIcon />
        Button for reference
      </Button>
    </section>
    <section className="ladle-section">
      <Badge {...props} buttonSizing size="lg">
        <TriangleAlertIcon />
        Sized to button
      </Badge>
      <Button variant="outline" size="lg">
        <TriangleAlertIcon />
        Button for reference
      </Button>
    </section>
  </div>
);

Default.argTypes = {
  size: {
    options: ["md", "sm", "lg"],
    control: { type: "select" },
    defaultValue: "md",
  },
  color: {
    options: [
      "primary",
      "secondary",
      "destructive",
      "active",
      "inactive",
      "warning",
      "agent",
      "client",
    ],
    control: { type: "select" },
    defaultValue: "primary",
  },
  variant: {
    options: ["default", "outline", "filled", "elbow", "bracket"],
    control: { type: "select" },
    defaultValue: "default",
  },
  rounded: {
    options: ["size", "none", "sm", "md", "lg", "full"],
    control: { type: "select" },
    defaultValue: "size",
  },
  uppercase: {
    control: { type: "boolean" },
    defaultValue: false,
  },
};

Default.storyName = "Badge";
