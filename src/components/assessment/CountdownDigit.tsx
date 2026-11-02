"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

type CountdownDigitProps = {
  number: number;
  onEnterComplete?: (n: number) => void;
  prefersReducedMotion?: boolean;
};

export function CountdownDigit({
  number,
  onEnterComplete,
  prefersReducedMotion,
}: CountdownDigitProps) {
  useEffect(() => {
    if (prefersReducedMotion) {
      onEnterComplete?.(number);
    }
  }, [prefersReducedMotion, number, onEnterComplete]);

  if (prefersReducedMotion) {
    return (
      <span
        className="select-none text-[clamp(6rem,20vw,10rem)] font-semibold leading-none tracking-[-0.055em] text-ink"
      >
        {number}
      </span>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={number}
        initial={{ opacity: 0, scale: 1.3 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.85 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={() => onEnterComplete?.(number)}
        className="select-none text-[clamp(6rem,20vw,10rem)] font-semibold leading-none tracking-[-0.055em] text-ink"
      >
        {number}
      </motion.span>
    </AnimatePresence>
  );
}
