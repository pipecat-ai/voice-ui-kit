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
  <div className="vkui:flex vkui:flex-col vkui:gap-4">
    <Card {...props}>
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
      </CardHeader>
      <CardContent>Card Content 1</CardContent>
      <CardContent>Card Content 2</CardContent>
    </Card>

    <Card variant="destructive" rounded="none">
      <CardHeader>
        <CardTitle>Destructive Card</CardTitle>
      </CardHeader>
      <CardContent>Card Content</CardContent>
    </Card>

    <Card background="grid" rounded="none">
      <CardHeader>
        <CardTitle>Grid Background</CardTitle>
      </CardHeader>
      <CardContent>Card Content</CardContent>
    </Card>

    <Card background="scanlines" rounded="none">
      <CardHeader>
        <CardTitle>Scanlines Background</CardTitle>
      </CardHeader>
      <CardContent>Card Content</CardContent>
    </Card>

    <Card background="stripes" rounded="none">
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
    options: ["none", "sm", "md", "lg", "xl"],
    control: { type: "select" },
  },
  variant: {
    options: ["default", "destructive"],
    control: { type: "radio" },
    defaultValue: "default",
  },
  noGradientBorder: {
    control: { type: "boolean" },
    defaultValue: true,
  },
  noElbows: {
    control: { type: "boolean" },
    defaultValue: true,
  },
  className: {
    control: { type: "text" },
    defaultValue: "",
  },
};

Default.storyName = "Card";
