import * as React from "react";

import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel"
      className={cn(
        "vkui:@container/panel vkui:bg-card vkui:text-card-foreground vkui:flex vkui:flex-col vkui:rounded-panel vkui:border",
        className,
      )}
      {...props}
    />
  );
}

const PanelHeaderVariants = cva("vkui:@container/panel-header", {
  variants: {
    variant: {
      default:
        "vkui:border-b vkui:flex vkui:items-center vkui:justify-center vkui:text-card-foreground vkui:p-2 vkui:@xs/panel:p-3 vkui:@md/panel:p-4",
      inline:
        "vkui:items-start vkui:text-foreground vkui:p-2 vkui:@xs/panel:p-3 vkui:@md/panel:p-4",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function PanelHeader({
  variant,
  className,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof PanelHeaderVariants>) {
  return (
    <div
      data-slot="panel-header"
      className={cn(PanelHeaderVariants({ variant, className }), className)}
      {...props}
    />
  );
}

function PanelTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-title"
      className={cn("vkui:text-mono-upper", className)}
      {...props}
    />
  );
}

function PanelContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-content"
      className={cn(
        "vkui:text-foreground vkui:flex vkui:flex-col vkui:p-2 vkui:gap-2 vkui:@xs/panel:p-3 vkui:@xs/panel:gap-3 vkui:@md/panel:p-4 vkui:@md/panel:gap-4",
        className,
      )}
      {...props}
    />
  );
}

function PanelFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-footer"
      className={cn(
        "vkui:flex vkui:items-center vkui:p-2 vkui:@xs/panel:p-3 vkui:@md/panel:p-4",
        className,
      )}
      {...props}
    />
  );
}

function PanelActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="panel-actions"
      className={cn(
        "vkui:flex vkui:items-center vkui:gap-1 vkui:@xs/panel:gap-2",
        className,
      )}
      {...props}
    />
  );
}

export {
  Panel,
  PanelActions,
  PanelContent,
  PanelFooter,
  PanelHeader,
  PanelTitle,
};
