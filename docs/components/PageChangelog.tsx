import { Fragment, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type ChangelogEntry = {
  version: string;
  date?: string;
  changes: string[];
};

// Renders inline backtick code spans. Anything between matched backticks
// becomes <code>; everything else is plain text. We deliberately keep this
// narrow rather than pulling in a full markdown renderer.
function renderInline(text: string): ReactNode {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      return (
        <code
          key={i}
          className="rounded bg-fd-muted px-1 py-0.5 font-mono text-[0.85em] text-fd-foreground"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export function PageChangelog({
  entries,
  className,
}: {
  entries?: ChangelogEntry[];
  className?: string;
}) {
  if (!entries || entries.length === 0) return null;

  return (
    <section
      className={cn("mt-10 border-t border-fd-border pt-5", className)}
      aria-labelledby="page-changelog"
    >
      <h2
        id="page-changelog"
        className="mb-3 text-base font-semibold text-fd-foreground"
      >
        Changelog
      </h2>
      <dl className="space-y-1.5 text-sm">
        {entries.map((entry) => (
          <div
            key={entry.version}
            className="grid gap-x-4 sm:grid-cols-[8rem_1fr]"
          >
            <dt className="flex flex-col leading-tight sm:pt-0.5">
              <span className="font-mono text-sm text-fd-foreground">
                {entry.version}
              </span>
              {entry.date && (
                <time
                  dateTime={entry.date}
                  className="text-xs text-fd-muted-foreground"
                >
                  {entry.date}
                </time>
              )}
            </dt>
            <dd className="text-fd-foreground/90">
              <ul className="list-disc pl-5 marker:text-fd-muted-foreground/60">
                {entry.changes.map((change, idx) => (
                  <li key={idx}>{renderInline(change)}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
