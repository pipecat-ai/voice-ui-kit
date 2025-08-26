import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "border file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-md transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "border-input bg-transparent px-3 text-foreground dark:bg-input/30",
        secondary:
          "border-input bg-background text-foreground focus-visible:ring-0",
        destructive:
          "border-destructive bg-destructive/10 text-destructive-foreground focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 focus-visible:border-destructive",
        ghost:
          "border-input text-foreground bg-background/20 focus-visible:bg-black",
      },
      size: {
        sm: "h-7 px-2.5 py-1 text-sm",
        default: "h-8 px-3 py-1",
        lg: "h-10 px-3 py-2 rounded-lg",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

export function Input({
  className,
  type,
  variant,
  size,
  ...props
}: Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ size, variant, className }))}
      {...props}
    />
  );
}

export default Input;
