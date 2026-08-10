import { defineConfig } from "vitest/config";

import { registryAliases } from "./vite.alias";

// Tests live in packages/registry/tests (one file per item, dev-only —
// never part of a registry item); this app hosts the run because it owns
// the stock ui primitives the registry composes against.
export default defineConfig({
  resolve: {
    alias: registryAliases,
  },
  test: {
    dir: "../../packages/registry/tests",
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
