"use client";

import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import * as React from "react";
import { useEffect, useState } from "react";

import "@pipecat-ai/voice-ui-kit/styles.scoped";

let uiKitModule: any = null;
let uiKitPromise: Promise<any> | null = null;

async function getUiKitModule() {
  if (uiKitModule) return uiKitModule;
  if (uiKitPromise) return uiKitPromise;

  uiKitPromise = import("@pipecat-ai/voice-ui-kit");
  uiKitModule = await uiKitPromise;
  return uiKitModule;
}

export function ComponentPreview({
  className,
  align = "center",
  hideCode = false,
  componentName,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  align?: "center" | "start" | "end";
  hideCode?: boolean;
  componentName: string;
  children: React.ReactNode;
}) {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getUiKitModule()
      .then((module) => {
        const ComponentFromModule = module[componentName];
        if (!ComponentFromModule) {
          console.error(`Component '${componentName}' not found in UI kit.`);
          return;
        }

        setComponent(() => ComponentFromModule);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load sandbox resources:", error);
      });
  }, [componentName]);

  return (
    <div className="group relative mt-4 mb-12 flex flex-col gap-2" {...props}>
      <Tabs items={["Preview", "Code"]}>
        <Tab
          value="Preview"
          className="data-[tab=code]:border-code relative rounded-lg border md:-mx-1"
        >
          <div
            data-align={align}
            className="preview vkui-root flex h-[450px] w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start"
          >
            {Component && <Component {...props}>Pew</Component>}
          </div>
        </Tab>
        <Tab value="Code" className="**:[pre]:h-[450px]">
          {children}
        </Tab>
      </Tabs>
    </div>
  );
}
