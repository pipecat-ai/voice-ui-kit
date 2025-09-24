import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "border inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent [--loader-stripe-color:var(--color-primary)]",
        secondary:
          "bg-secondary border-transparent text-secondary-foreground hover:bg-secondary/60 focus-visible:border-secondary [--loader-stripe-color:var(--color-secondary)]",
        outline:
          "text-foreground border bg-background hover:bg-accent dark:bg-input/30 dark:border-input dark:hover:bg-input/50 focus-visible:border-ring [--loader-stripe-color:var(--color-accent-foreground)]",
        destructive:
          "bg-destructive border-transparent text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60 [--loader-stripe-color:var(--color-destructive)]",
        ghost:
          "text-foreground border border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 [--loader-stripe-color:var(--color-accent-foreground)]",
        link: "text-primary underline-offset-4 hover:underline border border-transparent [--loader-stripe-color:var(--color-primary)]",
        active:
          "bg-active border border-transparent text-active-foreground hover:bg-active/90 focus-visible:ring-active/20 dark:focus-visible:ring-active/40",
        inactive:
          "bg-inactive border border-transparent text-inactive-foreground hover:bg-inactive/90 focus-visible:ring-inactive/20 dark:focus-visible:ring-inactive/40",
      },
      size: {
        sm: "button-sm [&_svg:not([class*='size-'])]:size-4",
        md: "button-md [&_svg:not([class*='size-'])]:size-5",
        lg: "button-lg [&_svg:not([class*='size-'])]:size-5",
        xl: "button-xl [&_svg:not([class*='size-'])]:size-6 text-lg",
      },
      rounded: {
        size: "",
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full",
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
        true: "w-full",
        false: "",
      },
      loader: {
        icon: "",
        stripes:
          "loader-stripes disabled:opacity-100 dark:disabled:opacity-100 text-white/0",
      },
      uppercase: {
        true: "uppercase tracking-wider",
        false: "",
      },
      noContainerQueries: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      /* Uppercase variants */
      {
        uppercase: true,
        size: "md",
        className: "text-[11px] [&_svg:not([class*='size-'])]:size-4",
      },
      {
        uppercase: true,
        size: "sm",
        className: "text-[10px]",
      },
      {
        uppercase: true,
        size: "lg",
        className: "text-xs [&_svg:not([class*='size-'])]:size-5",
      },
      {
        uppercase: true,
        size: "xl",
        className: "text-sm [&_svg:not([class*='size-'])]:size-5",
      },
      /* Container queries */
      {
        size: ["sm", "md", "lg", "xl"],
        isIcon: false,
        noContainerQueries: false,
        className:
          "@max-xs/panel:button-sm @max-xs/panel:has-[>svg]:button-sm @max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
      },
      {
        size: ["sm", "md", "lg", "xl"],
        isIcon: true,
        noContainerQueries: false,
        className:
          "@max-xs/panel:button-icon-sm @max-xs/panel:[&_svg:not([class*='size-'])]:size-4",
      },
      {
        rounded: "size",
        noContainerQueries: false,
        className: "@max-xs/panel:rounded-sm ",
      },
      /* Icon variants */
      {
        size: "sm",
        isIcon: true,
        className: "button-icon-sm [&_svg:not([class*='size-'])]:size-4",
      },
      {
        size: "md",
        isIcon: true,
        className: "button-icon-md [&_svg:not([class*='size-'])]:size-5",
      },
      {
        size: "lg",
        isIcon: true,
        className: "button-icon-lg [&_svg:not([class*='size-'])]:size-5",
      },
      {
        size: "xl",
        isIcon: true,
        className: "button-icon-xl [&_svg:not([class*='size-'])]:size-6",
      },
      /* State variants */
      {
        variant: "primary",
        state: "active",
        className:
          "bg-active text-active-foreground hover:bg-active/90 focus-visible:ring-active/20 dark:focus-visible:ring-active/40",
      },
      {
        variant: "primary",
        state: "inactive",
        className:
          "bg-inactive text-inactive-foreground hover:bg-inactive/90 focus-visible:ring-inactive/20 dark:focus-visible:ring-inactive/40",
      },
      {
        variant: "secondary",
        state: "active",
        className:
          "bg-active text-active-foreground hover:bg-active/90 focus-visible:ring-active/20 dark:focus-visible:ring-active/40 focus-visible:border-active",
      },
      {
        variant: "secondary",
        state: "inactive",
        className:
          "bg-inactive text-inactive-foreground hover:bg-inactive/90 focus-visible:ring-inactive/20 dark:focus-visible:ring-inactive/40 focus-visible:border-inactive",
      },
      {
        variant: "outline",
        state: "active",
        className:
          "bg-active-accent text-active border-active hover:bg-active-accent/60 dark:bg-active-accent dark:hover:bg-active-accent/60 dark:border-active focus-visible:border-active focus-visible:ring-active/20 dark:focus-visible:ring-active/40",
      },
      {
        variant: "outline",
        state: "inactive",
        className:
          "bg-inactive-accent text-inactive border-inactive hover:bg-inactive-accent/60 dark:bg-inactive-accent dark:hover:bg-inactive-accent/60 dark:border-inactive focus-visible:border-inactive focus-visible:ring-inactive/20 dark:focus-visible:ring-inactive/40",
      },
      /* Rounded size variants */
      {
        rounded: "size",
        size: "md",
        className: "rounded-md",
      },
      {
        rounded: "size",
        size: "sm",
        className: "rounded-sm",
      },
      {
        rounded: "size",
        size: "lg",
        className: "rounded-lg",
      },
      {
        rounded: "size",
        size: "xl",
        className: "rounded-xl",
      },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
      state: "default",
      rounded: "size",
      isIcon: false,
      isFullWidth: false,
      uppercase: false,
      noContainerQueries: false,
    },
  },
);

export type ButtonVariant = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["variant"];
export type ButtonSize = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["size"];
export type ButtonRounded = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["rounded"];
export type ButtonState = NonNullable<
  Parameters<typeof buttonVariants>[0]
>["state"];

export const buttonVariantOptions = [
  "primary",
  "outline",
  "secondary",
  "ghost",
  "link",
  "destructive",
  "active",
  "inactive",
] as const;
export const buttonSizeOptions = ["md", "sm", "lg", "xl"] as const;
export const buttonStateOptions = ["default", "active", "inactive"] as const;
export const buttonRoundedOptions = [
  "size",
  "sm",
  "md",
  "lg",
  "xl",
  "full",
  "none",
] as const;

export const buttonAccentColorMapCls: Record<
  (typeof buttonVariantOptions)[number],
  Record<(typeof buttonStateOptions)[number], string>
> = {
  primary: {
    default: "text-active",
    inactive: "text-inactive-foreground",
    active: "text-active",
  },
  secondary: {
    default: "text-active",
    inactive: "text-inactive-foreground",
    active: "text-active",
  },
  outline: {
    default: "text-active",
    inactive: "text-inactive",
    active: "text-active",
  },
  destructive: {
    default: "text-background",
    inactive: "text-background",
    active: "text-background",
  },
  ghost: {
    default: "text-active",
    inactive: "text-border",
    active: "text-active",
  },
  link: {
    default: "text-active",
    inactive: "text-inactive",
    active: "text-active",
  },
  active: {
    default: "text-active",
    inactive: "text-inactive-foreground",
    active: "text-active",
  },
  inactive: {
    default: "text-inactive",
    inactive: "text-inactive-foreground",
    active: "text-inactive",
  },
};

export const buttonAccentColorMap: Record<
  (typeof buttonVariantOptions)[number],
  Record<(typeof buttonStateOptions)[number], string>
> = {
  primary: {
    default: "--color-active",
    inactive: "--color-inactive-foreground",
    active: "--color-active",
  },
  secondary: {
    default: "--color-active",
    inactive: "--color-inactive-foreground",
    active: "--color-active",
  },
  outline: {
    default: "--color-active",
    inactive: "--color-inactive",
    active: "--color-active",
  },
  destructive: {
    default: "--color-background",
    inactive: "--color-background",
    active: "--color-background",
  },
  ghost: {
    default: "--color-active",
    inactive: "--color-border",
    active: "--color-active",
  },
  link: {
    default: "--color-active",
    inactive: "--color-inactive",
    active: "--color-active",
  },
  active: {
    default: "--color-active",
    inactive: "--color-inactive-foreground",
    active: "--color-active",
  },
  inactive: {
    default: "--color-inactive",
    inactive: "--color-inactive-foreground",
    active: "--color-inactive",
  },
};

export default buttonVariants;
