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
        "text-sm grid grid-cols-[1fr_2fr] gap-2 items-center",
        classNames.container,
      )}
    >
      {Object.entries(data).map(([key, value]) => (
        <React.Fragment key={key}>
          <dt className={cn("text-muted-foreground", classNames.key)}>{key}</dt>
          <dd
            className={cn(
              "text-right font-mono text-xs min-w-0 truncate",
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
