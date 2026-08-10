# voice-ui-kit

A shadcn registry of voice/agent UI components for [Pipecat](https://pipecat.ai).
Components ship as **source code** that consumers copy into their app with
`npx shadcn add @pipecat/<name>` — there is no runtime package. Everything
composes stock shadcn/ui primitives (**Base UI** flavor) that install
automatically as registry dependencies; the kit ships zero primitives of its own.

## Structure

```
packages/registry/       The product
  registry.json          Item manifests (files, deps, cssVars, css, docs)
  src/components/          Flat component sources, one per item,
                           *.stories.tsx co-located (dev-only, never shipped);
                           explicit targets install them to the consumer's
                           components/pipecat/<name>.tsx (src-dir-aware)
  src/blocks/<block>/      Multi-file blocks (console/, metrics/): internals
                           live beside the block, unprefixed (panel.tsx,
                           chart.tsx); targets install them to
                           components/pipecat/<block>/<file>.tsx
  src/lib/                 Shared non-component modules → consumer lib/ via
                           type-based placement (no targets; deduped), e.g.
                           visualizer.ts — visualizer core (states, mel bands, analyser)
                           transports.ts — dynamic per-type transport loading
                           (zero transport deps; @ts-ignore'd optional imports)
  src/hooks/               registry:hook items → consumer hooks/ via
                           type-based placement (use-pipecat-app,
                           use-pipecat-metrics, use-pipecat-event-stream)
  tests/                   Vitest suites, one file per item (dev-only, never
                           shipped); hosted by apps/storybook (jsdom + shims)
apps/storybook/          Dev host (port 6006) — simulated consumer with stock
                         Base UI primitives installed in src/components/ui/;
                         also the vitest host (vitest.config.ts + vitest.setup.ts)
apps/docs/               Fumadocs site (port 3600) — component docs with live
                         config-panel previews, and the registry host: built
                         item JSON is served from public/r/{name}.json
```

Registry source imports use consumer-final paths (`@/components/ui/button`,
`@/lib/utils`, `@/components/pipecat/*`, `@/components/pipecat/console/*`);
the host apps alias those into the workspace (block aliases map to
`src/blocks/*`, the generic pipecat alias to `src/components/*` — order
matters in vite.alias.ts). Tailwind sees registry classes via `@source` in
each host's globals.

## Conventions

- Every item: `"use client"`, typically a Pipecat-connected export (reads
  client context) plus a props-driven `*View` export, JSDoc on all exported
  props. Sanctioned exceptions: `metric` is generic/props-driven only (no
  store connection — the metrics block does the wiring), and composite blocks
  like `console` are connected-only.
- Compose only `@/components/ui/*` + `cn` + lucide icons. Base UI idioms:
  `render` prop, not `asChild`.
- Appearance props forward the primitive's own types
  (`ButtonProps["variant"]`, `ButtonProps["size"]`) — never kit-invented
  unions. Icon sizes (`icon`, `icon-sm`, …) render button components
  icon-only. Prefer Pipecat library types (`TransportState`, …) over new ones.
- State is exposed as `data-state` (+ `data-slot`) for consumer styling.
  Semantic tokens are limited to `active`/`inactive` (+ `-foreground`) and
  `agent`/`client`, declared per item as `cssVars`.
- Visualizers share `lib/visualizer.ts` (`VisualizerState`, voice-tuned
  mel bands, analyser setup, color resolution); the file ships with each
  visualizer item and shadcn dedupes it by target. Shared non-component modules
  live in `src/lib/` and install to the consumer's `lib/`,
  beside the stock `lib/utils.ts`.
- Boolean props that remove UI are `no*` (`noIcon`, `noDevicePicker`).
- Shared realtime data lives in module-level zustand stores fed by ONE
  ref-counted RTVI listener per client (use-pipecat-metrics,
  use-pipecat-event-stream): first subscriber attaches, last detaches, data
  survives tab unmounts, session reset on reconnect. Only connected exports
  touch stores; `*View`s stay props-driven. Reset stores via `setState` in
  test beforeEach (bot-audio pattern).
- Blocks (`registry:block`) are multi-file items living in
  `src/blocks/<block>/` with unprefixed internals, never their own catalog
  items; consumers get them under `components/pipecat/<block>/`. The console builds its own client via
  `use-pipecat-app` and renders its own `PipecatClientProvider` — never nest
  it inside another provider. Themes are the consumer's job: no theme props,
  just the `headerSlot`.
- Transports are optional installs: `lib/transports.ts` dynamic-imports the
  package per `transportType` and a missing one surfaces an install-hint
  error. No transport packages in any item's `dependencies`.

## Build & verify

```
pnpm dev                 # turbo dev: storybook (6006) + docs (3600)
pnpm build               # turbo: shadcn build (registry) + app builds
pnpm lint / typecheck    # eslint flat config / per-app tsc
pnpm test                # turbo: vitest (host apps/storybook, jsdom)
```

After editing registry source, run the full loop:

```
node apps/docs/scripts/sync-registry.mjs   # shadcn build + copy JSON into docs
pnpm exec tsc --noEmit -p apps/storybook
(cd apps/docs && pnpm typecheck)
pnpm lint
pnpm test
```

Docs previews import registry source directly (hot-reloads), but the
Installation tabs render from the built JSON — stale until you sync.
CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, and build via turbo.

Tests: `packages/registry/tests/<item>.test.tsx`, run from `apps/storybook`
(`pnpm exec vitest run <item>` for one file). Tests import via the same
consumer-final aliases as source; jsdom gaps (canvas 2D, Web Audio,
MediaStream, media elements) are shimmed in `apps/storybook/vitest.setup.ts`.
Mock `@pipecat-ai/client-react` hooks with `vi.hoisted` + `vi.mock` (spread
`importOriginal()` when the component also uses non-hook exports); never mock
`@pipecat-ai/client-js` — import real enums/types.

## Consumer usage

Consumers register the namespace in `components.json`:

```json
{ "registries": { "@pipecat": "https://voiceuikit.pipecat.ai/r/{name}.json" } }
```

then `npx shadcn add @pipecat/<item>`. Files land in `components/pipecat/`,
primitives and npm deps install automatically, and theme tokens merge into
global CSS. Every component works under a bare `PipecatClientProvider`.
