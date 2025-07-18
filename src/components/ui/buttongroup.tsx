import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const buttonGroupVariants = cva(
  "vkui:flex vkui:items-center vkui:button-group",
  {
    variants: {
      orientation: {
        horizontal:
          "vkui:flex-row vkui:*:first:rounded-e-none vkui:*:last:rounded-s-none vkui:*:-ml-[1px] vkui:*:first:ml-0",
        vertical:
          "vkui:flex-col vkui:*:first:rounded-b-none vkui:*:last:rounded-t-none vkui:*:-mt-[1px] vkui:*:first:mt-0 vkui:*:self-stretch",
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

export default ButtonGroup;
