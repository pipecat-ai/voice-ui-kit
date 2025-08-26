import {
  Select,
  SelectContent,
  SelectGuide,
  SelectItem,
  SelectTrigger,
  type SelectTriggerProps,
  SelectValue,
} from "@/components/ui/select";
import type { Story, StoryDefault } from "@ladle/react";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const SelectDefault: Story<SelectTriggerProps> = ({ ...props }) => (
  <div className="ladle-section-container w-full!">
    <h2 className="ladle-section-header">Default</h2>
    <section className="ladle-section">
      <Select>
        <SelectTrigger {...props} className="w-full" align="left">
          <SelectValue placeholder="Please select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item-1">Select Item 1</SelectItem>
          <SelectItem value="item-2">Select Item 2</SelectItem>
          <SelectItem value="item-3">Select Item 3</SelectItem>
        </SelectContent>
      </Select>
    </section>

    <h2 className="ladle-section-header">With Guide</h2>
    <section className="ladle-section">
      <Select>
        <SelectTrigger {...props} className="w-full">
          <SelectGuide>Select</SelectGuide>
          <SelectValue placeholder="Please select" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="item-1">Select Item 1</SelectItem>
          <SelectItem value="item-2">Select Item 2</SelectItem>
          <SelectItem value="item-3">Select Item 3</SelectItem>
        </SelectContent>
      </Select>
    </section>
  </div>
);

SelectDefault.argTypes = {
  size: {
    options: ["md", "sm", "lg", "xl"],
    control: { type: "select" },
    defaultValue: "md",
  },
  variant: {
    options: ["primary", "outline", "ghost"],
    control: { type: "select" },
  },
  rounded: {
    options: ["size", "none", "sm", "md", "lg", "xl", "full"],
    control: { type: "select" },
    defaultValue: "size",
  },
};

SelectDefault.storyName = "Select";
