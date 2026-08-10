import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../../../packages/registry/src/**/*.stories.@(ts|tsx)"],
};

export default config;
