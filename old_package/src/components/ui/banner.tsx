"use client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { type LucideIcon, XIcon } from "lucide-react";
import {
  type ComponentProps,
  createContext,
  type HTMLAttributes,
  type MouseEventHandler,
  useContext,
} from "react";
type BannerContextProps = {
  show: boolean;
  setShow: (show: boolean) => void;
};
const BannerContext = createContext<BannerContextProps>({
  show: true,
  setShow: () => {},
});
export type BannerProps = HTMLAttributes<HTMLDivElement> & {
  visible?: boolean;
  defaultVisible?: boolean;
  onClose?: () => void;
  inset?: boolean;
  variant?: "primary" | "destructive";
};
export const Banner = ({
  children,
  visible,
  defaultVisible = true,
  variant = "primary",
  onClose,
  className,
  inset = false,
  ...props
}: BannerProps) => {
  const [show, setShow] = useControllableState({
    defaultProp: defaultVisible,
    prop: visible,
    onChange: onClose,
  });
  if (!show) {
    return null;
  }
  return (
    <BannerContext.Provider value={{ show, setShow }}>
      <div
        className={cn(
          "flex w-full font-semibold items-center justify-between gap-2 bg-primary px-2 py-1 text-primary-foreground",
          inset && "rounded-lg",
          variant === "destructive" && "bg-destructive text-white",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </BannerContext.Provider>
  );
};
export type BannerIconProps = HTMLAttributes<HTMLDivElement> & {
  icon: LucideIcon;
};
export const BannerIcon = ({
  icon: Icon,
  className,
  ...props
}: BannerIconProps) => (
  <div
    className={cn(
      "rounded-full bg-foreground/10 dark:bg-foreground/30 p-1",
      className,
    )}
    {...props}
  >
    <Icon size={16} />
  </div>
);
export type BannerTitleProps = HTMLAttributes<HTMLParagraphElement>;
export const BannerTitle = ({ className, ...props }: BannerTitleProps) => (
  <p className={cn("flex-1 text-sm", className)} {...props} />
);
export type BannerActionProps = ComponentProps<typeof Button>;
export const BannerAction = ({
  variant = "ghost",
  size = "sm",
  className,
  ...props
}: BannerActionProps) => (
  <Button
    className={cn(
      "shrink-0 bg-transparent hover:bg-background/10 hover:text-background",
      className,
    )}
    size={size}
    variant={variant}
    {...props}
  />
);
export type BannerCloseProps = ComponentProps<typeof Button>;
export const BannerClose = ({
  variant = "ghost",
  size = "sm",
  onClick,
  className,
  ...props
}: BannerCloseProps) => {
  const { setShow } = useContext(BannerContext);
  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    setShow(false);
    onClick?.(e);
  };
  return (
    <Button
      className={cn(
        "shrink-0 bg-transparent hover:bg-background/10 hover:text-background",
        className,
      )}
      isIcon
      onClick={handleClick}
      size={size}
      variant={variant}
      {...props}
    >
      <XIcon size={18} />
    </Button>
  );
};
