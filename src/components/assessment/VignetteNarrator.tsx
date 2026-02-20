"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  calculateWordTiming,
  type AudioWordTiming,
  type WordTiming,
} from "@/lib/assessment/narration-timer";
import { useAudioNarrator } from "@/lib/assessment/use-audio-narrator";

type VignetteNarratorProps = {
  vignetteText: string;
  vignettePrompt: string;
  estimatedNarrationSeconds: number | null;
  showPrompt: boolean;
  onComplete: () => void;
  isActive: boolean;
  audioUrl?: string | null;
  audioTiming?: AudioWordTiming[] | null;
};

export function VignetteNarrator({
  vignetteText,
  vignettePrompt,
  estimatedNarrationSeconds,
  showPrompt,
  onComplete,
  isActive,
  audioUrl = null,
  audioTiming = null,
}: VignetteNarratorProps) {
  const hasCompletedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestWordRef = useRef<HTMLSpanElement>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Audio narrator (no-op when audioUrl is null) ---
  const audio = useAudioNarrator(audioUrl, audioTiming);
  const useAudioMode = audio.hasAudio;

  // --- Timer-based fallback timing ---
  const { words, totalDuration } = useMemo(
    () => calculateWordTiming(vignetteText, estimatedNarrationSeconds),
    [vignetteText, estimatedNarrationSeconds]
  );

  // Group words by sentence for rendering (timer mode only)
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

  // --- State for timer-based reveal ---
  const [timerRevealedCount, setTimerRevealedCount] = useState(0);

  // In reduced-motion + timer mode, reveal all words immediately (no effect needed)
  const effectiveTimerCount =
    !useAudioMode && prefersReducedMotion && isActive
      ? words.length
      : timerRevealedCount;

  // The actual count used for rendering
  const revealedCount = useAudioMode ? audio.revealedCount : effectiveTimerCount;

  // --- Audio mode: auto-play when active ---
  useEffect(() => {
    if (!useAudioMode || !isActive) return;

    if (prefersReducedMotion) {
      // Show all words immediately; audio still plays
      // onComplete fires immediately for text, audio plays in background
    }

    audio.play();
  }, [useAudioMode, isActive, audio, prefersReducedMotion]);

  // --- Audio mode: fire onComplete when audio ends ---
  useEffect(() => {
    if (!useAudioMode) return;
    if (audio.isComplete && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete();
    }
  }, [useAudioMode, audio.isComplete, onComplete]);

  // --- Timer mode: drive reveal with setTimeout per word ---
  useEffect(() => {
    if (useAudioMode) return;
    if (!isActive || words.length === 0) return;

    if (prefersReducedMotion) {
      // Words are revealed immediately via effectiveTimerCount (no setState needed).
      // Fire onComplete after a short delay.
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
        setTimerRevealedCount(i + 1);
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
  }, [useAudioMode, isActive, onComplete, prefersReducedMotion, words, totalDuration]);

  // --- Auto-scroll to keep latest word visible ---
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

  // --- Render ---

  // In audio mode we render a flat word list from audioTiming.
  // In timer mode we render grouped by sentence for <p> tags.
  if (useAudioMode && audioTiming) {
    const showAll = prefersReducedMotion;
    const count = showAll ? audioTiming.length : revealedCount;

    return (
      <div className="w-full space-y-6">
        <div
          className="rounded-2xl border border-border-glass ring-1 ring-inset ring-white/[0.05] bg-bg-elevated/60 p-6 backdrop-blur-xl"
          aria-live="polite"
        >
          <div
            ref={scrollContainerRef}
            className="max-h-[50vh] space-y-3 overflow-y-auto text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
          >
            <p>
              {audioTiming.map((timing, i) => {
                const isRevealed = i < count;
                const isLatest = i === count - 1;

                if (!isRevealed) return null;

                return (
                  <motion.span
                    key={i}
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
                        : { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
                    }
                    className="inline"
                  >
                    {timing.word}
                    {i < audioTiming.length - 1 ? " " : ""}
                  </motion.span>
                );
              })}
            </p>
          </div>
        </div>

        <PromptSection
          showPrompt={showPrompt}
          vignettePrompt={vignettePrompt}
        />
      </div>
    );
  }

  // --- Timer-based fallback rendering ---
  let globalWordIndex = 0;

  return (
    <div className="w-full space-y-6">
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
          {sentenceGroups.length === 0 && (
            <p className="opacity-0">{vignetteText}</p>
          )}
        </div>
      </div>

      <PromptSection showPrompt={showPrompt} vignettePrompt={vignettePrompt} />
    </div>
  );
}

function PromptSection({
  showPrompt,
  vignettePrompt,
}: {
  showPrompt: boolean;
  vignettePrompt: string;
}) {
  if (!showPrompt) return null;

  return (
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
  );
}
