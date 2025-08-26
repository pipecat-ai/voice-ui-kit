import type { Story, StoryDefault } from "@ladle/react";
import { Card, CardContent } from "./card";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "./resizable";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story = () => (
  <Card className="h-full py-0">
    <ResizablePanelGroup direction="horizontal" className="w-full">
      <ResizablePanel defaultSize={50} minSize={10}>
        <ResizablePanelGroup direction="vertical" className="h-full">
          <ResizablePanel defaultSize={50} minSize={10}>
            <CardContent>Hello</CardContent>
          </ResizablePanel>
          <ResizableHandle withHandle noBorder={false} size="md" />
          <ResizablePanel defaultSize={50} minSize={10}>
            <CardContent>Hello</CardContent>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle withHandle noBorder={false} size="md" />
      <ResizablePanel defaultSize={50} minSize={10}>
        <CardContent>Hello</CardContent>
      </ResizablePanel>
    </ResizablePanelGroup>
  </Card>
);

Default.storyName = "Resizable";
