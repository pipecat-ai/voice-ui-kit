import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "vkui:border vkui:inline-flex vkui:items-center vkui:justify-center vkui:gap-2 vkui:whitespace-nowrap vkui:rounded-element vkui:text-sm vkui:font-medium vkui:transition-all vkui:disabled:pointer-events-none vkui:disabled:opacity-50 vkui:[&_svg]:pointer-events-none vkui:shrink-0 vkui:[&_svg]:shrink-0 vkui:outline-none vkui:focus-visible:ring-ring/50 vkui:focus-visible:ring-[3px] vkui:aria-invalid:ring-destructive/20 vkui:dark:aria-invalid:ring-destructive/40 vkui:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "vkui:bg-primary vkui:text-primary-foreground vkui:hover:bg-primary/90 vkui:border-transparent vkui:[--vkui-loader-stripe-color:var(--vkui-color-primary)]",
        secondary:
          "vkui:bg-secondary vkui:border-transparent vkui:text-secondary-foreground vkui:hover:bg-secondary/60 vkui:focus-visible:border-secondary vkui:[--vkui-loader-stripe-color:var(--vkui-color-secondary)]",
        outline:
          "vkui:text-foreground vkui:border vkui:bg-background vkui:hover:bg-accent vkui:dark:bg-input/30 vkui:dark:border-input vkui:dark:hover:bg-input/50 vkui:focus-visible:border-ring vkui:[--vkui-loader-stripe-color:var(--vkui-color-accent-foreground)]",
        destructive:
          "vkui:bg-destructive vkui:border-transparent vkui:text-white vkui:hover:bg-destructive/90 vkui:focus-visible:ring-destructive/20 vkui:dark:focus-visible:ring-destructive/40 vkui:dark:bg-destructive/60 vkui:[--vkui-loader-stripe-color:var(--vkui-color-destructive)]",
        ghost:
          "vkui:text-foreground vkui:border vkui:border-transparent vkui:hover:bg-accent vkui:hover:text-accent-foreground vkui:dark:hover:bg-accent/50 vkui:[--vkui-loader-stripe-color:var(--vkui-color-accent-foreground)]",
        link: "vkui:text-primary vkui:underline-offset-4 vkui:hover:underline vkui:border vkui:border-transparent vkui:[--vkui-loader-stripe-color:var(--vkui-color-primary)]",
        active:
          "vkui:bg-active vkui:border vkui:border-transparent vkui:text-active-foreground vkui:hover:bg-active/90 vkui:focus-visible:ring-active/20 vkui:dark:focus-visible:ring-active/40",
        inactive:
          "vkui:bg-inactive vkui:border vkui:border-transparent vkui:text-inactive-foreground vkui:hover:bg-inactive/90 vkui:focus-visible:ring-inactive/20 vkui:dark:focus-visible:ring-inactive/40",
      },
      size: {
        default:
          "vkui:h-8 vkui:px-4 vkui:py-2 vkui:has-[>svg]:px-3 vkui:[&_svg:not([class*='size-'])]:size-5 vkui:@max-xs/panel:h-7 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
        sm: "vkui:h-7 vkui:rounded-element vkui:gap-1.5 vkui:px-3 vkui:has-[>svg]:px-2.5 vkui:[&_svg:not([class*='size-'])]:size-4 vkui:@max-xs/panel:h-6 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-3",
        lg: "vkui:h-10 vkui:rounded-element vkui:px-6 vkui:has-[>svg]:px-4 vkui:[&_svg:not([class*='size-'])]:size-5 vkui:@max-xs/panel:h-9 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
        xl: "vkui:h-12 vkui:rounded-element vkui:px-8 vkui:text-lg vkui:has-[>svg]:px-6 vkui:[&_svg:not([class*='size-'])]:size-6 vkui:gap-3 vkui:@max-xs/panel:h-10 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-5",
        icon: "vkui:h-8 vkui:w-8 vkui:p-0 vkui:has-[>svg]:p-0 vkui:[&_svg:not([class*='size-'])]:size-5",
        "icon-sm":
          "vkui:h-7 vkui:w-7 vkui:p-0 vkui:has-[>svg]:p-0 vkui:[&_svg:not([class*='size-'])]:size-4",
        "icon-xs":
          "vkui:h-6 vkui:w-6 vkui:p-0 vkui:has-[>svg]:p-0 vkui:[&_svg:not([class*='size-'])]:size-3",
      },
      state: {
        default: "",
        active: "",
        inactive: "",
      },
      isIcon: {
        true: "",
        false: "",
      },
      isFullWidth: {
        true: "vkui:w-full",
        false: "",
      },
      loader: {
        icon: "",
        stripes:
          "vkui:loader-stripes vkui:disabled:opacity-100 vkui:dark:disabled:opacity-100 vkui:text-white/0",
      },
    },
    compoundVariants: [
      {
        size: "default",
        isIcon: true,
        className:
          "vkui:size-8 vkui:@max-xs/panel:size-7 vkui:rounded-element vkui:[&_svg:not([class*='size-'])]:size-5 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
      },
      {
        size: "sm",
        isIcon: true,
        className:
          "vkui:size-7 vkui:@max-xs/panel:size-6 vkui:rounded-element vkui:[&_svg:not([class*='size-'])]:size-4 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-3",
      },
      {
        size: "lg",
        isIcon: true,
        className:
          "vkui:size-10 vkui:@max-xs/panel:size-9 vkui:rounded-element vkui:[&_svg:not([class*='size-'])]:size-5 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
      },
      {
        size: "xl",
        isIcon: true,
        className:
          "vkui:size-12 vkui:rounded-element vkui:[&_svg:not([class*='size-'])]:size-5 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
      },
      {
        variant: "default",
        state: "active",
        className:
          "vkui:bg-active vkui:text-active-foreground vkui:hover:bg-active/90 vkui:focus-visible:ring-active/20 vkui:dark:focus-visible:ring-active/40",
      },
      {
        variant: "default",
        state: "inactive",
        className:
          "vkui:bg-inactive vkui:text-inactive-foreground vkui:hover:bg-inactive/90 vkui:focus-visible:ring-inactive/20 vkui:dark:focus-visible:ring-inactive/40",
      },
      {
        variant: "secondary",
        state: "active",
        className:
          "vkui:bg-active vkui:text-active-foreground vkui:hover:bg-active/90 vkui:focus-visible:ring-active/20 vkui:dark:focus-visible:ring-active/40 vkui:focus-visible:border-active",
      },
      {
        variant: "secondary",
        state: "inactive",
        className:
          "vkui:bg-inactive vkui:text-inactive-foreground vkui:hover:bg-inactive/90 vkui:focus-visible:ring-inactive/20 vkui:dark:focus-visible:ring-inactive/40 vkui:focus-visible:border-inactive",
      },
      {
        variant: "outline",
        state: "active",
        className:
          "vkui:bg-active-accent vkui:text-active vkui:border-active vkui:hover:bg-active-accent/60 vkui:dark:bg-active-accent vkui:dark:hover:bg-active-accent/60 vkui:dark:border-active vkui:focus-visible:border-active vkui:focus-visible:ring-active/20 vkui:dark:focus-visible:ring-active/40",
      },
      {
        variant: "outline",
        state: "inactive",
        className:
          "vkui:bg-inactive-accent vkui:text-inactive vkui:border-inactive vkui:hover:bg-inactive-accent/60 vkui:dark:bg-inactive-accent vkui:dark:hover:bg-inactive-accent/60 vkui:dark:border-inactive vkui:focus-visible:border-inactive vkui:focus-visible:ring-inactive/20 vkui:dark:focus-visible:ring-inactive/40",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
      isIcon: false,
      isFullWidth: false,
    },
  },
);

export type ButtonVariant = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["variant"];
export type ButtonSize = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["size"];
export type ButtonState = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["state"];

export const buttonVariantOptions = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "link",
  "destructive",
  "active",
  "inactive",
] as const;
export const buttonSizeOptions = ["default", "sm", "lg", "xl"] as const;
export const buttonStateOptions = ["default", "active", "inactive"] as const;

export const buttonAccentColorMap: Record<
  (typeof buttonVariantOptions)[number],
  Record<(typeof buttonStateOptions)[number], string>
> = {
  default: {
    default: "--vkui-color-active",
    inactive: "--vkui-color-inactive-foreground",
    active: "--vkui-color-active",
  },
  secondary: {
    default: "--vkui-color-active",
    inactive: "--vkui-color-inactive-foreground",
    active: "--vkui-color-active",
  },
  outline: {
    default: "--vkui-color-active",
    inactive: "--vkui-color-inactive",
    active: "--vkui-color-active",
  },
  destructive: {
    default: "--vkui-color-background",
    inactive: "--vkui-color-background",
    active: "--vkui-color-background",
  },
  ghost: {
    default: "--vkui-color-active",
    inactive: "--vkui-color-border",
    active: "--vkui-color-active",
  },
  link: {
    default: "--vkui-color-active",
    inactive: "--vkui-color-inactive",
    active: "--vkui-color-active",
  },
  active: {
    default: "--vkui-color-active",
    inactive: "--vkui-color-inactive-foreground",
    active: "--vkui-color-active",
  },
  inactive: {
    default: "--vkui-color-inactive",
    inactive: "--vkui-color-inactive-foreground",
    active: "--vkui-color-inactive",
  },
};
export default buttonVariants;
