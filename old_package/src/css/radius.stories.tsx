import { cn } from "@/lib/utils";
import type { Story, StoryDefault } from "@ladle/react";

export default {
  title: "Documentation / Theme",
} satisfies StoryDefault;

const RadiusItem = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "bg-accent size-20 border-2 text-accent-foreground flex justify-center items-center mono-upper",
      className,
    )}
  >
    {children}
  </div>
);

export const Radius: Story = () => (
  <div className="flex flex-col gap-6">
    <div className="flex flex-row gap-4 w-fit">
      <RadiusItem className="rounded-xs">xs</RadiusItem>
      <RadiusItem className="rounded-sm">sm</RadiusItem>
      <RadiusItem className="rounded-md">md</RadiusItem>
      <RadiusItem className="rounded-lg">lg</RadiusItem>
      <RadiusItem className="rounded-xl">xl</RadiusItem>
      <RadiusItem className="rounded-2xl">2xl</RadiusItem>
      <RadiusItem className="rounded-3xl">3xl</RadiusItem>
      <RadiusItem className="rounded-4xl">4xl</RadiusItem>
    </div>
    <hr />
    <p>
      Radius is calculated from <code>--radius-base</code> which defaults to{" "}
      <code>0.375rem (6px)</code>. This allows you to override the radius for
      all elements by setting <code>--radius-base</code> in your theme.
    </p>
    <p>
      Individual properties can also be overridden by setting the
      <code>--radius-*</code> variable to a different value:
    </p>
    <div
      className="flex flex-row gap-4 w-fit"
      style={
        {
          "--radius-xl": "9999px",
        } as React.CSSProperties
      }
    >
      <RadiusItem className="rounded-xs">xs</RadiusItem>
      <RadiusItem className="rounded-sm">sm</RadiusItem>
      <RadiusItem className="rounded-md">md</RadiusItem>
      <RadiusItem className="rounded-lg">lg</RadiusItem>
      <RadiusItem className="rounded-xl border-inactive">xl</RadiusItem>
      <RadiusItem className="rounded-t-xl border-inactive">t-xl</RadiusItem>
      <RadiusItem className="rounded-2xl">2xl</RadiusItem>
      <RadiusItem className="rounded-3xl">3xl</RadiusItem>
      <RadiusItem className="rounded-4xl">4xl</RadiusItem>
    </div>
    <hr />
    <p>
      By default, components will render a border radius by following a
      particular order of precedence:
      <ul>
        <li>
          Automatically set based on the <code>size</code> property of the
          component
        </li>
        <li>
          Override based on the <code>rounded</code> property of the component
        </li>
      </ul>
    </p>
    <p>
      This approach allows for less verbose code (i.e. not requiring you to
      specify the radius for every component), while still allowing you to
      override in specific cases.
    </p>
    <p>
      For example, <code>Button size="xl"</code> will render a button with a
      border radius of
      <code>var(--radius-xl)</code> by default, but can be overridden to
      <code>var(--radius-sm)</code> by setting the <code>rounded</code>
      property to <code>sm</code> e.g.{" "}
      <code>Button size="xl" rounded="sm"</code>.
    </p>
    <p>
      If you want all element to render without a border radius, you can set the
      <code>--radius-base</code> to <code>0</code> in your theme.
    </p>
  </div>
);
