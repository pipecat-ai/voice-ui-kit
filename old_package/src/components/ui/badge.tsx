import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "shrink-0 [&_svg]:shrink-0 self-start items-center border text-xs font-semibold justify-center",
  {
    variants: {
      color: {
        primary: "bg-primary/10 text-primary border-primary",
        secondary: "bg-secondary text-secondary-foreground/80 border-border",
        destructive: "bg-destructive/10 text-destructive border-destructive",
        active: "bg-active/10 text-active border-active",
        inactive: "bg-inactive/10 text-inactive border-inactive",
        warning: "bg-warning/10 text-warning border-warning",
        agent: "bg-agent/10 text-agent border-agent",
        client: "bg-client/10 text-client border-client",
      },
      variant: {
        default: "",
        outline: "bg-transparent",
        filled: "",
        elbow: "elbow border-transparent",
        bracket: "elbow border-transparent",
      },
      size: {
        sm: "text-xs px-2 gap-1 py-0.5 [&_svg:not([class*='size-'])]:size-2.5",
        md: "text-xs px-3 gap-1.5 py-1 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "text-sm px-4 gap-2.5 py-2 [&_svg:not([class*='size-'])]:size-4",
      },
      uppercase: {
        false: "",
        true: "uppercase tracking-wider",
      },
      buttonSizing: {
        true: "flex",
        false: "inline-flex",
      },
      rounded: {
        size: "",
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    compoundVariants: [
      // Text size adjustments for uppercase variants
      {
        uppercase: true,
        size: "md",
        className: "text-[11px]",
      },
      {
        uppercase: true,
        size: "sm",
        className: "text-[10px]",
      },
      {
        uppercase: true,
        size: "lg",
        className: "text-xs",
      },
      // Filled variant styles
      {
        variant: "filled",
        color: "primary",
        className: "bg-primary/100 text-primary-foreground border-primary",
      },
      {
        variant: "filled",
        color: "secondary",
        className:
          "bg-secondary/100 text-secondary-foreground border-secondary",
      },
      {
        variant: "filled",
        color: "destructive",
        className:
          "bg-destructive/100 text-destructive-foreground border-destructive",
      },
      {
        variant: "filled",
        color: "warning",
        className: "bg-warning/100 text-warning-foreground border-warning",
      },
      {
        variant: "filled",
        color: "active",
        className: "bg-active/100 text-active-foreground border-active",
      },
      {
        variant: "filled",
        color: "inactive",
        className: "bg-inactive/100 text-inactive-foreground border-inactive",
      },
      {
        variant: "filled",
        color: "agent",
        className: "bg-agent/100 text-agent-foreground border-agent",
      },
      {
        variant: "filled",
        color: "client",
        className: "bg-client/100 text-client-foreground border-client",
      },
      // Elbow/Bracket size variants
      {
        variant: "elbow",
        size: "md",
        className: "[--elbow-size:6px]",
      },
      {
        variant: "elbow",
        size: "sm",
        className: "[--elbow-size:4px]",
      },
      {
        variant: "elbow",
        size: "lg",
        className: "[--elbow-size:8px]",
      },
      {
        variant: "bracket",
        size: "sm",
        className: "[--elbow-size:12px]",
      },
      {
        variant: "bracket",
        size: "lg",
        className: "[--elbow-size:20px]",
      },
      // Elbow/Bracket color variants
      {
        variant: ["elbow", "bracket"],
        color: "primary",
        className: "[--color-elbow:var(--color-primary)]",
      },
      {
        variant: ["elbow", "bracket"],
        color: "secondary",
        className: "[--color-elbow:var(--color-secondary-foreground)]",
      },
      {
        variant: ["elbow", "bracket"],
        color: "destructive",
        className: "[--color-elbow:var(--color-destructive)]",
      },
      {
        variant: ["elbow", "bracket"],
        color: "active",
        className: "[--color-elbow:var(--color-active)]",
      },
      {
        variant: ["elbow", "bracket"],
        color: "inactive",
        className: "[--color-elbow:var(--color-inactive)]",
      },
      {
        variant: ["elbow", "bracket"],
        color: "warning",
        className: "[--color-elbow:var(--color-warning)]",
      },
      {
        variant: ["elbow", "bracket"],
        color: "agent",
        className: "[--color-elbow:var(--color-agent)]",
      },
      {
        variant: ["elbow", "bracket"],
        color: "client",
        className: "[--color-elbow:var(--color-client)]",
      },
      {
        variant: ["elbow", "bracket"],
        className: "rounded-none",
      },
      // Button sizing variants
      {
        buttonSizing: true,
        size: "md",
        className: "button-md [&_svg:not([class*='size-'])]:size-5",
      },
      {
        buttonSizing: true,
        size: "sm",
        className: "button-sm [&_svg:not([class*='size-'])]:size-4",
      },
      {
        buttonSizing: true,
        size: "lg",
        className: "button-lg [&_svg:not([class*='size-'])]:size-5",
      },
      // Rounded size variants
      {
        rounded: "size",
        size: "md",
        className: "rounded-md",
      },
      {
        rounded: "size",
        size: "sm",
        className: "rounded-sm",
      },
      {
        rounded: "size",
        size: "lg",
        className: "rounded-lg",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "md",
      rounded: "size",
      color: "primary",
    },
  },
);

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    Omit<VariantProps<typeof badgeVariants>, "color" | "uppercase"> {
  buttonSizing?: boolean;
  asChild?: boolean;
  color?: VariantProps<typeof badgeVariants>["color"];
  uppercase?: VariantProps<typeof badgeVariants>["uppercase"];
}

export function Badge({
  buttonSizing = false,
  children,
  className,
  color,
  uppercase = false,
  rounded,
  size,
  variant,
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? "span" : "div";

  return (
    <Comp
      className={cn(
        badgeVariants({
          variant,
          size,
          uppercase,
          color,
          buttonSizing,
          rounded,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
