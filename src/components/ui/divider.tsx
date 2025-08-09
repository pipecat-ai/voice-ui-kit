import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const dividerVariants = cva("vkui:relative vkui:items-center", {
  variants: {
    orientation: {
      horizontal: "vkui:h-px vkui:w-full",
      vertical: "vkui:w-px vkui:h-full",
    },
    color: {
      default: "vkui:bg-primary",
      secondary: "vkui:bg-border",
      destructive: "vkui:bg-destructive",
      active: "vkui:bg-active",
      inactive: "vkui:bg-inactive",
      warning: "vkui:bg-warning",
    },
    thickness: {
      thin: "vkui:h-[1px]",
      medium: "vkui:h-[2px]",
      thick: "vkui:h-[3px]",
    },
    variant: {
      solid: "",
      dotted:
        "vkui:bg-transparent vkui:bg-[repeating-linear-gradient(to_right,currentColor,currentColor_2px,transparent_2px,transparent_6px)] vkui:bg-[length:6px_100%]",
      dashed:
        "vkui:bg-transparent vkui:bg-[repeating-linear-gradient(to_right,currentColor,currentColor_20px,transparent_20px,transparent_40px)] vkui:bg-[length:40px_100%]",
    },
    decoration: {
      none: "",
      plus: "vkui:mx-[12px] vkui:w-auto vkui:before:content-['+'] vkui:before:absolute vkui:before:left-0 vkui:before:top-0 vkui:before:-translate-y-1/2 vkui:before:text-[12px] vkui:before:ml-[-12px] vkui:after:content-['+'] vkui:after:absolute vkui:after:right-0 vkui:after:top-0 vkui:after:-translate-y-1/2 vkui:after:text-[12px] vkui:after:mr-[-12px]",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    thickness: "thin",
    variant: "solid",
    color: "secondary",
  },
  compoundVariants: [
    {
      orientation: "vertical",
      thickness: "thin",
      className: "vkui:h-full vkui:w-[1px]",
    },
    {
      orientation: "vertical",
      thickness: "medium",
      className: "vkui:h-full vkui:w-[2px]",
    },
    {
      orientation: "vertical",
      thickness: "thick",
      className: "vkui:h-full vkui:w-[3px]",
    },
    {
      orientation: "vertical",
      variant: "dashed",
      className:
        "vkui:bg-[repeating-linear-gradient(to_bottom,currentColor,currentColor_20px,transparent_20px,transparent_40px)] vkui:bg-[length:100%_40px]",
    },
    {
      orientation: "vertical",
      variant: "dotted",
      className:
        "vkui:bg-[repeating-linear-gradient(to_bottom,currentColor,currentColor_2px,transparent_2px,transparent_6px)] vkui:bg-[length:6px_100%]",
    },
    {
      variant: ["dotted", "dashed"],
      color: "default",
      className: "vkui:text-primary",
    },
    {
      variant: ["dotted", "dashed"],
      color: "secondary",
      className: "vkui:text-border",
    },
    {
      variant: ["dotted", "dashed"],
      color: "destructive",
      className: "vkui:text-destructive",
    },
    {
      variant: ["dotted", "dashed"],
      color: "active",
      className: "vkui:text-active",
    },
    {
      variant: ["dotted", "dashed"],
      color: "inactive",
      className: "vkui:text-inactive",
    },
    {
      variant: ["dotted", "dashed"],
      color: "warning",
      className: "vkui:text-warning",
    },
    {
      decoration: "plus",
      thickness: "medium",
      className:
        "vkui:mx-[14px] vkui:before:ml-[-14px] vkui:after:mr-[-14px] vkui:before:text-[14px] vkui:after:text-[14px] vkui:before:font-bold vkui:after:font-bold",
    },
    {
      decoration: "plus",
      thickness: "thick",
      className:
        "vkui:px-[20px] vkui:before:ml-[-20px] vkui:after:mr-[-20px] vkui:before:text-[20px] vkui:after:text-[20px] vkui:before:font-bold vkui:after:font-bold",
    },
  ],
});

const dividerChildrenVariants = cva("", {
  variants: {
    color: {
      default: "vkui:text-foreground",
      secondary: "vkui:text-foreground",
      destructive: "vkui:text-destructive",
      active: "vkui:text-active",
      inactive: "vkui:text-inactive",
      warning: "vkui:text-warning",
      success: "vkui:text-success",
    },
    noUppercase: {
      true: "vkui:uppercase-none",
      false: "vkui:uppercase vkui:tracking-widest vkui:text-sm",
    },
  },
});

export const Divider = ({
  children,
  color = "secondary",
  decoration,
  thickness = "thin",
  orientation = "horizontal",
  variant = "solid",
  className,
  childrenClassName,
  noUppercase = true,
  ...props
}: VariantProps<typeof dividerVariants> &
  VariantProps<typeof dividerChildrenVariants> &
  React.ComponentProps<"div"> & {
    childrenClassName?: string;
  }) => {
  if (children) {
    return (
      <div
        className={cn(
          "vkui:flex vkui:items-center vkui:justify-center vkui:gap-4 vkui:w-full",
          className,
        )}
      >
        <span
          className={cn(
            dividerVariants({
              color,
              thickness,
              variant,
              className,
            }),
          )}
          {...props}
        />
        <span
          className={cn(
            dividerChildrenVariants({ color, noUppercase }),
            childrenClassName,
          )}
        >
          {children}
        </span>
        <span
          className={cn(
            dividerVariants({
              color,
              thickness,
              orientation,
              variant,
              decoration,
              className,
            }),
          )}
          {...props}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        dividerVariants({
          color,
          thickness,
          orientation,
          variant,
          decoration,
          className,
        }),
      )}
      {...props}
    />
  );
};
