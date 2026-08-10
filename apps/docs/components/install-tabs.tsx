import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "fumadocs-ui/components/codeblock";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

interface RegistryFile {
  path: string;
  target: string;
  content: string;
}

interface RegistryItem {
  name: string;
  dependencies?: string[];
  registryDependencies?: string[];
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  css?: Record<string, unknown>;
  files: RegistryFile[];
}

function loadItem(name: string): RegistryItem {
  const file = path.join(process.cwd(), "public/r", `${name}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as RegistryItem;
}

function cssVarsToCss(cssVars: NonNullable<RegistryItem["cssVars"]>): string {
  const blocks: string[] = [];
  const render = (
    selector: string,
    vars: Record<string, string>,
    prefix = "--",
  ) =>
    `${selector} {\n${Object.entries(vars)
      .map(([k, v]) => `  ${prefix}${k}: ${v};`)
      .join("\n")}\n}`;

  if (cssVars.theme) blocks.push(render("@theme inline", cssVars.theme, "--"));
  if (cssVars.light) blocks.push(render(":root", cssVars.light));
  if (cssVars.dark) blocks.push(render(".dark", cssVars.dark));
  return blocks.join("\n\n");
}

/** Serializes a registry `css` payload (nested rules, e.g. keyframes). */
function cssPayloadToCss(css: Record<string, unknown>, indent = ""): string {
  return Object.entries(css)
    .map(([key, value]) =>
      typeof value === "object" && value !== null
        ? `${indent}${key} {\n${cssPayloadToCss(
            value as Record<string, unknown>,
            indent + "  ",
          )}\n${indent}}`
        : `${indent}${key}: ${String(value)};`,
    )
    .join("\n");
}

// Kit items documented outside the components section.
const KIT_DOC_ROUTES: Record<string, string> = {
  "audio-visualizer-bar": "/docs/visualizers/audio-visualizer-bar",
  "audio-visualizer-radial": "/docs/visualizers/audio-visualizer-radial",
  "audio-visualizer-wave": "/docs/visualizers/audio-visualizer-wave",
  "use-pipecat-app": "/docs/hooks/use-pipecat-app",
  "use-pipecat-metrics": "/docs/hooks/use-pipecat-metrics",
  "use-pipecat-event-stream": "/docs/hooks/use-pipecat-event-stream",
  metrics: "/docs/blocks/metrics",
  console: "/docs/blocks/console",
};

const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn", "bun"] as const;
type PackageManager = (typeof PACKAGE_MANAGERS)[number];

/**
 * Converts an npm-form command for another package manager, using the same
 * rules as the shadcn docs: npx → pnpm dlx / yarn dlx / bunx --bun, and
 * npm install → pnpm add / yarn add / bun add.
 */
function convertCommand(pm: PackageManager, npmCommand: string): string {
  if (pm === "npm") return npmCommand;
  if (npmCommand.startsWith("npm install")) {
    return npmCommand.replace(
      "npm install",
      { pnpm: "pnpm add", yarn: "yarn add", bun: "bun add" }[pm],
    );
  }
  if (npmCommand.startsWith("npx")) {
    return npmCommand.replace(
      "npx",
      { pnpm: "pnpm dlx", yarn: "yarn dlx", bun: "bunx --bun" }[pm],
    );
  }
  return npmCommand;
}

/**
 * A shell command rendered with package-manager tabs (pnpm, npm, yarn,
 * bun) in the code block header. Write the command in npm form
 * ("npx shadcn@latest add …" or "npm install …"); the other tabs are
 * derived. The chosen tab persists across pages and code blocks.
 */
export function CommandTabs({ command }: { command: string }) {
  return (
    <CodeBlockTabs groupId="package-manager" persist defaultValue="pnpm">
      <CodeBlockTabsList>
        {PACKAGE_MANAGERS.map((pm) => (
          <CodeBlockTabsTrigger key={pm} value={pm}>
            {pm}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {PACKAGE_MANAGERS.map((pm) => (
        <CodeBlockTab key={pm} value={pm}>
          <DynamicCodeBlock lang="bash" code={convertCommand(pm, command)} />
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  );
}

function FileName({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-fd-secondary text-fd-muted-foreground -mb-2 w-fit rounded-t-lg border border-b-0 px-3 py-1.5 font-mono text-xs">
      {children}
    </div>
  );
}

/**
 * Installation section for a registry item: a Command tab (with
 * package-manager switcher) and a Manual tab generated from the built
 * registry JSON (public/r/{name}.json), so the copy-paste source is always
 * the shipped version.
 */
export function InstallTabs({ name }: { name: string }) {
  const item = loadItem(name);

  const npmDeps = item.dependencies ?? [];
  const shadcnDeps = (item.registryDependencies ?? []).filter(
    (dep) => !dep.startsWith("@pipecat/"),
  );
  const kitDeps = (item.registryDependencies ?? []).filter((dep) =>
    dep.startsWith("@pipecat/"),
  );

  return (
    <Tabs items={["Command", "Manual"]}>
      <Tab value="Command">
        <CommandTabs command={`npx shadcn@latest add @pipecat/${item.name}`} />
        {kitDeps.length > 0 && (
          <p className="text-fd-muted-foreground mt-3 text-sm">
            Also installs{" "}
            {kitDeps.map((dep, i) => (
              <span key={dep}>
                {i > 0 && ", "}
                <code>{dep}</code>
              </span>
            ))}{" "}
            as registry {kitDeps.length === 1 ? "dependency" : "dependencies"}.
          </p>
        )}
      </Tab>
      <Tab value="Manual">
        <div className="flex flex-col gap-4">
          {npmDeps.length > 0 && (
            <>
              <p className="text-sm">Install the npm dependencies:</p>
              <CommandTabs command={`npm install ${npmDeps.join(" ")}`} />
            </>
          )}
          {shadcnDeps.length > 0 && (
            <>
              <p className="text-sm">
                Add the shadcn/ui primitives it composes:
              </p>
              <CommandTabs
                command={`npx shadcn@latest add ${shadcnDeps.join(" ")}`}
              />
            </>
          )}
          {kitDeps.length > 0 && (
            <p className="text-sm">
              Manually install{" "}
              {kitDeps.map((dep, i) => {
                const depName = dep.replace("@pipecat/", "");
                return (
                  <span key={dep}>
                    {i > 0 && ", "}
                    <Link
                      className="underline underline-offset-4"
                      href={
                        KIT_DOC_ROUTES[depName] ?? `/docs/components/${depName}`
                      }
                    >
                      {dep}
                    </Link>
                  </span>
                );
              })}{" "}
              first, following {kitDeps.length === 1 ? "its" : "their"} manual
              steps.
            </p>
          )}
          {(item.cssVars || item.css) && (
            <>
              <p className="text-sm">
                Add the theme tokens to your global CSS:
              </p>
              <DynamicCodeBlock
                lang="css"
                code={[
                  item.cssVars && cssVarsToCss(item.cssVars),
                  item.css && cssPayloadToCss(item.css),
                ]
                  .filter(Boolean)
                  .join("\n\n")}
              />
            </>
          )}
          <p className="text-sm">
            Copy the {item.files.length === 1 ? "component" : "components"} into
            your project:
          </p>
          {item.files.map((file) => (
            <div key={file.target}>
              <FileName>{file.target}</FileName>
              <DynamicCodeBlock lang="tsx" code={file.content} />
            </div>
          ))}
        </div>
      </Tab>
    </Tabs>
  );
}
