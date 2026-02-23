import { cn } from "@/lib/utils";
import { type ComponentProps, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-xl border border-border-glass bg-bg-elevated/60 backdrop-blur-sm",
          "px-4 py-3 text-[length:var(--text-fluid-base)] text-text-primary",
          "placeholder:text-text-secondary/50",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-base",
          "aria-[invalid=true]:border-red-500/60 aria-[invalid=true]:focus:ring-red-500",
          "disabled:pointer-events-none disabled:opacity-50",
          "transition-colors duration-200",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
