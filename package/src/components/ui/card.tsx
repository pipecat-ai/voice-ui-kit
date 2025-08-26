import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const cardVariants = cva(
  "text-card-foreground flex flex-col bg-card border-(length:--border-width-element) border-border",
  {
    variants: {
      variant: {
        default: "",
        destructive:
          "shadow-destructive/10 dark:shadow-destructive/15 border-destructive text-destructive-foreground bg-destructive/[.05] [--color-elbow:var(--color-destructive-foreground)]",
        success:
          "shadow-active/10 dark:shadow-active/15 border-active text-active bg-active-accent [--color-elbow:var(--color-active-foreground)]",
      },
      background: {
        none: "",
        scanlines: "bg-scanlines",
        grid: "bg-grid",
        stripes: "bg-stripes shrink-0",
      },
      size: {
        md: "py-element-md gap-element-md [&_*[data-slot^=card-]:not([data-slot^=card-title])]:px-element-md",
        sm: "py-element-sm gap-element-sm [&_*[data-slot^=card-]:not([data-slot^=card-title])]:px-element-md",
        lg: "py-element-lg gap-element-lg [&_*[data-slot^=card-]:not([data-slot^=card-title])]:px-element-lg",
        xl: "py-element-xl gap-element-xl [&_*[data-slot^=card-]:not([data-slot^=card-title])]:px-element-xl",
      },
      rounded: {
        none: "",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
      },
      shadow: {
        none: "",
        xshort: "shadow-xshort",
        short: "shadow-short",
        long: "shadow-long",
        xlong: "shadow-xlong",
      },
      withElbows: {
        false: "",
        true: "elbow",
      },
      withGradientBorder: {
        false: "",
        true: "",
      },
    },
    compoundVariants: [
      {
        size: "sm",
        withElbows: false,
        className: "[--elbow-size:var(--text-xs)]",
      },
      {
        size: "lg",
        withElbows: false,
        className: "[--elbow-size:var(--text-lg)]",
      },
      {
        size: "xl",
        withElbows: false,
        className: "[--elbow-size:var(--text-xl)]",
      },
      {
        size: "sm",
        background: "stripes",
        className:
          "[--stripe-border-size:calc(var(--text-base)/2)] [--stripe-inset:calc(var(--stripe-border-size)/2)]",
      },
      {
        variant: "destructive",
        background: "stripes",
        className: "[--stripe-color:var(--color-destructive)]",
      },
      {
        variant: "success",
        background: "stripes",
        className: "[--stripe-color:var(--color-active)]",
      },
      {
        rounded: ["sm", "md", "lg", "xl"],
        withElbows: true,
        className: "rounded-none",
      },
      {
        variant: "default",
        withGradientBorder: true,
        className:
          "border border-transparent bg-origin-border borderclip bg-cardGradientBorder",
      },
    ],

    defaultVariants: {
      size: "md",
      shadow: "none",
      variant: "default",
      background: "none",
      withElbows: false,
      withGradientBorder: false,
    },
  },
);

export type CardProps = React.ComponentProps<"div"> &
  Omit<VariantProps<typeof cardVariants>, "rounded"> & {
    withGradientBorder?: boolean;
    rounded?: VariantProps<typeof cardVariants>["rounded"];
  };

export function Card({
  variant,
  className,
  withGradientBorder = false,
  withElbows = false,
  size = "md",
  rounded,
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
          withElbows,
          withGradientBorder,
        }),
        className,
      )}
      {...props}
    />
  );
}

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex gap-1.5", className)}
      {...props}
    />
  );
}

export type CardTitleProps = React.HTMLAttributes<HTMLDivElement>;

export function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-semibold leading-none", className)}
      {...props}
    />
  );
}

export type CardDescriptionProps = React.HTMLAttributes<HTMLDivElement>;

export function CardDescription({ className, ...props }: CardDescriptionProps) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export type CardActionProps = React.HTMLAttributes<HTMLDivElement>;

export function CardAction({ className, ...props }: CardActionProps) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

export type CardContentProps = React.HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...props }: CardContentProps) {
  return (
    <div data-slot="card-content" className={cn("", className)} {...props} />
  );
}

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, ...props }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex gap-card px-[calc(var(--card-padding)/2)] py-[calc(var(--card-padding)/2)]",
        className,
      )}
      {...props}
    />
  );
}
