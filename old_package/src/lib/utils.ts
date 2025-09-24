import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const customTwMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      shadow: [
        {
          shadow: ["xshort", "short", "long", "xlong"],
        },
      ],
      button: [
        {
          button: ["sm", "md", "lg", "xl"],
        },
        {
          "button-icon": ["sm", "md", "lg", "xl"],
        },
      ],
    },
    theme: {
      spacing: [
        "element-xs",
        "element-md",
        "element-sm",
        "element-lg",
        "element-xl",
        "element-2xl",
      ],
    },
  },
} as Parameters<typeof extendTailwindMerge>[0]);

export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
