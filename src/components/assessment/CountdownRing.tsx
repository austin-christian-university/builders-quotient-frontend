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
      className="fixed top-[42px] right-4 z-50 flex items-center gap-2.5 border border-ink bg-paper px-3 py-2 md:top-4"
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
            strokeWidth="2"
            className="text-border"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              isThink ? "text-ink" : "text-vermilion",
              "transition-[stroke-dashoffset] duration-1000 ease-linear"
            )}
          />
        </svg>
      </div>

      {/* Time + label */}
      <div className="flex flex-col items-start">
        <span
          className={cn(
            "font-display text-sm font-semibold tabular-nums leading-tight tracking-[-0.02em]",
            isDramatic && !isThink ? "text-vermilion" : "text-ink"
          )}
        >
          {isThink ? secondsRemaining : formatTime(secondsRemaining)}
        </span>
        <span
          className={cn(
            "text-[11px] leading-tight",
            isThink ? "text-text-secondary" : "text-vermilion"
          )}
        >
          {isThink ? "Think" : (
            <span className="flex items-center gap-1">
              <span className="inline-flex h-1.5 w-1.5 bg-vermilion" aria-hidden="true" />
              REC
            </span>
          )}
        </span>
      </div>

      {/* Compact "Done" button */}
      {canStopEarly && onStopEarly && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={onStopEarly}
          className="ml-1 shrink-0 border border-ink bg-transparent px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        >
          Done
        </motion.button>
      )}
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

  // Think = ink stroke; recording is the one live state, so it takes vermilion.
  const ringColor = isThink ? "text-ink" : "text-vermilion";

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
              strokeWidth="2"
              className="text-border"
            />
            {/* Progress ring */}
            <circle
              cx="60"
              cy="60"
              r="54"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="butt"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className={cn(
                ringColor,
                "transition-[stroke-dashoffset] duration-1000 ease-linear"
              )}
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
                      "font-display font-semibold tabular-nums tracking-[-0.04em] text-ink",
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
                        "font-display font-semibold tabular-nums tracking-[-0.04em] text-ink",
                        isDramatic
                          ? "text-[length:var(--text-fluid-4xl)]"
                          : "text-[length:var(--text-fluid-3xl)]"
                      )}
                    >
                      {secondsRemaining}
                    </motion.span>
                  </AnimatePresence>
                )}
                <span className="text-sm text-text-secondary">
                  Think&hellip;
                </span>
              </>
            ) : (
              /* Recording mode: MM:SS + "RECORDING" (or custom label) */
              <>
                <span
                  className={cn(
                    "font-display font-semibold tabular-nums tracking-[-0.03em]",
                    "text-[length:var(--text-fluid-xl)]",
                    isDramatic ? "text-vermilion" : "text-ink"
                  )}
                  role="timer"
                  aria-label={`${secondsRemaining} seconds remaining`}
                >
                  {formatTime(secondsRemaining)}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-vermilion">
                  <span className="inline-flex h-2 w-2 bg-vermilion" aria-hidden="true" />
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
              className="min-h-11 border border-ink bg-transparent px-6 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
            >
              {isThink ? "Done Thinking" : <>I&rsquo;m Done</>}
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
