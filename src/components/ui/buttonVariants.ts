import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "vkui:inline-flex vkui:items-center vkui:justify-center vkui:gap-2 vkui:whitespace-nowrap vkui:rounded-lg vkui:text-sm vkui:font-medium vkui:transition-all vkui:disabled:pointer-events-none vkui:disabled:opacity-50 vkui:[&_svg]:pointer-events-none vkui:shrink-0 vkui:[&_svg]:shrink-0 vkui:outline-none  vkui:focus-visible:ring-ring/50 vkui:focus-visible:ring-[3px] vkui:aria-invalid:ring-destructive/20 vkui:dark:aria-invalid:ring-destructive/40 vkui:aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "vkui:bg-primary vkui:text-primary-foreground vkui:hover:bg-primary/90 vkui:border vkui:border-transparent",
        secondary:
          "vkui:bg-secondary vkui:border vkui:border-transparent vkui:text-secondary-foreground vkui:hover:bg-secondary/60 vkui:focus-visible:border-secondary",
        outline:
          "vkui:text-foreground vkui:border vkui:bg-background vkui:hover:bg-accent vkui:dark:bg-input/30 vkui:dark:border-input vkui:dark:hover:bg-input/50 vkui:focus-visible:border-ring",
        destructive:
          "vkui:bg-destructive vkui:text-white vkui:hover:bg-destructive/90 vkui:focus-visible:ring-destructive/20 vkui:dark:focus-visible:ring-destructive/40 vkui:dark:bg-destructive/60",
        active:
          "vkui:bg-active vkui:text-active-foreground vkui:hover:bg-active/90 vkui:focus-visible:ring-active/20 vkui:dark:focus-visible:ring-active/40 vkui:dark:bg-active/60",
        inactive:
          "vkui:bg-inactive vkui:text-inactive-foreground vkui:hover:bg-inactive/90 vkui:focus-visible:ring-inactive/20 vkui:dark:focus-visible:ring-inactive/40 vkui:dark:bg-inactive/60",
        ghost:
          "vkui:text-foreground vkui:border vkui:border-transparent vkui:hover:bg-accent vkui:hover:text-accent-foreground vkui:dark:hover:bg-accent/50",
        link: "vkui:text-primary vkui:underline-offset-4 vkui:hover:underline vkui:border vkui:border-transparent",
      },
      size: {
        default:
          "vkui:h-8 vkui:px-4 vkui:py-2 vkui:has-[>svg]:px-3 vkui:[&_svg:not([class*='size-'])]:size-5",
        sm: "vkui:h-7 vkui:rounded-lg vkui:gap-1.5 vkui:px-3 vkui:has-[>svg]:px-2.5 vkui:[&_svg:not([class*='size-'])]:size-4",
        lg: "vkui:h-10 vkui:rounded-lg vkui:px-6 vkui:has-[>svg]:px-4 vkui:[&_svg:not([class*='size-'])]:size-5",
        xl: "vkui:h-12 vkui:rounded-xl vkui:px-8 vkui:text-lg vkui:has-[>svg]:px-6 vkui:[&_svg:not([class*='size-'])]:size-6 vkui:gap-3",
        icon: "vkui:h-8 vkui:w-8 vkui:p-0 vkui:has-[>svg]:p-0 vkui:[&_svg:not([class*='size-'])]:size-5",
        "icon-sm":
          "vkui:h-7 vkui:w-7 vkui:p-0 vkui:has-[>svg]:p-0 vkui:[&_svg:not([class*='size-'])]:size-4",
        "icon-xs":
          "vkui:h-6 vkui:w-6 vkui:p-0 vkui:has-[>svg]:p-0 vkui:[&_svg:not([class*='size-'])]:size-3",
      },
      isIcon: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        size: "default",
        isIcon: true,
        className:
          "vkui:size-8 vkui:@max-xs/panel:size-7 vkui:rounded-lg vkui:[&_svg:not([class*='size-'])]:size-5 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
      },
      {
        size: "sm",
        isIcon: true,
        className:
          "vkui:size-7 vkui:@max-xs/panel:size-6 vkui:rounded-lg vkui:[&_svg:not([class*='size-'])]:size-4 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-3",
      },
      {
        size: "lg",
        isIcon: true,
        className:
          "vkui:size-10 vkui:@max-xs/panel:size-9 vkui:rounded-lg vkui:[&_svg:not([class*='size-'])]:size-5 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
      },
      {
        size: "xl",
        isIcon: true,
        className:
          "vkui:size-12 vkui:rounded-xl vkui:[&_svg:not([class*='size-'])]:size-5 vkui:@max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      isIcon: false,
    },
  },
);

export type ButtonVariant = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["variant"];
export type ButtonSize = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["size"];

export const buttonVariantOptions = [
  "default",
  "outline",
  "secondary",
  "ghost",
  "link",
  "active",
  "inactive",
  "destructive",
] as const;
export const buttonSizeOptions = ["default", "sm", "lg", "xl"] as const;

export default buttonVariants;
