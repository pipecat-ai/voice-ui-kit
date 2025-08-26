import { cn } from "@/lib/utils";

export function FullScreenContainer({
  className,
  horizontal = false,
  ...props
}: React.ComponentProps<"div"> & { horizontal?: boolean }) {
  return (
    <div
      className={cn(
        "w-full h-dvh bg-background flex items-center justify-center flex-col",
        horizontal && "flex-row",
        className,
      )}
      {...props}
    />
  );
}
