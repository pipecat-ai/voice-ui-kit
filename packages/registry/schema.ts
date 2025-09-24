export interface RegistryEntry {
  name: string;
  type: "registry:ui" | "registry:style" | "registry:lib";
  description?: string;
  dependencies?: string[];
  devDependencies?: string[];
  registryDependencies?: string[];
  files: Array<{
    path: string;
    source: string;
    type: "ts" | "tsx" | "css" | "json";
  }>;
  cssVars?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}
