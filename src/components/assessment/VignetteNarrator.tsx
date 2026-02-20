"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  calculateWordTiming,
  type WordTiming,
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
  const hasCompletedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestWordRef = useRef<HTMLSpanElement>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Calculate word-level timing
  const { words, totalDuration, sentenceCount } = useMemo(
    () => calculateWordTiming(vignetteText, estimatedNarrationSeconds),
    [vignetteText, estimatedNarrationSeconds]
  );

  // Group words by sentence for rendering as <p> tags
  const sentenceGroups = useMemo(() => {
    const groups: WordTiming[][] = [];
    for (const word of words) {
      if (!groups[word.sentenceIndex]) {
        groups[word.sentenceIndex] = [];
      }
      groups[word.sentenceIndex].push(word);
    }
    return groups;
  }, [words]);

  // Drive the reveal — one timer per word, continuous stream
  useEffect(() => {
    if (!isActive || words.length === 0) return;

    if (prefersReducedMotion) {
      setRevealedCount(words.length);
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        const id = setTimeout(onComplete, 1500);
        return () => clearTimeout(id);
      }
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = [];

    words.forEach((word, i) => {
      const timer = setTimeout(() => {
        setRevealedCount(i + 1);
      }, word.startTime * 1000);
      timers.push(timer);
    });

    // Fire completion after total duration
    const completionTimer = setTimeout(() => {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete();
      }
    }, totalDuration * 1000);
    timers.push(completionTimer);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [isActive, onComplete, prefersReducedMotion, words, totalDuration]);

  // Auto-scroll to keep latest word visible
  useEffect(() => {
    if (revealedCount <= 0) return;
    const id = requestAnimationFrame(() => {
      latestWordRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [revealedCount]);

  // Track how many words have been revealed per sentence
  let globalWordIndex = 0;

  return (
    <div className="w-full space-y-6">
      {/* Vignette text with streaming word reveal */}
      <div
        className="rounded-2xl border border-border-glass ring-1 ring-inset ring-white/[0.05] bg-bg-elevated/60 p-6 backdrop-blur-xl"
        aria-live="polite"
      >
        <div
          ref={scrollContainerRef}
          className="max-h-[50vh] space-y-3 overflow-y-auto text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          {sentenceGroups.map((group, sentenceIdx) => {
            const sentenceStartIdx = globalWordIndex;
            globalWordIndex += group.length;
            const sentenceHasAnyRevealed = revealedCount > sentenceStartIdx;

            return (
              <p
                key={sentenceIdx}
                className={
                  !sentenceHasAnyRevealed && !prefersReducedMotion
                    ? "opacity-0"
                    : undefined
                }
              >
                {group.map((word, wordIdx) => {
                  const absIdx = sentenceStartIdx + wordIdx;
                  const isRevealed = absIdx < revealedCount;
                  const isLatest = absIdx === revealedCount - 1;

                  if (!isRevealed) return null;

                  return (
                    <motion.span
                      key={`${sentenceIdx}-${wordIdx}`}
                      ref={isLatest ? latestWordRef : undefined}
                      initial={
                        prefersReducedMotion
                          ? false
                          : { opacity: 0, y: 6, filter: "blur(4px)" }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={
                        prefersReducedMotion
                          ? { duration: 0 }
                          : {
                              duration: 0.4,
                              ease: [0.16, 1, 0.3, 1],
                            }
                      }
                      className="inline"
                    >
                      {word.text}
                      {wordIdx < group.length - 1 ? " " : ""}
                    </motion.span>
                  );
                })}
              </p>
            );
          })}
          {/* Fallback if words haven't been calculated yet */}
          {sentenceGroups.length === 0 && (
            <p className="opacity-0">{vignetteText}</p>
          )}
        </div>
      </div>

      {/* Prompt — visible during buffer and recording */}
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-secondary/30 bg-secondary/5 p-5"
        >
          <p className="mb-1 text-[length:var(--text-fluid-xs)] font-medium uppercase tracking-[0.3em] text-secondary">
            Your Prompt
          </p>
          <p className="text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary">
            {vignettePrompt}
          </p>
        </motion.div>
      )}
    </div>
  );
}
