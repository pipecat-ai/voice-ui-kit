import * as React from "react";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const cardVariants = cva(
  "vkui:text-card-foreground vkui:flex vkui:flex-col vkui:bg-card vkui:border-(length:--vkui-border-width-element) vkui:border-border",
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "vkui:shadow-destructive/10 vkui:dark:shadow-destructive/15 vkui:border-destructive vkui:text-destructive-foreground vkui:bg-destructive/[.05] vkui:[--vkui-color-elbow:var(--vkui-color-destructive-foreground)]",
      },
      background: {
        none: "",
        scanlines: "vkui:bg-scanlines",
        grid: "vkui:bg-grid",
        stripes: "vkui:bg-stripes",
      },
      size: {
        md: "vkui:py-element-md vkui:gap-element-md vkui:[&_*[data-slot^=card-]:not([data-slot^=card-title])]:px-element-md",
        sm: "vkui:py-element-sm vkui:gap-element-sm vkui:[&_*[data-slot^=card-]:not([data-slot^=card-title])]:px-element-md",
        lg: "vkui:py-element-lg vkui:gap-element-xl vkui:[&_*[data-slot^=card-]:not([data-slot^=card-title])]:px-element-lg",
        xl: "vkui:py-element-xl vkui:gap-element-xl vkui:[&_*[data-slot^=card-]:not([data-slot^=card-title])]:px-element-xl",
      },
      rounded: {
        none: "",
        sm: "vkui:rounded-element-sm",
        md: "vkui:rounded-element-md",
        lg: "vkui:rounded-element-lg",
        xl: "vkui:rounded-element-xl",
      },
      shadow: {
        none: "",
        xshort: "vkui:shadow-xshort",
        short: "vkui:shadow-short",
        long: "vkui:shadow-long",
        xlong: "vkui:shadow-xlong",
      },
      noElbows: {
        true: "",
        false: "vkui:elbow",
      },
    },
    compoundVariants: [
      {
        size: "sm",
        noElbows: false,
        className: "vkui:[--vkui-elbow-size:var(--vkui-text-xs)]",
      },
      {
        size: "lg",
        noElbows: false,
        className: "vkui:[--vkui-elbow-size:var(--vkui-text-lg)]",
      },
      {
        size: "xl",
        noElbows: false,
        className: "vkui:[--vkui-elbow-size:var(--vkui-text-xl)]",
      },
      {
        size: "sm",
        background: "stripes",
        className:
          "vkui:[--vkui-stripe-border-size:calc(var(--vkui-text-base)/2)] vkui:[--vkui-stripe-inset:calc(var(--vkui-stripe-border-size)/2)]",
      },
      {
        variant: "destructive",
        background: "stripes",
        className: "vkui:[--vkui-stripe-color:var(--vkui-color-destructive)]",
      },
    ],

    defaultVariants: {
      size: "md",
      shadow: "none",
      variant: "default",
      background: "none",
    },
  },
);

export interface CardProps extends React.ComponentProps<"div"> {
  variant?: "default" | "destructive";
  noGradientBorder?: boolean;
  noElbows?: boolean;
  className?: string;
  background?: "none" | "scanlines" | "grid" | "stripes";
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: "none" | "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "xshort" | "short" | "long" | "xlong";
}

function Card({
  variant,
  className,
  noGradientBorder = true,
  noElbows = true,
  size = "md",
  rounded = "none",
  shadow = "none",
  background = "none",
  ...props
}: CardProps) {
  const roundedValue = rounded ?? size;

  return (
    <div
      data-slot="card"
      className={cn(
        cardVariants({
          variant,
          size,
          shadow,
          background,
          rounded: roundedValue,
          noElbows,
        }),
        variant === "default" &&
          !noGradientBorder &&
          "vkui:border vkui:border-transparent vkui:bg-origin-border vkui:borderclip vkui:bg-cardGradientBorder",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("vkui:flex vkui:gap-1.5", className)}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("vkui:font-semibold vkui:leading-none", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("vkui:text-muted-foreground vkui:text-sm", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "vkui:col-start-2 vkui:row-span-2 vkui:row-start-1 vkui:self-start vkui:justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("", className)} {...props} />
  );
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "vkui:flex vkui:gap-card vkui:px-[calc(var(--card-padding)/2)] vkui:py-[calc(var(--card-padding)/2)]",
        className,
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};
