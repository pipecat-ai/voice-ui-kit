import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { registryAliases } from "./vite.alias";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: registryAliases,
  },
});
