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
  "field-sizing-content h-auto disabled:cursor-not-allowed",
  {
    variants: {
      size: {
        sm: "py-1",
        md: "py-1.5",
        lg: "py-2",
        xl: "py-2.5",
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
  rounded,
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
