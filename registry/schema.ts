export interface RegistryEntry {
  name: string;
  type: "registry:ui" | "registry:style" | "registry:lib";
  description?: string;
  dependencies?: string[];
  files: Array<{
    path: string;
    source: string;
    type: "ts" | "tsx" | "css" | "json";
  }>;
  tailwind?: {
    config?: Record<string, any>;
    css?: {
      imports?: string[];
    };
  };
  cssVars?: {
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
}
