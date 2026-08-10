import { createRoot } from "react-dom/client";

import "@/styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <main className="flex min-h-svh items-center justify-center">
    <p className="text-muted-foreground font-mono text-sm">
      voice-ui-kit dev host — run storybook instead: <code>pnpm dev</code>
    </p>
  </main>,
);
