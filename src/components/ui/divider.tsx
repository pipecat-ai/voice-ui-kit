import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { PlusIcon } from "lucide-react";

const dividerVariants = cva("relative items-center", {
  variants: {
    orientation: {
      horizontal: "h-px w-full",
      vertical: "w-px h-full",
    },
    color: {
      primary: "bg-primary",
      secondary: "bg-border",
      destructive: "bg-destructive",
      active: "bg-active",
      inactive: "bg-inactive",
      warning: "bg-warning",
    },
    thickness: {
      thin: "h-[1px]",
      medium: "h-[2px]",
      thick: "h-[3px]",
    },
    variant: {
      solid: "",
      dotted:
        "bg-transparent bg-[repeating-linear-gradient(to_right,currentColor,currentColor_2px,transparent_2px,transparent_6px)] bg-[length:6px_100%]",
      dashed:
        "bg-transparent bg-[repeating-linear-gradient(to_right,currentColor,currentColor_20px,transparent_20px,transparent_40px)] bg-[length:40px_100%]",
    },
    size: {
      none: "my-0 mx-0",
      sm: "my-2 mx-2",
      md: "my-4 mx-4",
      lg: "my-8 mx-8",
      xl: "my-10 mx-10",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    thickness: "thin",
    variant: "solid",
    color: "secondary",
    size: "none",
  },
  compoundVariants: [
    {
      orientation: "vertical",
      thickness: "thin",
      className: "h-full w-[1px]",
    },
    {
      orientation: "vertical",
      thickness: "medium",
      className: "h-full w-[2px]",
    },
    {
      orientation: "vertical",
      thickness: "thick",
      className: "h-full w-[3px]",
    },
    {
      orientation: "vertical",
      variant: "dashed",
      className:
        "bg-[repeating-linear-gradient(to_bottom,currentColor,currentColor_20px,transparent_20px,transparent_40px)] bg-[length:100%_40px]",
    },
    {
      orientation: "vertical",
      variant: "dotted",
      className:
        "bg-[repeating-linear-gradient(to_bottom,currentColor,currentColor_2px,transparent_2px,transparent_6px)] bg-[length:6px_100%]",
    },
    {
      variant: ["dotted", "dashed"],
      color: "primary",
      className: "text-primary",
    },
    {
      variant: ["dotted", "dashed"],
      color: "secondary",
      className: "text-border",
    },
    {
      variant: ["dotted", "dashed"],
      color: "destructive",
      className: "text-destructive",
    },
    {
      variant: ["dotted", "dashed"],
      color: "active",
      className: "text-active",
    },
    {
      variant: ["dotted", "dashed"],
      color: "inactive",
      className: "text-inactive",
    },
    {
      variant: ["dotted", "dashed"],
      color: "warning",
      className: "text-warning",
    },
    // Size variants
    {
      size: ["sm", "md", "lg", "xl"],
      orientation: "horizontal",
      className: "mx-0",
    },
    {
      size: ["sm", "md", "lg", "xl"],
      orientation: "vertical",
      className: "my-0",
    },
  ],
});

const dividerChildrenVariants = cva("", {
  variants: {
    color: {
      primary: "text-foreground",
      secondary: "text-foreground",
      destructive: "text-destructive",
      active: "text-active",
      inactive: "text-inactive",
      warning: "text-warning",
    },
  },
});

const dividerDecorationVariants = cva("flex", {
  variants: {
    decoration: {
      plus: "text-foreground",
    },
    thickness: {
      thin: "[&_svg]:size-2.5 gap-1.5",
      medium: "[&_svg]:size-3 gap-2",
      thick: "[&_svg]:size-3.5 gap-2.5",
    },
    orientation: {
      horizontal: "flex flex-row items-center justify-center w-full",
      vertical: "flex flex-col items-center justify-center h-full",
    },
    color: {
      primary: "text-primary",
      secondary: "text-border",
      destructive: "text-destructive [&_svg]:text-destructive",
      active: "text-active [&_svg]:text-active",
      inactive: "text-inactive [&_svg]:text-inactive",
      warning: "text-warning [&_svg]:text-warning",
    },
  },
});

export interface DividerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof dividerVariants>,
    VariantProps<typeof dividerChildrenVariants> {
  childrenClassName?: string;
  color?: VariantProps<typeof dividerVariants>["color"];
  decoration?: "none" | "plus";
}

export function Divider({
  children,
  color = "secondary",
  decoration = "none",
  thickness = "thin",
  orientation = "horizontal",
  variant = "solid",
  size = "none",
  className,
  childrenClassName,
  ...props
}: DividerProps) {
  const innerContent = children ? (
    <div
      className={cn(
        orientation === "horizontal" &&
          "flex flex-row items-center justify-center gap-4 w-full",
        orientation === "vertical" &&
          "flex flex-col items-center justify-center gap-4 h-full",
        className,
      )}
    >
      <span
        className={cn(
          dividerVariants({
            color,
            thickness,
            variant,
            size,
            orientation,
          }),
        )}
        {...props}
      />
      <span
        className={cn(dividerChildrenVariants({ color }), childrenClassName)}
      >
        {children}
      </span>
      <span
        className={cn(
          dividerVariants({
            color,
            thickness,
            variant,
            size,
            orientation,
          }),
        )}
        {...props}
      />
    </div>
  ) : (
    <div
      className={cn(
        dividerVariants({
          color,
          thickness,
          orientation,
          variant,
          size,
        }),
        className,
      )}
      {...props}
    />
  );

  if (decoration === "none") {
    return innerContent;
  }

  return (
    <div
      className={dividerDecorationVariants({
        color,
        decoration,
        thickness,
        orientation,
      })}
    >
      <span>
        <PlusIcon
          strokeLinecap="square"
          strokeWidth={
            thickness === "thin" ? 2 : thickness === "medium" ? 3.5 : 4.5
          }
        />
      </span>
      {innerContent}
      <span>
        <PlusIcon
          strokeLinecap="square"
          strokeWidth={
            thickness === "thin" ? 2 : thickness === "medium" ? 3.5 : 4.5
          }
        />
      </span>
    </div>
  );
}
