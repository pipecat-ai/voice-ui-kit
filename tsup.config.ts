import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    metrics: "src/components/metrics/index.ts",
    webgl: "src/visualizers/webgl/index.ts",
  },
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  clean: true,
  external: [
    "react",
    "react-dom",
    "react/jsx-runtime",
    "@daily-co/daily-js",
    "@pipecat-ai/client-js",
    "@pipecat-ai/client-react",
    "@pipecat-ai/daily-transport",
    "@pipecat-ai/small-webrtc-transport",
  ],
  treeshake: true,
  sourcemap: true,
  minify: false,
  outDir: "dist",
  onSuccess: "npm run build:css",
  esbuildOptions(options) {
    options.loader = {
      ...options.loader,
      ".css": "css",
    };
    options.alias = {
      "@": "./src",
    };
  },
});
