import { cn } from "@/lib/utils";

export function LayoutSection({
  className,
  sectionKey,
  ...props
}: React.ComponentProps<"section"> & { sectionKey: string }) {
  return (
    <section data-section={sectionKey} className={cn(className)} {...props} />
  );
}

export default LayoutSection;
