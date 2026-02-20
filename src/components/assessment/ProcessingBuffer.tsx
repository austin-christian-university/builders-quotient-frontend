"use client";

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
  const isPulsing = secondsRemaining <= 5;

  return (
    <div className="flex flex-col items-center gap-4" aria-live="polite">
      {/* Circular progress */}
      <div className="relative flex h-32 w-32 items-center justify-center">
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
            className="text-secondary transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>

        {/* Countdown number */}
        <span
          className={cn(
            "font-display text-[length:var(--text-fluid-3xl)] font-bold tabular-nums text-secondary",
            isPulsing && "animate-pulse"
          )}
        >
          {secondsRemaining}
        </span>
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
