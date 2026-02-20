import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentProps, type ElementType } from "react";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "rounded-full font-display font-semibold",
    "transition-all duration-300 ease-[var(--ease-out-expo)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base",
    "disabled:pointer-events-none disabled:opacity-50",
    "touch-action-manipulation",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-primary text-bg-base",
          "hover:bg-primary-hover hover:shadow-[0_0_24px_rgb(77_163_255/0.4)]",
          "active:scale-[0.97]",
        ],
        secondary: [
          "bg-secondary text-bg-base",
          "hover:bg-secondary-hover hover:shadow-[0_0_24px_rgb(233_185_73/0.4)]",
          "active:scale-[0.97]",
        ],
        outline: [
          "border border-border-glass bg-transparent text-text-primary",
          "hover:bg-white/5 hover:border-white/20",
          "active:scale-[0.97]",
        ],
        ghost: [
          "bg-transparent text-text-secondary",
          "hover:text-text-primary hover:bg-white/5",
        ],
      },
      size: {
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
