import { LoaderIcon } from "@/icons";
import { cn } from "@/lib/utils";

export const SpinLoader = ({ size = 32 }: { size?: number }) => {
  return (
    <LoaderIcon className="vkui:animate-spin vkui:opacity-50" size={size} />
  );
};

export const StripeLoader = ({ className }: { className?: string }) => {
  return (
    <div className={cn("vkui:loader-stripes vkui:w-40 vkui:h-10", className)} />
  );
};

/**
 * @deprecated Use SpinLoader instead. This component will be removed in a future version.
 */
export const LoaderSpinner = SpinLoader;
