import { Card } from "@/components/ui/card";
import type { Story, StoryDefault } from "@ladle/react";
import { useRef, useState } from "react";
import { Button } from "../ui/button";
import { HighlightOverlay } from "./HighlightOverlay";

export default {
  title: "Components / Highlight Overlay",
} satisfies StoryDefault;

export const Default: Story = () => {
  const [highlightedElement, setHighlightedElement] = useState<string | null>(
    null,
  );
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  const elementRefs = {
    card1: card1Ref.current,
    card2: card2Ref.current,
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setHighlightedElement("card1")}
        >
          Highlight Card 1
        </Button>
        <Button
          variant="outline"
          onClick={() => setHighlightedElement("card2")}
        >
          Highlight Card 2
        </Button>
        <Button variant="outline" onClick={() => setHighlightedElement(null)}>
          Clear Highlight
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card
          ref={card1Ref}
          className="p-6 w-64 h-32 flex items-center justify-center"
        >
          <div className="text-center">
            <h3 className="font-semibold">Card 1</h3>
            <p className="text-sm text-muted-foreground">
              Click the button above to highlight me
            </p>
          </div>
        </Card>

        <Card
          ref={card2Ref}
          className="p-6 w-64 h-32 flex items-center justify-center"
        >
          <div className="text-center">
            <h3 className="font-semibold">Card 2</h3>
            <p className="text-sm text-muted-foreground">
              Click the button above to highlight me
            </p>
          </div>
        </Card>
      </div>

      <HighlightOverlay
        highlightedElement={highlightedElement}
        elementRefs={elementRefs}
        onHighlightElement={setHighlightedElement}
        className="ring-2 ring-blue-500 ring-offset-2"
        offset={8}
        autoClearDuration={4000}
      />
    </div>
  );
};

export const CustomStyling: Story = () => {
  const [highlightedElement, setHighlightedElement] = useState<string | null>(
    null,
  );
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  const elementRefs = {
    card1: card1Ref.current,
    card2: card2Ref.current,
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setHighlightedElement("card1")}
        >
          Highlight Card 1
        </Button>
        <Button
          variant="outline"
          onClick={() => setHighlightedElement("card2")}
        >
          Highlight Card 2
        </Button>
        <Button variant="outline" onClick={() => setHighlightedElement(null)}>
          Clear Highlight
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card
          ref={card1Ref}
          className="p-6 w-64 h-32 flex items-center justify-center"
        >
          <div className="text-center">
            <h3 className="font-semibold">Card 1</h3>
            <p className="text-sm text-muted-foreground">
              Custom green highlight
            </p>
          </div>
        </Card>

        <Card
          ref={card2Ref}
          className="p-6 w-64 h-32 flex items-center justify-center"
        >
          <div className="text-center">
            <h3 className="font-semibold">Card 2</h3>
            <p className="text-sm text-muted-foreground">
              Custom red highlight
            </p>
          </div>
        </Card>
      </div>

      <HighlightOverlay
        highlightedElement={highlightedElement}
        elementRefs={elementRefs}
        onHighlightElement={setHighlightedElement}
        className={
          highlightedElement === "card1"
            ? "ring-4 ring-green-500"
            : "ring-4 ring-red-500"
        }
        offset={12}
        autoClearDuration={3000}
      />
    </div>
  );
};

export const NoAutoClear: Story = () => {
  const [highlightedElement, setHighlightedElement] = useState<string | null>(
    null,
  );
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

  const elementRefs = {
    card1: card1Ref.current,
    card2: card2Ref.current,
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={() => setHighlightedElement("card1")}
        >
          Highlight Card 1
        </Button>
        <Button
          variant="outline"
          onClick={() => setHighlightedElement("card2")}
        >
          Highlight Card 2
        </Button>
        <Button variant="outline" onClick={() => setHighlightedElement(null)}>
          Clear Highlight
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card
          ref={card1Ref}
          className="p-6 w-64 h-32 flex items-center justify-center"
        >
          <div className="text-center">
            <h3 className="font-semibold">Card 1</h3>
            <p className="text-sm text-muted-foreground">
              Highlight stays until manually cleared
            </p>
          </div>
        </Card>

        <Card
          ref={card2Ref}
          className="p-6 w-64 h-32 flex items-center justify-center"
        >
          <div className="text-center">
            <h3 className="font-semibold">Card 2</h3>
            <p className="text-sm text-muted-foreground">
              Highlight stays until manually cleared
            </p>
          </div>
        </Card>
      </div>

      <HighlightOverlay
        highlightedElement={highlightedElement}
        elementRefs={elementRefs}
        onHighlightElement={setHighlightedElement}
        className="ring-2 ring-purple-500 ring-offset-4"
        offset={6}
        autoClearDuration={0}
      />
    </div>
  );
};
