import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    react(),
    dts({
      insertTypesEntry: true,
      exclude: ["**/*.stories.*", "**/*.test.*"],
      outDir: "dist",
      rollupTypes: true,
    }),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  build: {
    lib: {
      entry: {
        index: path.resolve(__dirname, "src/index.ts"),
        metrics: path.resolve(__dirname, "src/components/metrics/index.ts"),
        webgl: path.resolve(__dirname, "src/visualizers/webgl/index.ts"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "mjs" : "cjs"}`,
    },

    rollupOptions: {
      external: [
        // React
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@daily-co/daily-js",
        "@pipecat-ai/client-js",
        "@pipecat-ai/client-react",
        "@pipecat-ai/daily-transport",
        "@pipecat-ai/small-webrtc-transport",
      ],

      output: {
        globals: {
          "@daily-co/daily-js": "Daily",
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },

    minify: false,
    sourcemap: true,
  },
});
