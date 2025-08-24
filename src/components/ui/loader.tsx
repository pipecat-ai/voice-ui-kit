import { cn } from "@/lib/utils";
import { Loader2Icon } from "lucide-react";

export const SpinLoader = ({ size = 32 }: { size?: number }) => {
  return <Loader2Icon className="animate-spin opacity-50" size={size} />;
};

export const StripeLoader = ({ className }: { className?: string }) => {
  return <div className={cn("loader-stripes w-40 h-10", className)} />;
};

/**
 * @deprecated Use SpinLoader instead. This component will be removed in a future version.
 */
export const LoaderSpinner = SpinLoader;
