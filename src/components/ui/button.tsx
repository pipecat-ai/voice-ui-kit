import buttonVariants from "@/components/ui/buttonVariants";
import { LoaderIcon } from "@/icons";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

export function Button({
  className,
  variant,
  size,
  isIcon,
  isLoading = false,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    isLoading?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  if (isLoading) {
    return (
      <Comp
        data-slot="button"
        className={cn(buttonVariants({ variant, size, isIcon, className }))}
        {...props}
        disabled
      >
        <LoaderIcon className="vkui:animate-spin" />
        {props.children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, isIcon, className }))}
      {...props}
    />
  );
}

export default Button;
