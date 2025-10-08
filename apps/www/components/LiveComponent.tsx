"use client";

import { PipecatClient } from "@pipecat-ai/client-js";
import { PipecatClientProvider } from "@pipecat-ai/client-react";
import { SmallWebRTCTransport } from "@pipecat-ai/small-webrtc-transport";
import * as VoiceUIKit from "@pipecat-ai/voice-ui-kit";
import * as VoiceUIKitWebGL from "@pipecat-ai/voice-ui-kit/webgl";
import { CodeBlock, Pre as CodePre } from "fumadocs-ui/components/codeblock";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { CircleIcon, Loader2 } from "lucide-react";
import { useTheme } from "next-themes";
import React, { useEffect, useMemo, useState } from "react";
import { LiveError, LivePreview, LiveProvider } from "react-live";

type LiveComponentProps = {
  code?: string;
  children?: string;
  scope?: Record<string, unknown>;
  noInline?: boolean;
  language?: string;
  className?: string;
  editorClassName?: string;
  previewClassName?: string;
  height?: number | string;
  initialTab?: "preview" | "code";
  imports?: string | string[];
  previewOrientation?: "horizontal" | "vertical";
  withPipecat?: boolean;
  withConfirm?: boolean;
};

function normalizeCodeIndentation(snippet: string): string {
  let s = snippet.replace(/\r\n?/g, "\n");
  s = s.replace(/^\n+/, "").replace(/\n+$/, "");
  const lines = s.split("\n");
  let minIndent: number | null = null;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const match = line.match(/^[ \t]+/);
    const indent = match ? match[0].length : 0;
    if (minIndent === null || indent < minIndent) minIndent = indent;
  }
  if (!minIndent) return s;
  return lines
    .map((line) =>
      line.startsWith(" ".repeat(minIndent)) ? line.slice(minIndent) : line
    )
    .join("\n");
}

function stripImportsExportsRequires(snippet: string): string {
  const lines = snippet.split("\n");
  const kept: string[] = [];
  let skippingImport = false;
  for (const line of lines) {
    const trimmed = line.trim();
    // Start skipping on import line (handles multi-line named imports)
    if (!skippingImport && /^import\s/.test(trimmed)) {
      skippingImport = !/(;| from\s+['"]).*$/.test(trimmed);
      continue;
    }
    if (skippingImport) {
      // end when we hit `from "..."` or a semicolon-terminated line
      if (/(;| from\s+['"]).*$/.test(trimmed)) {
        skippingImport = false;
      }
      continue;
    }
    kept.push(line);
  }
  return kept.join("\n");
}

const defaultPreviewClassName = `flex items-center justify-center gap-4 text-base @max-lg:flex-col text-foreground`;

export function LiveComponent({
  code,
  children,
  scope,
  noInline,
  language = "tsx",
  className,
  editorClassName,
  previewClassName = "vkui-root",
  previewOrientation = "horizontal",
  initialTab = "preview",
  height = "h-fit",
  withPipecat,
  withConfirm,
}: LiveComponentProps) {
  const { theme: themeFromProvider } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [intent, setIntent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [client, setClient] = useState<PipecatClient | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!withPipecat || client || !intent) {
      return;
    }
    const pcClient = new PipecatClient({
      transport: new SmallWebRTCTransport(),
    });

    pcClient.initDevices();
    setClient(pcClient);
  }, [withPipecat, client, intent]);

  const rawSource = useMemo(() => {
    if (typeof code === "string") return code;
    if (typeof children === "string") return children;
    return "";
  }, [code, children]);
  const displaySource = useMemo(
    () => normalizeCodeIndentation(rawSource),
    [rawSource]
  );
  const execSource = useMemo(
    () => stripImportsExportsRequires(displaySource),
    [displaySource]
  );
  const mergedScope = useMemo(
    () => ({
      React,
      ...VoiceUIKit,
      ...VoiceUIKitWebGL,
      CircleIcon,
      ...(scope ?? {}),
    }),
    [scope]
  );

  const h = typeof height === "number" ? `h-[${height}px]` : height;
  const previewOrientationClass =
    previewOrientation === "horizontal" ? "flex-row" : "flex-col";

  let previewComp = (
    <LivePreview
      language={language}
      className={`${defaultPreviewClassName} ${h} ${previewOrientationClass} ${
        themeFromProvider === "dark" ? "dark" : ""
      } ${editorClassName ?? ""}`}
    />
  );

  if (withConfirm && !confirmed) {
    previewComp = (
      <div
        className={`${h} ${themeFromProvider === "dark" ? "dark" : ""} ${
          editorClassName ?? ""
        }`}
      >
        <VoiceUIKit.Card
          className="w-full h-full flex items-center justify-center text-center"
          background="stripes"
        >
          <VoiceUIKit.CardHeader>
            <VoiceUIKit.CardTitle>Interactive Example</VoiceUIKit.CardTitle>
          </VoiceUIKit.CardHeader>
          <VoiceUIKit.CardContent>
            This example contains interactive controls and may use significant
            resources. Click below to load the component.
          </VoiceUIKit.CardContent>
          <VoiceUIKit.CardContent>
            <VoiceUIKit.Button onClick={() => setConfirmed(true)}>
              Show Example
            </VoiceUIKit.Button>
          </VoiceUIKit.CardContent>
        </VoiceUIKit.Card>
      </div>
    );
  } else if (withPipecat && (!withConfirm || confirmed)) {
    if (!intent) {
      previewComp = (
        <div
          className={`${h} ${themeFromProvider === "dark" ? "dark" : ""} ${
            editorClassName ?? ""
          }`}
        >
          <VoiceUIKit.Card
            className="w-full h-full flex items-center justify-center text-center"
            background="stripes"
          >
            <VoiceUIKit.CardHeader>
              <VoiceUIKit.CardTitle>
                Media device access required
              </VoiceUIKit.CardTitle>
            </VoiceUIKit.CardHeader>
            <VoiceUIKit.CardContent>
              This preview requires access to microphone and / or camera. No
              data is sent or received.
            </VoiceUIKit.CardContent>
            <VoiceUIKit.CardContent>
              <VoiceUIKit.Button onClick={() => setIntent(true)}>
                Show preview
              </VoiceUIKit.Button>
            </VoiceUIKit.CardContent>
          </VoiceUIKit.Card>
        </div>
      );
    } else {
      previewComp = (
        <PipecatClientProvider client={client!}>
          {previewComp}
        </PipecatClientProvider>
      );
    }
  }

  // If withConfirm is true and confirmed is true, and withPipecat is also true, wrap with PipecatClientProvider
  if (withConfirm && confirmed && withPipecat && client) {
    previewComp = (
      <PipecatClientProvider client={client}>
        {previewComp}
      </PipecatClientProvider>
    );
  }

  return (
    <div className={className}>
      <LiveProvider
        code={execSource}
        scope={mergedScope}
        noInline={noInline}
        enableTypeScript={true}
      >
        <Tabs defaultValue={initialTab} items={["Preview", "Code"]}>
          <Tab
            value="Preview"
            className="min-h-[200px] flex items-center p-6 md:p-10 lg:p-12 xl:p-14"
          >
            <div className={`${previewClassName} relative w-full`}>
              {mounted ? (
                previewComp
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Loader2
                    className="animate-spin text-muted-foreground"
                    size={24}
                  />
                </div>
              )}
            </div>
          </Tab>
          <Tab value="Code" className={`${h} ${editorClassName}`}>
            <DynamicCodeBlock
              code={displaySource}
              lang={language}
              options={{
                themes: {
                  light: "github-light",
                  dark: "github-dark",
                },
                components: {
                  pre: (props) => (
                    <CodeBlock
                      data-line-numbers
                      data-line-numbers-start={1}
                      {...props}
                    >
                      <CodePre>{props.children}</CodePre>
                    </CodeBlock>
                  ),
                },
              }}
            />
          </Tab>
        </Tabs>
        <div style={{ color: "#dc2626", padding: 12 }}>
          <LiveError />
        </div>
      </LiveProvider>
      <div className="vkui-root">
        <div
          className={`voice-ui-kit ${
            themeFromProvider === "dark" ? "dark" : ""
          }`}
        />
      </div>
    </div>
  );
}
