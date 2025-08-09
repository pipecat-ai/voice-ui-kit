import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import {
  disableGlobalCursorStyles,
  usePanelGroupContext,
} from "react-resizable-panels";

import { EllipsisVerticalIcon } from "@/icons";
import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  disableGlobalCursorStyles();

  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "vkui:flex vkui:h-full vkui:w-full vkui:data-[panel-group-direction=vertical]:flex-col",
        className,
      )}
      {...props}
    />
  );
}

function ResizablePanel({
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Panel>) {
  return <ResizablePrimitive.Panel data-slot="resizable-panel" {...props} />;
}

const resizableHandleVariants = cva(
  "vkui:group vkui:focus-visible:ring-ring vkui:relative vkui:flex vkui:w-px vkui:items-center vkui:justify-center vkui:after:absolute vkui:after:inset-y-0 vkui:after:left-1/2 vkui:after:w-1 vkui:after:-translate-x-1/2 vkui:focus-visible:ring-1 vkui:focus-visible:ring-offset-1 focus-visible:outline-hidden vkui:data-[panel-group-direction=vertical]:h-px vkui:data-[panel-group-direction=vertical]:w-full vkui:data-[panel-group-direction=vertical]:after:left-0 vkui:data-[panel-group-direction=vertical]:after:h-1 vkui:data-[panel-group-direction=vertical]:after:w-full vkui:data-[panel-group-direction=vertical]:after:-translate-y-1/2 vkui:data-[panel-group-direction=vertical]:after:translate-x-0 vkui:[&[data-panel-group-direction=vertical]>div]:rotate-90",
  {
    variants: {
      size: {
        sm: "vkui:[&_svg]:size-3",
        md: "vkui:[&_svg]:size-4",
        lg: "vkui:[&_svg]:size-5",
      },
      noBorder: {
        false:
          "vkui:bg-border vkui:hover:bg-foreground/20 vkui:hover:ring-foreground/20 vkui:hover:ring-1",
        true: "vkui:border-none",
      },
    },
  },
);

function ResizableHandle({
  withHandle,
  noBorder = true,
  size = "sm",
  icon,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> &
  VariantProps<typeof resizableHandleVariants> & {
    withHandle?: boolean;
    noBorder?: boolean;
    icon?: React.ReactNode;
  }) {
  const { direction } = usePanelGroupContext();
  return (
    <ResizablePrimitive.PanelResizeHandle
      data-slot="resizable-handle"
      className={cn(
        resizableHandleVariants({ noBorder, size }),
        direction === "vertical"
          ? "vkui:cursor-row-resize"
          : "vkui:cursor-col-resize",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="vkui:border-transparent vkui:z-10 vkui:flex vkui:items-center vkui:justify-center vkui:text-subtle vkui:group-hover:text-foreground vkui:group-focus:text-foreground">
          {icon || <EllipsisVerticalIcon />}
        </div>
      )}
    </ResizablePrimitive.PanelResizeHandle>
  );
}

export {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizablePrimitive,
};
