import { cn } from "@/lib/utils";
import { type ComponentProps } from "react";

function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-glass bg-bg-elevated/60 backdrop-blur-xl",
        "shadow-[0_8px_32px_rgb(0_0_0/0.3),0_2px_8px_rgb(0_0_0/0.2)]",
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-6 pt-6", className)} {...props} />;
}

function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export { Card, CardHeader, CardContent };
