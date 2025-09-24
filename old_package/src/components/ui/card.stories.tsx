import {
  Card,
  CardContent,
  CardHeader,
  CardProps,
  CardTitle,
} from "@/components/ui/card";
import type { Story, StoryDefault } from "@ladle/react";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<CardProps> = (props) => (
  <div className="ladle-section-container-full">
    <Card {...props}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>Card Content 1</CardContent>
      <CardContent>Card Content 2</CardContent>
    </Card>

    <h2 className="ladle-section-header">Variants</h2>

    <Card {...props} variant="destructive">
      <CardHeader>
        <CardTitle>Destructive Variant</CardTitle>
      </CardHeader>
      <CardContent>Card Content</CardContent>
    </Card>

    <Card {...props} variant="success">
      <CardHeader>
        <CardTitle>Success Variant</CardTitle>
      </CardHeader>
      <CardContent>Card Content</CardContent>
    </Card>

    <h2 className="ladle-section-header">Backgrounds</h2>

    <Card background="grid">
      <CardHeader>
        <CardTitle>Grid Background</CardTitle>
      </CardHeader>
      <CardContent>Card Content</CardContent>
    </Card>

    <Card background="scanlines">
      <CardHeader>
        <CardTitle>Scanlines Background</CardTitle>
      </CardHeader>
      <CardContent>Card Content</CardContent>
    </Card>

    <Card background="stripes">
      <CardHeader>
        <CardTitle>Stripes!</CardTitle>
      </CardHeader>
      <CardContent>I am very important</CardContent>
    </Card>

    <Card background="stripes" variant="destructive">
      <CardHeader>
        <CardTitle>Destructive Stripes!</CardTitle>
      </CardHeader>
      <CardContent>Oh no</CardContent>
    </Card>

    <Card background="stripes" variant="success">
      <CardHeader>
        <CardTitle>Success Stripes!</CardTitle>
      </CardHeader>
      <CardContent>Oh yey</CardContent>
    </Card>

    <h2 className="ladle-section-header">Rounded</h2>
    <Card {...props}>
      <CardHeader>
        <CardTitle>Default (match size)</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} rounded="none">
      <CardHeader>
        <CardTitle>No Rounded Corners</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} rounded="sm">
      <CardHeader>
        <CardTitle>No Rounded Corners</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} rounded="md">
      <CardHeader>
        <CardTitle>No Rounded Corners</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} rounded="lg">
      <CardHeader>
        <CardTitle>No Rounded Corners</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} rounded="xl">
      <CardHeader>
        <CardTitle>No Rounded Corners</CardTitle>
      </CardHeader>
    </Card>

    <h2 className="ladle-section-header">Shadows</h2>
    <Card {...props} shadow="none">
      <CardHeader>
        <CardTitle>No Shadow</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} shadow="xshort">
      <CardHeader>
        <CardTitle>X-Short Shadow</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} shadow="short">
      <CardHeader>
        <CardTitle>Short Shadow</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} shadow="long">
      <CardHeader>
        <CardTitle>Long Shadow</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} shadow="xlong">
      <CardHeader>
        <CardTitle>X-Long Shadow</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} variant="destructive" shadow="short">
      <CardHeader>
        <CardTitle>Destructive Short Shadow</CardTitle>
      </CardHeader>
    </Card>
    <Card {...props} variant="success" shadow="short">
      <CardHeader>
        <CardTitle>Success Short Shadow</CardTitle>
      </CardHeader>
    </Card>

    <h2 className="ladle-section-header">With Elbows</h2>
    <Card {...props} withElbows={true}>
      <CardHeader>
        <CardTitle>With Elbows</CardTitle>
      </CardHeader>
      <CardContent>Note: rounded is ignored</CardContent>
    </Card>
    <h2 className="ladle-section-header">With Gradient Border</h2>
    <Card {...props} withGradientBorder shadow="xlong">
      <CardHeader>
        <CardTitle>
          With Gradient Border (makes shadow stand out more)
        </CardTitle>
      </CardHeader>
    </Card>
  </div>
);

Default.argTypes = {
  size: {
    options: ["sm", "md", "lg", "xl"],
    control: { type: "select" },
    defaultValue: "md",
  },
  shadow: {
    options: ["none", "xshort", "short", "long", "xlong"],
    control: { type: "select" },
    defaultValue: "none",
  },
  background: {
    options: ["none", "scanlines", "grid", "stripes"],
    control: { type: "select" },
    defaultValue: "none",
  },
  rounded: {
    options: ["none", "size", "sm", "md", "lg", "xl"],
    control: { type: "select" },
  },
  variant: {
    options: ["default", "destructive", "success"],
    control: { type: "select" },
    defaultValue: "default",
  },
  withGradientBorder: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  withElbows: {
    control: { type: "boolean" },
    defaultValue: false,
  },
  className: {
    control: { type: "text" },
    defaultValue: "",
  },
};

Default.storyName = "Card";
