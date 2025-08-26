import type { Story, StoryDefault } from "@ladle/react";
import { CircleAlertIcon } from "lucide-react";
import {
  Banner,
  BannerClose,
  BannerIcon,
  BannerProps,
  BannerTitle,
} from "./banner";

export default {
  title: "Primitives",
} satisfies StoryDefault;

export const Default: Story<BannerProps> = ({ variant }) => (
  <Banner variant={variant} className="animate-in fade-in duration-300">
    <BannerIcon icon={CircleAlertIcon} />
    <BannerTitle>
      Unable to connect. Please check web console for errors.
    </BannerTitle>
    <BannerClose variant="destructive" />
  </Banner>
);

Default.argTypes = {
  variant: {
    options: ["primary", "destructive", "active", "inactive"],
    control: { type: "select" },
    defaultValue: "primary",
  },
};

Default.storyName = "Banner";
