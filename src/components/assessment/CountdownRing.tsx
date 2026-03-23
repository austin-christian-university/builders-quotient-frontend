"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { usePrefersReducedMotion } from "@/lib/hooks/use-reduced-motion";

const MIN_SECONDS_BEFORE_STOP = 10;

type CountdownRingProps = {
  secondsRemaining: number;
  totalSeconds: number;
  mode: "think" | "recording";
  label?: string;
  onStopEarly?: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// --- Compact floating timer badge (fixed top-right) ---
function FloatingTimerBadge({
  secondsRemaining,
  totalSeconds,
  mode,
  onStopEarly,
  canStopEarly,
}: {
  secondsRemaining: number;
  totalSeconds: number;
  mode: "think" | "recording";
  onStopEarly?: () => void;
  canStopEarly: boolean;
}) {
  const isThink = mode === "think";
  const circumference = 2 * Math.PI * 16;
  const progress = 1 - secondsRemaining / totalSeconds;
  const offset = circumference * (1 - progress);
  const isDramatic = isThink ? secondsRemaining <= 3 : secondsRemaining <= 5;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.9 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-full border border-white/10 bg-bg-elevated/80 px-3 py-2 shadow-2xl backdrop-blur-xl"
      role="timer"
      aria-label={`${secondsRemaining} seconds remaining`}
    >
      {/* Mini ring */}
      <div className="relative flex h-9 w-9 items-center justify-center">
        <svg className="-rotate-90" viewBox="0 0 40 40" aria-hidden="true">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-border-glass"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              isThink ? "text-primary" : "text-red-500",
              "transition-[stroke-dashoffset] duration-1000 ease-linear"
            )}
          />
        </svg>
      </div>

      {/* Time + label */}
      <div className="flex flex-col items-start">
        <span
          className={cn(
            "font-display text-sm font-bold tabular-nums leading-tight",
            isDramatic && !isThink ? "text-red-400" : "text-text-primary"
          )}
        >
          {isThink ? secondsRemaining : formatTime(secondsRemaining)}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-widest leading-tight",
            isThink ? "text-text-secondary" : "text-red-400"
          )}
        >
          {isThink ? "Think" : (
            <span className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              REC
            </span>
          )}
        </span>
      </div>

      {/* Compact "Done" button */}
      <AnimatePresence>
        {canStopEarly && onStopEarly && (
          <motion.button
            type="button"
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: "auto" }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={onStopEarly}
            className="ml-1 shrink-0 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-text-primary backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            Done
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}

export function CountdownRing({
  secondsRemaining,
  totalSeconds,
  mode,
  label,
  onStopEarly,
}: CountdownRingProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const circumference = 2 * Math.PI * 54;
  const progress = 1 - secondsRemaining / totalSeconds;
  const offset = circumference * (1 - progress);
  const elapsed = totalSeconds - secondsRemaining;

  const isThink = mode === "think";
  const isDramatic = isThink
    ? secondsRemaining <= 3
    : secondsRemaining <= 5;

  // Guard: require at least one countdown tick (secondsRemaining < totalSeconds)
  // AND the full MIN_SECONDS_BEFORE_STOP to have elapsed. This prevents
  // any flash of the button on first render or stale-state edge cases.
  const canStopEarly =
    !isThink &&
    !!onStopEarly &&
    secondsRemaining < totalSeconds &&
    elapsed >= MIN_SECONDS_BEFORE_STOP;

  // --- IntersectionObserver: detect when inline timer leaves viewport ---
  const inlineRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(true);

  useEffect(() => {
    const el = inlineRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const ringColor = isThink ? "text-primary" : "text-red-500";
  const glowFilter = isThink
    ? "drop-shadow(0 0 6px var(--color-primary))"
    : "drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))";

  return (
    <>
      {/* Inline timer (in-flow) */}
      <div
        ref={inlineRef}
        className={cn(
          "flex w-full flex-col items-center gap-3",
          isThink ? "py-6" : "py-4"
        )}
        aria-live="polite"
      >
        {/* Countdown ring */}
        <div
          className={cn(
            "relative flex items-center justify-center",
            !prefersReducedMotion && "transition-all duration-500",
            isThink && isDramatic && !prefersReducedMotion
              ? "h-48 w-48"
              : "h-40 w-40"
          )}
        >
          {/* Background pulse during dramatic threshold (think mode only) */}
          {isThink && isDramatic && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/10"
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
            {/* Progress ring */}
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
              className={cn(
                ringColor,
                "transition-[stroke-dashoffset] duration-1000 ease-linear"
              )}
              style={{ filter: glowFilter }}
            />
          </svg>

          {/* Center content */}
          <div className="flex flex-col items-center gap-0.5">
            {isThink ? (
              /* Think mode: animated countdown + "Think..." */
              <>
                {prefersReducedMotion ? (
                  <span
                    className={cn(
                      "font-display font-bold tabular-nums text-text-primary",
                      isDramatic
                        ? "text-[length:var(--text-fluid-4xl)]"
                        : "text-[length:var(--text-fluid-3xl)]"
                    )}
                  >
                    {secondsRemaining}
                  </span>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={secondsRemaining}
                      initial={{
                        y: 20,
                        opacity: 0,
                        scale: isDramatic ? 0.8 : 1,
                      }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      exit={{ y: -20, opacity: 0 }}
                      transition={{
                        type: "spring",
                        duration: 0.3,
                        bounce: 0.15,
                      }}
                      className={cn(
                        "font-display font-bold tabular-nums text-text-primary",
                        isDramatic
                          ? "text-[length:var(--text-fluid-4xl)]"
                          : "text-[length:var(--text-fluid-3xl)]"
                      )}
                    >
                      {secondsRemaining}
                    </motion.span>
                  </AnimatePresence>
                )}
                <span className="text-xs font-medium uppercase tracking-widest text-text-secondary">
                  Think&hellip;
                </span>
              </>
            ) : (
              /* Recording mode: MM:SS + "RECORDING" (or custom label) */
              <>
                <span
                  className={cn(
                    "font-display font-bold tabular-nums",
                    "text-[length:var(--text-fluid-xl)]",
                    isDramatic ? "text-red-400" : "text-text-primary"
                  )}
                  role="timer"
                  aria-label={`${secondsRemaining} seconds remaining`}
                >
                  {formatTime(secondsRemaining)}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-widest text-red-400">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  {label ?? "RECORDING"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* "I'm Done" button (recording mode only, after minimum time) */}
        <AnimatePresence>
          {canStopEarly && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={onStopEarly}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-text-primary backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
            >
              I&rsquo;m Done
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Floating badge when inline timer is scrolled out of view */}
      <AnimatePresence>
        {!isInView && (
          <FloatingTimerBadge
            secondsRemaining={secondsRemaining}
            totalSeconds={totalSeconds}
            mode={mode}
            onStopEarly={onStopEarly}
            canStopEarly={canStopEarly}
          />
        )}
      </AnimatePresence>
    </>
  );
}
