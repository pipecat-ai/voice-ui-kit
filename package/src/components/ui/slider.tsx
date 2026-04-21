"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";
import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A thin wrapper around Radix Slider styled to match the rest of the kit.
 * Supports horizontal or vertical orientation.
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, orientation = "horizontal", ...props }, ref) => {
  const values = Array.isArray(props.value)
    ? props.value
    : Array.isArray(props.defaultValue)
      ? props.defaultValue
      : [0];

  return (
    <SliderPrimitive.Root
      ref={ref}
      data-slot="slider"
      orientation={orientation}
      className={cn(
        "relative flex touch-none select-none items-center",
        orientation === "horizontal"
          ? "w-full h-5"
          : "h-32 w-5 flex-col justify-center",
        "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full bg-primary/20",
          orientation === "horizontal" ? "h-1.5 w-full" : "w-1.5 h-full",
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute bg-primary",
            orientation === "horizontal" ? "h-full" : "w-full",
          )}
        />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          data-slot="slider-thumb"
          className="block size-4 rounded-full border border-primary/50 bg-background shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50"
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
