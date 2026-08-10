import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight">
        Voice AI components for Pipecat
      </h1>
      <p className="text-fd-muted-foreground max-w-xl text-lg">
        A shadcn registry of connect buttons, media controls, transcripts, and
        visualizers. Copied into your project as source, composed from stock
        shadcn/ui primitives, styled by your theme.
      </p>
      <code className="bg-fd-secondary rounded-lg border px-4 py-2.5 font-mono text-sm">
        npx shadcn@latest add @pipecat/user-audio-control
      </code>
      <div className="flex items-center gap-3">
        <Link
          href="/docs"
          className="bg-fd-primary text-fd-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
        >
          Documentation
        </Link>
        <Link
          href="/docs/components/connect-button"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Browse components
        </Link>
      </div>
    </div>
  );
}
