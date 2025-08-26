import type { Story, StoryDefault } from "@ladle/react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story = () => (
  <div className="ladle-section-container">
    <div className="ladle-section">
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Menu Label</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
          <DropdownMenuItem>Item 3</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={true}>
            Item 1
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>
            Item 2
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>
            Item 3
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

Default.storyName = "Dropdown Menu";
