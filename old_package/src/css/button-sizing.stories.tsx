import { cn } from "@/lib/utils";
import type { Story, StoryDefault } from "@ladle/react";
import { TerminalIcon } from "lucide-react";

export default {
  title: "Documentation / Theme",
} satisfies StoryDefault;

const SizingItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-accent border-2 text-accent-foreground flex justify-center items-center mono-upper",
      className,
    )}
  >
    {children}
  </div>
);

export const ButtonSizing: Story = () => (
  <div className="ladle-section-container">
    <p>
      Multiple primitives are sized to the same dimensions as the button
      primitive, supporting the <code>size</code> prop.
    </p>
    <p>
      To support this, VKUI implements a custom <code>button-*</code> utility.
    </p>
    <h2 className="ladle-section-header">Sizing elements</h2>

    <section className="ladle-section">
      <SizingItem>Normal element e.g. a div</SizingItem>
      <SizingItem className="button-md ">Button Sized</SizingItem>
    </section>

    <section className="ladle-section">
      <SizingItem className="button-sm ">SM</SizingItem>
      <SizingItem className="button-md ">MD</SizingItem>
      <SizingItem className="button-lg ">LG</SizingItem>
      <SizingItem className="button-xl ">XL</SizingItem>
    </section>

    <h2 className="ladle-section-header">Button Icon sizing</h2>
    <p>
      For buttons where <code>isIcon</code> is <code>true</code>, the icon is
      sized using the <code>button-icon-*</code> utility.
    </p>
    <section className="ladle-section">
      <SizingItem className="button-icon-sm">SM</SizingItem>
      <SizingItem className="button-icon-md">MD</SizingItem>
      <SizingItem className="button-icon-lg">LG</SizingItem>
      <SizingItem className="button-icon-xl">XL</SizingItem>
    </section>

    <h2 className="ladle-section-header">SVG Icons</h2>
    <p>
      Direct descendants of a button that contain an SVG icon will adjust the
      gap and padding to center the icon more aesthetically.
    </p>
    <section className="ladle-section">
      <SizingItem className="button-xl">
        <TerminalIcon />
        With
      </SizingItem>
      <SizingItem className="button-xl">
        <div>
          <TerminalIcon />
        </div>
        Without
      </SizingItem>
    </section>
  </div>
);
