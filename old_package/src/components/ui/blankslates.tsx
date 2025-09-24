import { cn } from "@/lib/utils";

export const TextDashBlankslate = ({ className }: { className?: string }) => {
  return (
    <span className={cn("mono-upper text-subtle/60", className)}>---</span>
  );
};
