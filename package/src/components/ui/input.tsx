import { cn } from "@/lib/utils";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { inputVariants } from "./inputVariants";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    Omit<VariantProps<typeof inputVariants>, "size"> {
  size?: VariantProps<typeof inputVariants>["size"];
}

export function Input({
  className,
  type,
  variant,
  size,
  rounded,
  ...props
}: InputProps) {
  const roundedValue = rounded === "size" ? size : rounded;
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        inputVariants({ size, variant, rounded: roundedValue, className }),
      )}
      {...props}
    />
  );
}

export default Input;
