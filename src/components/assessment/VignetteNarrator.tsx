"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { motion } from "motion/react";
import {
  calculateWordTiming,
  type AudioWordTiming,
  type WordTiming,
} from "@/lib/assessment/narration-timer";
import type { AudioNarratorResult } from "@/lib/assessment/use-audio-narrator";
import { cn } from "@/lib/utils";

type VignetteNarratorProps = {
  vignetteText: string;
  vignettePrompt: string;
  estimatedNarrationSeconds: number | null;
  showPrompt: boolean;
  onComplete: () => void;
  isActive: boolean;
  /** Audio narrator state, managed by the parent (VignetteExperience). */
  audio: AudioNarratorResult;
  audioTiming?: AudioWordTiming[] | null;
};

export function VignetteNarrator({
  vignetteText,
  vignettePrompt,
  estimatedNarrationSeconds,
  showPrompt,
  onComplete,
  isActive,
  audio,
  audioTiming = null,
}: VignetteNarratorProps) {
  const hasCompletedRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const latestWordRef = useRef<HTMLSpanElement>(null);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  // When inactive (post-narration reference view), reveal everything
  const totalWords = useAudioMode ? (audioTiming?.length ?? 0) : words.length;
  const revealedCount = !isActive ? totalWords : useAudioMode ? audio.revealedCount : effectiveTimerCount;

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

  // Inactive mode: static text with sentence-grouped paragraphs (no animation)
  if (!isActive) {
    return (
      <div className="w-full space-y-6">
        <ScrollableTextBox scrollContainerRef={scrollContainerRef}>
          {sentenceGroups.map((group, sentenceIdx) => (
            <p key={sentenceIdx}>
              {group.map((word, wordIdx) => (
                <span key={wordIdx} className="inline">
                  {word.text}
                  {wordIdx < group.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          ))}
        </ScrollableTextBox>

        <PromptSection showPrompt={showPrompt} vignettePrompt={vignettePrompt} />
      </div>
    );
  }

  // Audio mode: flat word list from audioTiming
  if (useAudioMode && audioTiming) {
    const showAll = prefersReducedMotion;
    const count = showAll ? audioTiming.length : revealedCount;

    return (
      <div className="w-full space-y-6">
        <ScrollableTextBox scrollContainerRef={scrollContainerRef} ariaLive="polite">
          <p>
            {audioTiming.map((timing, i) => {
              if (i >= count) return null;

              const isActive = i === count - 1 && !showAll;
              const isLast = i === audioTiming.length - 1;

              // Complete words: plain static span
              if (!isActive) {
                return (
                  <span key={i} className="inline">
                    {timing.word}
                    {!isLast ? " " : ""}
                  </span>
                );
              }

              // Active word: per-character animated reveal
              return (
                <ActiveWord
                  key={i}
                  ref={latestWordRef}
                  word={timing.word}
                  wordStart={timing.start}
                  wordEnd={timing.end}
                  currentTimeRef={audio.currentTimeRef}
                  trailingSpace={!isLast}
                />
              );
            })}
          </p>

          <NarrationDebugBar
            mode="audio"
            hasFailed={audio.hasFailed}
            audioRef={audio.audioRef}
            audioTiming={audioTiming}
            revealedCount={revealedCount}
            totalWords={totalWords}
            isActive
          />
        </ScrollableTextBox>

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
      <ScrollableTextBox scrollContainerRef={scrollContainerRef} ariaLive="polite">
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
                if (absIdx >= revealedCount) return null;

                const isActiveWord =
                  absIdx === revealedCount - 1 && !prefersReducedMotion;
                const isLastInGroup = wordIdx === group.length - 1;

                // Complete words: plain static span
                if (!isActiveWord) {
                  return (
                    <span key={`${sentenceIdx}-${wordIdx}`} className="inline">
                      {word.text}
                      {!isLastInGroup ? " " : ""}
                    </span>
                  );
                }

                // Active word in timer mode: interpolate timing from word startTimes
                const nextWord = words[absIdx + 1];
                const wordEndTime = nextWord
                  ? nextWord.startTime
                  : totalDuration;

                return (
                  <ActiveWord
                    key={`${sentenceIdx}-${wordIdx}`}
                    ref={latestWordRef}
                    word={word.text}
                    wordStart={word.startTime}
                    wordEnd={wordEndTime}
                    trailingSpace={!isLastInGroup}
                  />
                );
              })}
            </p>
          );
        })}
        {sentenceGroups.length === 0 && (
          <p className="opacity-0">{vignetteText}</p>
        )}

        <NarrationDebugBar
          mode="timer"
          hasFailed={audio.hasFailed}
          audioRef={audio.audioRef}
          audioTiming={audioTiming}
          revealedCount={revealedCount}
          totalWords={totalWords}
          isActive
        />
      </ScrollableTextBox>

      <PromptSection showPrompt={showPrompt} vignettePrompt={vignettePrompt} />
    </div>
  );
}

// --- ActiveWord: per-character fade-in reveal ---

import { forwardRef } from "react";

type ActiveWordProps = {
  word: string;
  wordStart: number;
  wordEnd: number;
  currentTimeRef?: RefObject<number>;
  trailingSpace: boolean;
};

const ActiveWord = forwardRef<HTMLSpanElement, ActiveWordProps>(
  function ActiveWord({ word, wordStart, wordEnd, trailingSpace }, ref) {
    const chars = [...word]; // handles Unicode
    const wordDuration = Math.max(wordEnd - wordStart, 0.05);
    const charAnimDuration = 0.12; // 120ms per character

    return (
      <span ref={ref} className="inline whitespace-nowrap">
        {chars.map((char, i) => {
          const delay = (i / chars.length) * wordDuration;
          return (
            <span
              key={i}
              className="inline-block opacity-0"
              style={{
                animation: `char-reveal ${charAnimDuration}s ease-out both`,
                animationDelay: `${delay}s`,
              }}
            >
              {char}
            </span>
          );
        })}
        {trailingSpace && <span className="inline"> </span>}
      </span>
    );
  }
);

// --- Narration Debug Bar (dev only, inline) ---

type NarrationDebugBarProps = {
  mode: "audio" | "timer";
  hasFailed: boolean;
  audioRef: RefObject<HTMLAudioElement | null>;
  audioTiming: AudioWordTiming[] | null;
  revealedCount: number;
  totalWords: number;
  isActive: boolean;
};

function NarrationDebugBar({
  mode,
  hasFailed,
  audioRef,
  audioTiming,
  revealedCount,
  totalWords,
  isActive,
}: NarrationDebugBarProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Keep latest values in refs so the rAF loop reads current data
  const revealedCountRef = useRef(revealedCount);
  revealedCountRef.current = revealedCount;
  const audioTimingRef = useRef(audioTiming);
  audioTimingRef.current = audioTiming;
  const totalWordsRef = useRef(totalWords);
  totalWordsRef.current = totalWords;

  // Self-sustaining rAF loop — writes directly to DOM via ref.innerHTML
  useEffect(() => {
    const startTime = performance.now();
    let rafId: number;

    const tick = () => {
      const el = canvasRef.current;
      if (!el) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      const count = revealedCountRef.current;
      const total = totalWordsRef.current;
      const timing = audioTimingRef.current;
      const audio = audioRef.current;

      if (mode === "audio" && audio && timing && timing.length > 0) {
        const ct = audio.currentTime;
        const dur = audio.duration;
        const lwEnd = timing[timing.length - 1].end;
        const durMismatch = Number.isFinite(dur) ? dur - lwEnd : NaN;

        // Find expected word at current time
        let expectedIdx = -1;
        for (let i = 0; i < timing.length; i++) {
          if (timing[i].start <= ct) expectedIdx = i;
          else break;
        }
        const expectedCount = expectedIdx + 1;
        const drift = count - expectedCount;

        const driftColor = drift === 0 ? "#6ee7b7" : Math.abs(drift) <= 1 ? "#fbbf24" : "#f87171";
        const durColor = Number.isNaN(durMismatch) ? "#9aa0ac" : Math.abs(durMismatch) > 0.1 ? "#fbbf24" : "#6ee7b7";

        el.innerHTML =
          `<span style="color:#6ee7b7;font-weight:600">AUDIO</span>` +
          ` &middot; ${ct.toFixed(2)}/${Number.isFinite(dur) ? dur.toFixed(2) : "?"}s` +
          ` &middot; <span style="color:${durColor}">\u0394${Number.isNaN(durMismatch) ? "?" : (durMismatch > 0 ? "+" : "") + durMismatch.toFixed(2)}s</span>` +
          ` &middot; ${count}/${total}` +
          ` &middot; <span style="color:${driftColor}">drift ${drift > 0 ? "+" : ""}${drift}</span>`;
      } else {
        // Timer mode
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
        const modeLabel = hasFailed
          ? `<span style="color:#f87171;font-weight:600">TIMER (audio failed)</span>`
          : `<span style="color:#fbbf24;font-weight:600">TIMER</span>`;
        el.innerHTML = `${modeLabel} &middot; ${count}/${total} &middot; ${elapsed}s`;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [mode, hasFailed, audioRef]);

  if (process.env.NODE_ENV !== "development" || !isActive) return null;

  return (
    <div
      ref={canvasRef}
      className="border-t border-white/10 pt-2 mt-4 font-mono text-[10px] text-green-400/80"
    />
  );
}

// --- ScrollableTextBox: glass card with Duolingo-style scroll indicators ---

function ScrollableTextBox({
  scrollContainerRef,
  ariaLive,
  children,
}: {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  ariaLive?: "polite";
  children: React.ReactNode;
}) {
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const update = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setCanScrollUp(scrollTop > 2);
      setCanScrollDown(scrollTop + clientHeight < scrollHeight - 2);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [scrollContainerRef]);

  return (
    <div
      className="rounded-2xl border border-border-glass ring-1 ring-inset ring-white/[0.05] bg-bg-elevated/60 p-6 backdrop-blur-xl"
      aria-live={ariaLive}
    >
      <div className="relative">
        {/* Top scroll indicator */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-opacity duration-200",
            canScrollUp ? "opacity-100" : "opacity-0"
          )}
        />

        <div
          ref={scrollContainerRef}
          className="max-h-[50vh] space-y-3 overflow-y-auto pr-3 text-[length:var(--text-fluid-base)] leading-relaxed text-text-primary scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
        >
          {children}
        </div>

        {/* Bottom scroll indicator */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent transition-opacity duration-200",
            canScrollDown ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
}

// --- PromptSection ---

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
