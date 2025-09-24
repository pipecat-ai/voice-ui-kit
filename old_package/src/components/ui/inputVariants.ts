import { cva } from "class-variance-authority";

export const inputVariants = cva(
  "border file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-md transition-[color,box-shadow] outline-none file:inline-flex file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "border-input bg-transparent text-foreground dark:bg-input/30",
        secondary:
          "border-input bg-accent dark:bg-background text-foreground focus-visible:ring-0",
        destructive:
          "border-destructive bg-destructive/10 text-destructive-foreground focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 focus-visible:border-destructive placeholder:text-destructive-foreground/50",
        ghost:
          "border-transparent text-foreground bg-transparent focus-visible:bg-black",
      },
      size: {
        sm: "button-sm px-2 text-sm",
        md: "button-md px-2.5",
        lg: "button-lg px-3.5",
        xl: "button-xl px-4",
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
    },
    defaultVariants: {
      size: "md",
      variant: "default",
      rounded: "size",
    },
  },
);
