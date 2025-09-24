import buttonVariants from "@/components/ui/buttonVariants";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { LoaderIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Omit<
      VariantProps<typeof buttonVariants>,
      "variant" | "size" | "rounded" | "state"
    > {
  asChild?: boolean;
  isLoading?: boolean;
  isFullWidth?: boolean;
  loader?: "icon" | "stripes";
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  rounded?: VariantProps<typeof buttonVariants>["rounded"];
  state?: VariantProps<typeof buttonVariants>["state"];
  noContainerQueries?: boolean;
}

export function Button({
  className,
  variant,
  size,
  rounded,
  state,
  isIcon,
  isLoading = false,
  isFullWidth = false,
  uppercase = false,
  noContainerQueries = false,
  asChild = false,
  loader = "icon",
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  if (isLoading) {
    return (
      <Comp
        data-slot="button"
        className={cn(
          buttonVariants({
            variant,
            size,
            rounded,
            state,
            isIcon,
            isFullWidth,
            loader,
            uppercase,
            noContainerQueries,
          }),
          className,
        )}
        {...props}
        disabled
      >
        {loader === "icon" && <LoaderIcon className="animate-spin" />}
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          rounded,
          state,
          isIcon,
          isFullWidth,
          uppercase,
          noContainerQueries,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
