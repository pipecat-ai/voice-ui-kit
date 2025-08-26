import { Card, CardContent, type CardProps } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Props extends CardProps {
  children?: React.ReactNode;
  className?: string;
  noAnimateIn?: boolean;
}

export const ControlBarDivider = ({
  className,
}: React.ComponentProps<"div">) => {
  return <div className={cn("w-px bg-border self-stretch mx-2 ", className)} />;
};

export const ControlBar = ({
  children,
  noAnimateIn = false,
  className,
  ...props
}: Props) => {
  return (
    <Card
      withGradientBorder
      shadow="xlong"
      size="lg"
      {...props}
      className={cn(
        !noAnimateIn &&
          "animate-in fade-in slide-in-from-bottom-10 duration-500",
        className,
      )}
    >
      <CardContent className="flex flex-row gap-4">{children}</CardContent>
    </Card>
  );
};
