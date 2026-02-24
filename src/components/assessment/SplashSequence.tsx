"use client";

import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

type SplashSequenceProps = {
  steps: string[];
  icon: ReactNode;
  onComplete: () => void;
  /** Milliseconds per step before advancing. Default 2200. */
  stepDuration?: number;
  /** Milliseconds to hold "Complete" state before calling onComplete. Default 800. */
  completionDelay?: number;
};

export function SplashSequence({
  steps,
  icon,
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

  if (prefersReducedMotion) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center px-4">
        <div className="relative mb-20 flex h-48 w-48 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/20 blur-[40px]" />
          <div className="absolute inset-4 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-2xl" />
          <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-bg-surface/90 shadow-[0_0_80px_rgba(var(--color-primary),0.25)] backdrop-blur-3xl">
            {icon}
          </div>
        </div>

        <div className="h-10 text-center flex items-center justify-center" aria-live="polite">
          {step < steps.length ? (
            <p className="font-display text-[length:var(--text-fluid-xl)] font-medium tracking-wide text-text-primary">
              {steps[step]}
            </p>
          ) : (
            <p className="font-display text-[length:var(--text-fluid-xl)] font-bold tracking-[0.15em] text-secondary uppercase">
              Complete
              <span className="ml-3 mb-1 inline-block h-2 w-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(var(--color-secondary),1)]" />
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(20px)" }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex min-h-[60vh] w-full flex-col items-center justify-center px-4"
    >
      <div className="relative mb-20 flex h-48 w-48 items-center justify-center">
        {/* Cinematic glow core */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.3, 0.6, 0.3],
            filter: ["blur(40px)", "blur(70px)", "blur(40px)"]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-primary/40"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute inset-4 rounded-full border border-primary/20 bg-primary/10 backdrop-blur-2xl"
        />
        <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-primary/30 bg-bg-surface/90 shadow-[0_0_80px_rgba(var(--color-primary),0.25)] backdrop-blur-3xl">
          {icon}
        </div>
      </div>

      <div className="h-10 overflow-hidden text-center flex items-center justify-center" aria-live="polite">
        <AnimatePresence mode="popLayout">
          {step < steps.length ? (
            <motion.p
              key={step}
              initial={{ y: 30, opacity: 0, filter: "blur(12px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -30, opacity: 0, filter: "blur(12px)" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[length:var(--text-fluid-xl)] font-medium tracking-wide text-text-primary"
            >
              {steps[step]}
            </motion.p>
          ) : (
            <motion.p
              key="complete"
              initial={{ y: 30, opacity: 0, filter: "blur(12px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="font-display text-[length:var(--text-fluid-xl)] font-bold tracking-[0.15em] text-secondary uppercase"
            >
              Complete
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                className="ml-3 mb-1 inline-block h-2 w-2 rounded-full bg-secondary shadow-[0_0_10px_rgba(var(--color-secondary),1)]"
              />
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
