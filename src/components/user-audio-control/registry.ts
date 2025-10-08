import { RegistryEntry } from "@/registry/schema";

export const UserAudioControl: RegistryEntry = {
  name: "user-audio-control",
  type: "registry:component",
  description: "Audio control component for user voice input and playback",
  files: [
    {
      path: "ui/user-audio-control.tsx",
      source: "@/components/user-audio-control/index.tsx",
      type: "tsx",
    },
  ],
  dependencies: [],
  registryDependencies: ["core"],
  cssVars: {
    light: {},
    dark: {},
  },
};
