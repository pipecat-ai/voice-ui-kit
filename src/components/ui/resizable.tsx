import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import * as ResizablePrimitive from "react-resizable-panels";
import {
  disableGlobalCursorStyles,
  usePanelGroupContext,
} from "react-resizable-panels";

import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";
import { EllipsisVerticalIcon } from "lucide-react";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) {
  disableGlobalCursorStyles();

  return (
    <ResizablePrimitive.PanelGroup
      data-slot="resizable-panel-group"
      className={cn(
        "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
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
  "group focus-visible:ring-ring relative flex w-px items-center justify-center after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:outline-hidden data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
  {
    variants: {
      size: {
        sm: "[&_svg]:size-3",
        md: "[&_svg]:size-4",
        lg: "[&_svg]:size-5",
      },
      noBorder: {
        false:
          "bg-border hover:bg-foreground/20 hover:ring-foreground/20 hover:ring-1",
        true: "border-none",
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
        direction === "vertical" ? "cursor-row-resize" : "cursor-col-resize",
        className,
      )}
      {...props}
    >
      {withHandle && (
        <div className="border-transparent z-10 flex items-center justify-center text-subtle group-hover:text-foreground group-focus:text-foreground">
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
