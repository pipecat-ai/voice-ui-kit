/**
 * Builds the shadcn registry and copies its static JSON into this app's
 * public/ dir, so the docs site serves /r/{name}.json.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const docsRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const registryRoot = path.resolve(docsRoot, "../../packages/registry");
const src = path.join(registryRoot, "public/r");
const dest = path.join(docsRoot, "public/r");

execSync("pnpm build", { cwd: registryRoot, stdio: "inherit" });

if (!existsSync(src)) {
  console.error(`sync-registry: expected registry output at ${src}`);
  process.exit(1);
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(path.dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`sync-registry: copied ${src} -> ${dest}`);
