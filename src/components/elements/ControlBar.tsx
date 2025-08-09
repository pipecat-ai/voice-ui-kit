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
  return (
    <div
      className={cn(
        "vkui:w-px vkui:bg-border vkui:self-stretch vkui:mx-2 ",
        className,
      )}
    />
  );
};

export const ControlBar = ({
  children,
  noAnimateIn = false,
  className,
  ...props
}: Props) => {
  return (
    <Card
      className={cn(
        !noAnimateIn &&
          "vkui:animate-in vkui:fade-in vkui:slide-in-from-bottom-10 vkui:duration-500",
        className,
      )}
      {...props}
    >
      <CardContent className="vkui:flex vkui:flex-row vkui:gap-6">
        {children}
      </CardContent>
    </Card>
  );
};
