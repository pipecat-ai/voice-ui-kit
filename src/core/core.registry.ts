import { RegistryEntry } from "packages/registry/schema";

export const coreConfig: RegistryEntry = {
  name: "core",
  type: "registry:ui",
  description: "Core VKUI theme, utilities and design tokens",
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
    {
      path: "styles/vkui-theme.css",
      source: "src/styles/vkui-theme.css",
      type: "css",
    },
  ],
  dependencies: ["clsx", "tailwind-merge"],
  tailwind: {
    css: {
      imports: ["./styles/vkui-core.css", "./styles/vkui-theme.css"],
    },
  },
  cssVars: {
    light: {},
    dark: {},
  },
};
