"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  calculateWordTiming,
  type AudioWordTiming,
  type WordTiming,
} from "@/lib/assessment/narration-timer";
import { useAudioNarrator } from "@/lib/assessment/use-audio-narrator";
import { cn } from "@/lib/utils";

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
  // When inactive (post-narration reference view), reveal everything
  const totalWords = useAudioMode ? (audioTiming?.length ?? 0) : words.length;
  const revealedCount = !isActive ? totalWords : useAudioMode ? audio.revealedCount : effectiveTimerCount;

  // --- Audio mode: auto-play when active ---
  useEffect(() => {
    if (!useAudioMode || !isActive) return;
    audio.play();
  }, [useAudioMode, isActive, audio]);

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

  // --- Debug panel (dev only, portaled to body) ---
  const debugPanel =
    process.env.NODE_ENV === "development" && useAudioMode && audioTiming ? (
      <NarrationSyncDebug
        audioRef={audio.audioRef}
        audioTiming={audioTiming}
        revealedCount={revealedCount}
      />
    ) : null;

  // --- Render ---

  // Inactive mode: static text with sentence-grouped paragraphs (no animation)
  if (!isActive) {
    return (
      <>
        {debugPanel}
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
      </>
    );
  }

  // Audio mode: flat word list from audioTiming
  if (useAudioMode && audioTiming) {
    const showAll = prefersReducedMotion;
    const count = showAll ? audioTiming.length : revealedCount;

    return (
      <>
        {debugPanel}
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
          </ScrollableTextBox>

          <PromptSection
            showPrompt={showPrompt}
            vignettePrompt={vignettePrompt}
          />
        </div>
      </>
    );
  }

  // --- Timer-based fallback rendering ---
  let globalWordIndex = 0;

  return (
    <>
    {debugPanel}
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
      </ScrollableTextBox>

      <PromptSection showPrompt={showPrompt} vignettePrompt={vignettePrompt} />
    </div>
    </>
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

// --- Narration Sync Debug Panel (dev only) ---

type NarrationSyncDebugProps = {
  audioRef: RefObject<HTMLAudioElement | null>;
  audioTiming: AudioWordTiming[];
  revealedCount: number;
};

function NarrationSyncDebug({
  audioRef,
  audioTiming,
  revealedCount,
}: NarrationSyncDebugProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const toggle = useCallback(() => setVisible((v) => !v), []);

  // Keep latest values in refs so the rAF loop always reads current data
  // without needing React state deps to re-trigger the effect
  const revealedCountRef = useRef(revealedCount);
  revealedCountRef.current = revealedCount;
  const audioTimingRef = useRef(audioTiming);
  audioTimingRef.current = audioTiming;

  const lastWordEnd =
    audioTiming.length > 0 ? audioTiming[audioTiming.length - 1].end : 0;
  const lastWordEndRef = useRef(lastWordEnd);
  lastWordEndRef.current = lastWordEnd;

  // Self-sustaining rAF loop — starts on mount, polls audioRef each frame.
  // Doesn't depend on React re-renders to restart.
  useEffect(() => {
    if (!visible) return;

    let rafId: number;
    const tick = () => {
      const el = canvasRef.current;
      const audio = audioRef.current;
      const timing = audioTimingRef.current;
      const count = revealedCountRef.current;
      const lwEnd = lastWordEndRef.current;

      if (!el) {
        rafId = requestAnimationFrame(tick);
        return;
      }

      if (!audio || !timing || timing.length === 0) {
        el.innerHTML = `<span style="color:#fbbf24">Waiting for audio\u2026</span>`;
        rafId = requestAnimationFrame(tick);
        return;
      }

      const ct = audio.currentTime;
      const dur = audio.duration;
      const durMismatch = Number.isFinite(dur) ? dur - lwEnd : NaN;

      // Find expected word at current time
      let expectedWord = "-";
      let expectedIdx = -1;
      for (let i = 0; i < timing.length; i++) {
        if (timing[i].start <= ct) {
          expectedIdx = i;
          expectedWord = timing[i].word;
        } else {
          break;
        }
      }
      const expectedCount = expectedIdx + 1;

      // Drift: positive = words ahead of audio, negative = words behind audio
      const drift = count - expectedCount;

      // The word that was just revealed
      const revealedWord =
        count > 0 ? timing[count - 1]?.word ?? "-" : "-";
      const revealedStart =
        count > 0 ? timing[count - 1]?.start?.toFixed(3) ?? "-" : "-";

      el.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 8px;">
          <span style="color:#6ee7b7">currentTime</span><span>${ct.toFixed(3)}s</span>
          <span style="color:#6ee7b7">audio.duration</span><span>${Number.isFinite(dur) ? dur.toFixed(3) + "s" : "loading\u2026"}</span>
          <span style="color:#6ee7b7">lastWord.end</span><span>${lwEnd.toFixed(3)}s</span>
          <span style="color:${Number.isNaN(durMismatch) ? "#9aa0ac" : Math.abs(durMismatch) > 0.1 ? "#fbbf24" : "#6ee7b7"}">duration \u0394</span>
          <span style="color:${Number.isNaN(durMismatch) ? "#9aa0ac" : Math.abs(durMismatch) > 0.1 ? "#fbbf24" : "inherit"}">${Number.isNaN(durMismatch) ? "-" : (durMismatch > 0 ? "+" : "") + durMismatch.toFixed(3) + "s"}</span>
          <span style="color:#6ee7b7">revealed</span><span>${count}/${timing.length} "${revealedWord}" @${revealedStart}</span>
          <span style="color:#6ee7b7">expected</span><span>${expectedCount}/${timing.length} "${expectedWord}"</span>
          <span style="color:${drift === 0 ? "#6ee7b7" : Math.abs(drift) <= 1 ? "#fbbf24" : "#f87171"}">word drift</span>
          <span style="color:${drift === 0 ? "#6ee7b7" : Math.abs(drift) <= 1 ? "#fbbf24" : "#f87171"}">${drift > 0 ? "+" : ""}${drift} words ${drift > 0 ? "(ahead)" : drift < 0 ? "(behind)" : "(synced)"}</span>
        </div>
      `;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [visible, audioRef]);

  if (!visible) {
    return createPortal(
      <button
        type="button"
        onClick={toggle}
        className="fixed top-4 right-4 z-50 rounded-full border border-cyan-500/40 bg-cyan-950/80 px-3 py-1.5 font-mono text-xs text-cyan-400 backdrop-blur-sm"
      >
        SYNC
      </button>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed top-4 right-4 z-50 w-80 rounded-xl border border-cyan-500/30 bg-cyan-950/90 p-3 font-mono text-xs text-cyan-200 shadow-lg shadow-cyan-900/20 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-500">
          Narration Sync
        </span>
        <button
          type="button"
          onClick={toggle}
          className="text-cyan-500/60 hover:text-cyan-400"
          aria-label="Hide sync debug"
        >
          &#x2715;
        </button>
      </div>
      <div ref={canvasRef} />
    </div>,
    document.body
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
