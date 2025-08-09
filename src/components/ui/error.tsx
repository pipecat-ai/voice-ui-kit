import { Card, CardContent, CardHeader, CardProps } from "@/components/ui/card";
import { InfoIcon } from "@/icons";
import { cn } from "@/lib/utils";

export const ErrorCard = ({
  title = "An Error Occurred",
  noHeader = false,
  classNames,
  icon = <InfoIcon size={24} />,
  children,
  ...cardProps
}: {
  title?: string;
  noHeader?: boolean;
  classNames?: {
    header?: string;
    content?: string;
  };
  icon?: React.ReactNode;
  children?: React.ReactNode;
} & CardProps) => {
  return (
    <Card
      className={cn("vkui:min-w-md vkui:gap-0", cardProps.className)}
      variant="destructive"
      {...cardProps}
    >
      {!noHeader && (
        <CardHeader
          className={cn(
            "vkui:font-semibold vkui:flex vkui:flex-row vkui:items-center",
            classNames?.header,
          )}
        >
          {icon}
          {title}
        </CardHeader>
      )}
      {children && (
        <CardContent
          className={cn("vkui:text-sm vkui:text-balanced", classNames?.content)}
        >
          {children}
        </CardContent>
      )}
    </Card>
  );
};
