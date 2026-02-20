"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ProcessingBufferProps = {
  secondsRemaining: number;
  totalSeconds: number;
};

export function ProcessingBuffer({
  secondsRemaining,
  totalSeconds,
}: ProcessingBufferProps) {
  const progress = 1 - secondsRemaining / totalSeconds;
  const circumference = 2 * Math.PI * 54; // radius 54
  const offset = circumference * (1 - progress);
  const isDramatic = secondsRemaining <= 3;

  return (
    <div className="flex flex-col items-center gap-4" aria-live="polite">
      {/* Circular progress */}
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-500",
          isDramatic ? "h-40 w-40" : "h-32 w-32"
        )}
      >
        {/* Background pulse during final seconds */}
        {isDramatic && (
          <motion.div
            className="absolute inset-0 rounded-full bg-secondary/10"
            animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          {/* Background ring */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-border-glass"
          />
          {/* Progress ring with glow */}
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="text-secondary transition-[stroke-dashoffset] duration-1000 ease-linear"
            style={{
              filter: "drop-shadow(0 0 6px var(--color-secondary))",
            }}
          />
        </svg>

        {/* Animated countdown number */}
        <AnimatePresence mode="wait">
          <motion.span
            key={secondsRemaining}
            initial={{ y: 20, opacity: 0, scale: isDramatic ? 0.8 : 1 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{
              type: "spring",
              duration: 0.3,
              bounce: 0.15,
            }}
            className={cn(
              "font-display font-bold tabular-nums text-secondary",
              isDramatic
                ? "text-[length:var(--text-fluid-4xl)]"
                : "text-[length:var(--text-fluid-3xl)]"
            )}
          >
            {secondsRemaining}
          </motion.span>
        </AnimatePresence>
      </div>

      <p className="text-[length:var(--text-fluid-sm)] text-text-secondary">
        Recording begins in{" "}
        <span className="tabular-nums text-text-primary">
          {secondsRemaining}
        </span>{" "}
        {secondsRemaining === 1 ? "second" : "seconds"}
      </p>
    </div>
  );
}
