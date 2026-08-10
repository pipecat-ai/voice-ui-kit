# example

A bare Vite + React consumer app for testing the registry end-to-end — the
same `shadcn add` flow a real consumer uses, but pointed at the local
registry host instead of production.

`components.json` maps the `@pipecat` namespace to
`http://localhost:3600/r/{name}.json`, which is the docs app serving the
built registry JSON from its `public/r/` dir.

## Adding components

1. Make sure the docs app is running (it hosts the registry):

   ```sh
   pnpm dev            # from the repo root — starts docs (3600) + storybook (6006)
   ```

2. If you've edited registry source since the last build, rebuild the JSON:

   ```sh
   node apps/docs/scripts/sync-registry.mjs   # from the repo root
   ```

3. Add components from this directory:

   ```sh
   pnpm exec shadcn add @pipecat/connect-button
   ```

   Multiple at once works too:

   ```sh
   pnpm exec shadcn add @pipecat/connect-button @pipecat/audio-visualizer-bar
   ```

Files land in `src/components/pipecat/`, shadcn primitives in
`src/components/ui/`, and npm deps / theme tokens install automatically.
The command is identical to what production consumers run — only the
registry URL in `components.json` differs.

## Available items

- `audio-visualizer-bar`
- `audio-visualizer-radial`
- `bot-audio`
- `client-status`
- `connect-button`
- `conversation`
- `device-select`
- `dtmf-keypad`
- `session-info`
- `text-input`
- `transcript-overlay`
- `user-audio-control`
- `user-screen-control`
- `user-video-control`

## Running the app

```sh
pnpm dev            # from this directory — Vite on http://localhost:3700
```
