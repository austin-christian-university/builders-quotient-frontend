"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
} & Omit<HTMLMotionProps<"div">, "children">;

function ScrollReveal({ children, delay = 0, ...props }: ScrollRevealProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (prefersReducedMotion) {
    return <div {...(props as React.ComponentProps<"div">)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-64px" }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export { ScrollReveal };
