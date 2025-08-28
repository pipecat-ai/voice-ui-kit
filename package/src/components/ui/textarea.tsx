import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";
import { inputVariants } from "./inputVariants";

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
    Omit<VariantProps<typeof inputVariants>, "size"> {
  size?: VariantProps<typeof inputVariants>["size"];
  multiline?: boolean;
}

const textareaVariants = cva(
  "field-sizing-content disabled:cursor-not-allowed box-border h-auto",
  {
    variants: {
      size: {
        sm: "py-0.75",
        md: "py-1.25",
        lg: "py-2.25",
        xl: "py-3.25",
      },
      multiline: {
        true: "resize-y",
        false: "resize-none",
      },
    },
  },
);

function Textarea({
  className,
  size,
  variant,
  rounded = "size",
  multiline = true,
  ...props
}: TextareaProps) {
  const roundedValue = rounded === "size" ? size : rounded;
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        inputVariants({ size, variant, rounded: roundedValue, className }),
        textareaVariants({ size, multiline, className }),
      )}
      {...props}
    />
  );
}

export { Textarea };
