import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// Registry source imports consumer-final paths (@/components/pipecat/*,
// @/components/ui/*, @/lib/utils). Map them explicitly: pipecat items to
// the registry workspace, everything else to this host app. Shared by the
// storybook vite config and the vitest config.
export const registryAliases = [
  {
    find: /^@\/components\/pipecat\/console\/(.*)$/,
    replacement: r("../../packages/registry/src/blocks/console/$1"),
  },
  {
    find: /^@\/components\/pipecat\/metrics\/(.*)$/,
    replacement: r("../../packages/registry/src/blocks/metrics/$1"),
  },
  {
    find: /^@\/components\/pipecat\/(.*)$/,
    replacement: r("../../packages/registry/src/components/$1"),
  },
  {
    find: /^@\/lib\/visualizer$/,
    replacement: r("../../packages/registry/src/lib/visualizer.ts"),
  },
  {
    find: /^@\/lib\/transports$/,
    replacement: r("../../packages/registry/src/lib/transports.ts"),
  },
  {
    find: /^@\/hooks\/use-pipecat-app$/,
    replacement: r("../../packages/registry/src/hooks/use-pipecat-app.ts"),
  },
  {
    find: /^@\/hooks\/use-pipecat-metrics$/,
    replacement: r("../../packages/registry/src/hooks/use-pipecat-metrics.ts"),
  },
  {
    find: /^@\/hooks\/use-pipecat-event-stream$/,
    replacement: r(
      "../../packages/registry/src/hooks/use-pipecat-event-stream.ts",
    ),
  },
  { find: /^@\/(.*)$/, replacement: r("./src/$1") },
];
