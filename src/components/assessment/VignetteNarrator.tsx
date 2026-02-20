"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  calculateNarrationTiming,
  type NarrationSegment,
} from "@/lib/assessment/narration-timer";

type VignetteNarratorProps = {
  vignetteText: string;
  vignettePrompt: string;
  estimatedNarrationSeconds: number | null;
  showPrompt: boolean;
  onComplete: () => void;
  isActive: boolean;
};

export function VignetteNarrator({
  vignetteText,
  vignettePrompt,
  estimatedNarrationSeconds,
  showPrompt,
  onComplete,
  isActive,
}: VignetteNarratorProps) {
  const [revealedCount, setRevealedCount] = useState(0);
  const segmentsRef = useRef<NarrationSegment[]>([]);
  const totalDurationRef = useRef(0);
  const hasCompletedRef = useRef(false);
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Calculate timing on mount
  useEffect(() => {
    const { segments, totalDuration } = calculateNarrationTiming(
      vignetteText,
      estimatedNarrationSeconds
    );
    segmentsRef.current = segments;
    totalDurationRef.current = totalDuration;
  }, [vignetteText, estimatedNarrationSeconds]);

  // Drive the reveal animation
  useEffect(() => {
    if (!isActive) return;

    const segments = segmentsRef.current;
    if (segments.length === 0) return;

    if (prefersReducedMotion) {
      // Reveal all at once
      setRevealedCount(segments.length);
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        // Small delay so the user can see the text
        const id = setTimeout(onComplete, 1500);
        return () => clearTimeout(id);
      }
      return;
    }

    // Schedule reveal for each segment
    const timers: ReturnType<typeof setTimeout>[] = [];

    segments.forEach((segment, i) => {
      const timer = setTimeout(() => {
        setRevealedCount(i + 1);
      }, segment.startTime * 1000);
      timers.push(timer);
    });

    // Fire completion after all segments revealed
    const completionTimer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
    }, totalDurationRef.current * 1000);
    timers.push(completionTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isActive, onComplete, prefersReducedMotion]);

  const segments = segmentsRef.current;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      {/* Vignette text with progressive reveal */}
      <div
        className="rounded-2xl border border-border-glass bg-bg-elevated/60 p-6 backdrop-blur-xl"
        aria-live="polite"
      >
        <div className="space-y-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
          {segments.map((segment, i) => (
            <p
              key={i}
              className={cn(
                "transition-opacity duration-200",
                i < revealedCount ? "opacity-100" : "opacity-0"
              )}
            >
              {segment.text}
            </p>
          ))}
          {/* Fallback if segments haven't been calculated yet */}
          {segments.length === 0 && (
            <p className="opacity-0">{vignetteText}</p>
          )}
        </div>
      </div>

      {/* Prompt — visible during buffer and recording */}
      {showPrompt && (
        <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
          <p className="mb-1 text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
            Your Prompt
          </p>
          <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
            {vignettePrompt}
          </p>
        </div>
      )}
    </div>
  );
}
