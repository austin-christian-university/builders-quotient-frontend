"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { BqMark } from "@/components/brand/BqMark";

type SplashSequenceProps = {
  steps: string[];
  onComplete: () => void;
  /** Milliseconds per step before advancing. Default 2200. */
  stepDuration?: number;
  /** Milliseconds to hold "Complete" state before calling onComplete. Default 800. */
  completionDelay?: number;
};

const textClass =
  "font-display text-[clamp(24px,5vw,32px)] font-semibold leading-tight tracking-[-0.035em] text-text-primary";

export function SplashSequence({
  steps,
  onComplete,
  stepDuration = 2200,
  completionDelay = 800,
}: SplashSequenceProps) {
  const [step, setStep] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();

  const effectiveStepDuration = prefersReducedMotion ? 600 : stepDuration;
  const effectiveCompletionDelay = prefersReducedMotion ? 300 : completionDelay;

  useEffect(() => {
    if (step < steps.length) {
      const timer = setTimeout(() => {
        setStep((s) => s + 1);
      }, effectiveStepDuration);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, effectiveCompletionDelay);
      return () => clearTimeout(timer);
    }
  }, [step, steps.length, effectiveStepDuration, effectiveCompletionDelay, onComplete]);

  const isDone = step >= steps.length;
  const total = Math.max(steps.length, 1);
  // The rule fills toward the end of the current step while it is on screen.
  const target = Math.min(step + 1, total) / total;

  if (prefersReducedMotion) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <BqMark className="mb-10 size-12 text-ink" />
          <div className="min-h-10" aria-live="polite">
            <p className={textClass}>{isDone ? "Complete" : steps[step]}</p>
          </div>
          <div className="mt-6 h-px w-full bg-border" aria-hidden="true">
            <div className="h-full bg-ink" style={{ width: `${(isDone ? 1 : step / total) * 100}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex min-h-[60vh] w-full items-center justify-center px-4"
    >
      <div className="w-full max-w-sm">
        <BqMark className="mb-10 size-12 text-ink" />

        <div className="min-h-10 overflow-hidden" aria-live="polite">
          <AnimatePresence mode="wait">
            <motion.p
              key={isDone ? "complete" : step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={textClass}
            >
              {isDone ? "Complete" : steps[step]}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="mt-6 h-px w-full bg-border" aria-hidden="true">
          <motion.div
            className="h-full origin-left bg-ink"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: target }}
            transition={{ duration: effectiveStepDuration / 1000, ease: "linear" }}
          />
        </div>
      </div>
    </motion.div>
  );
}
