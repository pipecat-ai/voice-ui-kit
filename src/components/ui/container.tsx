import { cn } from "@/lib/utils";

export function FullScreenContainer({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("w-full h-dvh vkui:bg-background", className)}
      {...props}
    />
  );
}
