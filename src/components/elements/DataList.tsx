import { cn } from "@/lib/utils";
import React, { type ReactNode } from "react";

interface DataListProps {
  data: Record<string, string | ReactNode>;
  classNames?: {
    container?: string;
    key?: string;
    value?: string;
  };
}

export const DataList: React.FC<DataListProps> = ({
  data,
  classNames = {},
}) => {
  return (
    <dl
      className={cn(
        "vkui:text-sm vkui:grid vkui:grid-cols-[1fr_2fr] vkui:gap-2 vkui:items-center",
        classNames.container,
      )}
    >
      {Object.entries(data).map(([key, value]) => (
        <React.Fragment key={key}>
          <dt className={cn("vkui:text-muted-foreground", classNames.key)}>
            {key}
          </dt>
          <dd
            className={cn(
              "vkui:text-right vkui:font-mono vkui:text-xs vkui:min-w-0 vkui:truncate",
              classNames.value,
            )}
          >
            {value}
          </dd>
        </React.Fragment>
      ))}
    </dl>
  );
};

export default DataList;
