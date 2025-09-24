import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonGroupVariants = cva("flex items-center", {
  variants: {
    orientation: {
      horizontal:
        "flex-row *:not-first:not-last:rounded-none *:first:not-only:rounded-e-none *:last:not-only:rounded-s-none *:not-first:not-last:border-x-0",
      vertical:
        "flex-col *:not-first:not-last:rounded-none *:first:not-only:rounded-b-none *:last:not-only:rounded-t-none *:not-first:not-last:border-y-0 *:self-stretch",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
  },
});

export const ButtonGroup = ({
  className,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) => {
  return (
    <div
      className={cn("flex", buttonGroupVariants({ orientation }), className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default ButtonGroup;
