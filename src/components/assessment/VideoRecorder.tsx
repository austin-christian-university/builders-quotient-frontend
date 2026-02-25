"use client";

import { motion } from "motion/react";

const MIN_SECONDS_BEFORE_STOP = 5;

type VideoRecorderProps = {
  secondsRemaining: number;
  totalSeconds: number;
  phaseLabel: string;
  onStopEarly?: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoRecorder({
  secondsRemaining,
  totalSeconds,
  phaseLabel,
  onStopEarly,
}: VideoRecorderProps) {
  const progress = 1 - secondsRemaining / totalSeconds;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference * (1 - progress);
  const isDramatic = secondsRemaining <= 5;
  const elapsed = totalSeconds - secondsRemaining;
  const canStopEarly = onStopEarly && elapsed >= MIN_SECONDS_BEFORE_STOP;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="flex w-full flex-col items-center gap-4 mt-4"
    >
      {/* Recording indicator */}
      <div className="flex items-center gap-3 rounded-full border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
        </span>
        <span
          className="text-base font-medium tabular-nums text-red-400"
          role="timer"
          aria-live="off"
        >
          Recording &bull; {phaseLabel}
        </span>
      </div>

      {/* Countdown ring */}
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-border-glass"
          />
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
            className="text-red-500 transition-[stroke-dashoffset] duration-1000 ease-linear"
            style={{
              filter: "drop-shadow(0 0 6px rgba(239, 68, 68, 0.6))",
            }}
          />
        </svg>

        <span
          className={`font-display text-[length:var(--text-fluid-xl)] font-bold tabular-nums ${
            isDramatic ? "text-red-400" : "text-text-primary"
          }`}
          aria-label={`${secondsRemaining} seconds remaining`}
        >
          {formatTime(secondsRemaining)}
        </span>
      </div>

      {/* Stop early button */}
      {canStopEarly && (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={onStopEarly}
          className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-sm font-medium text-text-primary backdrop-blur-sm transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base"
        >
          I&rsquo;m Done
        </motion.button>
      )}
    </motion.div>
  );
}
