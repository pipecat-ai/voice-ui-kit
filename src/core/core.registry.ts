import { RegistryEntry } from "@/registry/schema";

export const coreConfig: RegistryEntry = {
  name: "core",
  type: "registry:ui",
  description: "Core VKUI utilities, design tokens, and helper functions",
  files: [
    {
      path: "lib/vkui.ts",
      source: "src/lib/vkui.ts",
      type: "ts",
    },
    {
      path: "styles/vkui-core.css",
      source: "src/styles/vkui-core.css",
      type: "css",
    },
  ],
  dependencies: ["clsx", "tailwind-merge"],
  tailwind: {
    css: {
      imports: ["./styles/vkui-core.css"],
    },
    config: {
      theme: {
        extend: {
          animation: {
            scroll: "scroll var(--loader-stripe-speed, 0.5s) linear infinite",
          },
        },
      },
    },
  },
  cssVars: {
    light: {
      // Utility-specific tokens
      "--border-width-element": "1px",
      "--elbow-size": "1rem",
      "--elbow-offset": "var(--border-width-element)",
      "--elbow-width": "var(--border-width-element)",
      "--elbow-opacity": "0.7",
      "--scanlines-opacity": "0.03",
      "--grid-opacity": "0.05",
      "--grid-size": "24px",
      "--grid-border-width": "1px",
      "--stripe-border-size": "1rem",
      "--stripe-inset": "calc(var(--stripe-border-size) / 1)",
      "--stripe-size": "20px",
      "--stripe-gap-size": "calc(var(--stripe-size) / 2)",
      "--loader-stripe-width": "15px",
      "--loader-stripe-speed": "0.5s",

      // Button sizing system
      "--button-size-sm": "calc(var(--spacing) * 7)",
      "--button-size-md": "calc(var(--spacing) * 9)",
      "--button-size-lg": "calc(var(--spacing) * 11)",
      "--button-size-xl": "calc(var(--spacing) * 13)",
      "--button-px-mul": "0.5",
      "--button-px-icon-mul": "0.35",
      "--button-px-gap-mul": "0.25",

      // Spacing system
      "--spacing-element-md": "calc(var(--spacing) * 4)",
      "--spacing-element-sm": "calc(var(--spacing) * 3)",
      "--spacing-element-lg": "calc(var(--spacing) * 6)",
      "--spacing-element-xl": "calc(var(--spacing) * 8)",
      "--spacing-element-2xl": "calc(var(--spacing) * 10)",

      // Color tokens
      "--color-elbow": "var(--color-ring)",
      "--color-background": "oklch(1 0 0)",
      "--color-foreground": "oklch(0.141 0.005 285.823)",
      "--color-border": "oklch(0.92 0.004 286.32)",
      "--color-ring": "oklch(0.705 0.015 286.067)",
    },
    dark: {
      "--color-background": "oklch(0.141 0.005 285.823)",
      "--color-foreground": "oklch(0.985 0 0)",
      "--color-border": "oklch(0.3 0.01 286.32)",
      "--color-ring": "oklch(0.5 0.02 286.067)",
      "--elbow-opacity": "0.5",
      "--scanlines-opacity": "0.02",
      "--grid-opacity": "0.03",
    },
  },
};
