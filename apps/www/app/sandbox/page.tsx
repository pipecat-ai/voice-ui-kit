"use client";

import { useSandboxStore } from "@/lib/sandbox";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const SandpackComponent = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => mod.Sandpack),
  {
    ssr: false,
    loading: () => <div>Loading editor...</div>,
  },
);

export default function SandboxPage() {
  const { code: storedCode, clearCode } = useSandboxStore();
  const [exampleCode, setExampleCode] = useState(`
    export default function Example() {
      return <></>;
    }
    `);

  useEffect(() => {
    if (storedCode) {
      setExampleCode(storedCode);
      clearCode();
    }
  }, [storedCode, clearCode]);

  return (
    <SandpackComponent
      template="react-ts"
      customSetup={{
        dependencies: {
          "@pipecat-ai/voice-ui-kit": "latest",
          "@pipecat-ai/client-js": "latest",
          "@pipecat-ai/client-react": "latest",
          "@pipecat-ai/small-webrtc-transport": "latest",
        },
      }}
      files={{
        "/App.tsx": `
import { FullScreenContainer, Button } from "@pipecat-ai/voice-ui-kit";
import "@pipecat-ai/voice-ui-kit/styles";

import Example from "./example";

export default function App() {
  return (
    <FullScreenContainer>
      <Example />
    </FullScreenContainer>
  );
}
`,
        "/example.tsx": exampleCode,
      }}
      options={{
        showLineNumbers: true,
        //@ts-expect-error - activeFile seems to not accept strings
        activeFile: "/example.tsx",
        editorHeight: 500,
      }}
    />
  );
}
