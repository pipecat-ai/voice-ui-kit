import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],

  css: {
    postcss: {
      plugins: [],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    allowedHosts: true,
    proxy: {
      "/api": {
        target: "http://0.0.0.0:7860",
        changeOrigin: true,
      },
    },
  },
});
