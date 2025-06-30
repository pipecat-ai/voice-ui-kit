import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonGroupVariants = cva(
  "vkui:flex vkui:items-center vkui:*:rounded-none",
  {
    variants: {
      orientation: {
        horizontal:
          "vkui:flex-row vkui:*:first:rounded-s-md vkui:*:last:rounded-e-md vkui:*:-ml-[1px] vkui:*:first:ml-0",
        vertical:
          "vkui:flex-col vkui:*:first:rounded-t-md vkui:*:last:rounded-b-md vkui:*:-mt-[1px] vkui:*:first:mt-0",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  },
);

export const ButtonGroup = ({
  className,
  orientation = "horizontal",
  children,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) => {
  return (
    <div
      className={cn(
        "vkui:flex",
        buttonGroupVariants({ orientation }),
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
