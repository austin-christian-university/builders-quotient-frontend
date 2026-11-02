import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, type ElementType } from "react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-none font-display font-semibold",
    "transition-colors duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "touch-action-manipulation",
  ],
  {
    variants: {
      variant: {
        primary: [
          "border border-primary bg-primary text-ink",
          "hover:border-primary-hover hover:bg-primary-hover",
        ],
        secondary: [
          "border border-ink bg-ink text-paper",
          "hover:bg-secondary-hover",
        ],
        outline: [
          "border border-ink bg-transparent text-ink",
          "hover:bg-ink hover:text-paper",
        ],
        ghost: [
          "bg-transparent text-text-secondary",
          "hover:text-text-primary hover:bg-ink/5",
        ],
      },
      size: {
        // Note: sm (36px) meets WCAG 2.5.8 24px AA minimum but not 44px mobile recommendation.
        // Avoid using sm on primary mobile-facing interactive elements.
        sm: "min-h-9 px-4 text-sm",
        md: "min-h-11 px-6 text-sm",
        lg: "min-h-12 px-8 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

type ButtonProps<T extends ElementType = "button"> = {
  as?: T;
} & VariantProps<typeof buttonVariants> &
  Omit<ComponentProps<T>, "as">;

function Button<T extends ElementType = "button">({
  as,
  className,
  variant,
  size,
  ...props
}: ButtonProps<T>) {
  const Component = as ?? "button";
  return (
    <Component
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
