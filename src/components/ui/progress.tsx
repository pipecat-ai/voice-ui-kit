"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const progressVariants = cva(
  `inline-flex overflow-hidden bg-white min-h-[1px] h-full relative shrink-0 grow-0
  [&>[data-slot=progress-indicator]]:absolute [&>[data-slot=progress-indicator]]:top-0 [&>[data-slot=progress-indicator]]:left-0 [&>[data-slot=progress-indicator]]:bottom-0 [&>[data-slot=progress-indicator]]:w-[var(--progress-width)]`,
  {
    variants: {
      size: {
        default: "w-10",
        xs: "w-2",
        sm: "w-5",
        lg: "w-15",
        xl: "w-20",
        half: "h-1/2 w-1/2",
      },
      color: {
        primary: "bg-primary/20 [&>[data-slot=progress-indicator]]:bg-primary",
        secondary:
          "bg-secondary/20 [&>[data-slot=progress-indicator]]:bg-secondary",
        destructive:
          "bg-destructive/20 [&>[data-slot=progress-indicator]]:bg-destructive",
        warning: "bg-warning/20 [&>[data-slot=progress-indicator]]:bg-warning",
        active: "bg-active/20 [&>[data-slot=progress-indicator]]:bg-active",
        inactive:
          "bg-inactive/20 [&>[data-slot=progress-indicator]]:bg-inactive",
        agent: "bg-agent/20 [&>[data-slot=progress-indicator]]:bg-agent",
        client: "bg-client/20 [&>[data-slot=progress-indicator]]:bg-client",
      },
      rounded: {
        true: "rounded-full",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      color: "primary",
    },
  },
);
export interface ProgressProps extends VariantProps<typeof progressVariants> {
  percent?: number;
  className?: string;
  rounded?: boolean;
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & ProgressProps
>(({ className, percent, size, color, rounded, ...props }, ref) => {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      data-slot="progress"
      className={cn(progressVariants({ size, color, rounded }), className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        style={
          { "--progress-width": `${percent || 0}%` } as React.CSSProperties
        }
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
