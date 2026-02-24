"use client";

import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

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

  useEffect(() => {
    if (step < steps.length) {
      const timer = setTimeout(() => {
        setStep((s) => s + 1);
      }, stepDuration);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(onComplete, completionDelay);
      return () => clearTimeout(timer);
    }
  }, [step, steps.length, stepDuration, completionDelay, onComplete]);

  return (
    <motion.div
      key="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="flex min-h-[60vh] flex-col items-center justify-center px-4"
    >
      <div className="relative mb-14 flex h-40 w-40 items-center justify-center">
        {/* Pulsing rings */}
        <motion.div
          animate={{ scale: [1, 2.2], opacity: [0.2, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut" }}
          className="absolute inset-0 rounded-full border border-primary/40 bg-primary/5"
        />
        <motion.div
          animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeOut", delay: 1.5 }}
          className="absolute inset-0 rounded-full border border-primary/30 bg-primary/10"
        />
        <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-bg-elevated shadow-[0_0_40px_rgba(var(--color-primary),0.15)] backdrop-blur-md">
          {icon}
        </div>
      </div>

      <div className="h-8 overflow-hidden text-center">
        <AnimatePresence mode="popLayout">
          {step < steps.length ? (
            <motion.p
              key={step}
              initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="font-display text-[length:var(--text-fluid-lg)] font-medium tracking-wide text-text-primary"
            >
              {steps[step]}
            </motion.p>
          ) : (
            <motion.p
              key="complete"
              initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
              animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="font-display text-[length:var(--text-fluid-lg)] font-bold tracking-wide text-secondary"
            >
              Complete
              <motion.span
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                className="ml-2 inline-block h-2 w-2 rounded-full bg-secondary"
              />
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
