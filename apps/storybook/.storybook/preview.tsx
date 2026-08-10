import type { Decorator, Preview } from "@storybook/react-vite";
import { useEffect } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";

import "../src/styles/globals.css";

function ThemeSync({ theme }: { theme: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  }, [theme]);
  return null;
}

const withTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as string) ?? "light";
  return (
    <TooltipProvider>
      <ThemeSync theme={theme} />
      <Story />
    </TooltipProvider>
  );
};

const preview: Preview = {
  decorators: [withTheme],
  globalTypes: {
    theme: {
      description: "Color scheme",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
  },
  parameters: {
    layout: "centered",
    backgrounds: { disable: true },
  },
};

export default preview;
