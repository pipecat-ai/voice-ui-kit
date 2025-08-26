import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const progressVariants = cva(
  `inline-flex overflow-hidden bg-white min-h-[1px] h-full relative shrink-0 grow-0
  "after:absolute after:top-0 after:left-0 after:bottom-0 after:w-[var(--progress-width)]`,
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
        primary: "bg-primary/20 after:bg-primary",
        secondary: "bg-secondary/20 after:bg-secondary",
        destructive: "bg-destructive/20 after:bg-destructive",
        warning: "bg-warning/20 after:bg-warning",
        active: "bg-active/20 after:bg-active",
        inactive: "bg-inactive/20 after:bg-inactive",
        agent: "bg-agent/20 after:bg-agent",
        client: "bg-client/20 after:bg-client",
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

export const Progress = ({
  size,
  className,
  color,
  rounded,
  ...props
}: ProgressProps) => {
  return (
    <div
      className={cn(progressVariants({ size, color, rounded, className }))}
      {...props}
      style={
        {
          "--progress-width": `${props.percent}%`,
        } as React.CSSProperties
      }
    />
  );
};
